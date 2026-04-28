import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Matrix-3D Client
 * Integrates with Matrix-3D for omnidirectional 3D scene generation
 * Supports text-to-scene and image-to-scene generation
 */

export interface Matrix3DConfig {
  endpoint: string;
  timeout?: number;
  retries?: number;
}

export interface SceneGenerationRequest {
  prompt: string;
  resolution?: 480 | 720 | 1080;
  reconstructionMethod?: 'optimization' | 'feed-forward';
  cameraTrajectory?: 'straight' | 's-curve' | 'forward-right' | 'circular' | 'custom';
  customTrajectoryJson?: string;
  outputFormat?: 'ply' | 'glb' | 'usdz';
}

export interface ImageToSceneRequest extends SceneGenerationRequest {
  imagePath: string;
  imageUrl?: string;
}

export interface SceneGenerationResponse {
  jobId: string;
  plyPath: string;
  videoPath: string;
  panoramicImagePath: string;
  outputDir: string;
  resolution: number;
  cameraTrajectory: string;
  createdAt: string;
  completedAt: string;
}

export interface SceneJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep?: string; // 'panoramic-image', 'panoramic-video', '3d-extraction'
  plyPath?: string;
  videoPath?: string;
  error?: string;
  estimatedTimeRemaining?: number; // seconds
}

export class Matrix3DClient extends EventEmitter {
  private client: AxiosInstance;
  private endpoint: string;
  private retries: number;

  constructor(config: Matrix3DConfig) {
    super();
    this.endpoint = config.endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.retries = config.retries || 3;

    this.client = axios.create({
      baseURL: this.endpoint,
      timeout: config.timeout || 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || !config.retry) {
          config.retry = 0;
        }

        config.retry += 1;

        if (config.retry <= this.retries && error.response?.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * config.retry));
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate 3D scene from text prompt
   */
  async generateTextToScene(request: SceneGenerationRequest): Promise<SceneGenerationResponse> {
    try {
      const response = await this.client.post<SceneGenerationResponse>(
        '/api/v1/generate/text-to-scene',
        {
          prompt: request.prompt,
          resolution: request.resolution || 720,
          reconstruction_method: request.reconstructionMethod || 'optimization',
          camera_trajectory: request.cameraTrajectory || 'straight',
          custom_trajectory_json: request.customTrajectoryJson,
          output_format: request.outputFormat || 'ply'
        }
      );

      this.emit('scene-generated', {
        type: 'text-to-scene',
        jobId: response.data.jobId,
        plyPath: response.data.plyPath
      });

      return response.data;
    } catch (error) {
      this.emit('error', { type: 'text-to-scene', error });
      throw this.handleError(error, 'text-to-scene generation');
    }
  }

  /**
   * Generate 3D scene from image
   */
  async generateImageToScene(request: ImageToSceneRequest): Promise<SceneGenerationResponse> {
    try {
      const formData = new FormData();
      formData.append('prompt', request.prompt);
      formData.append('resolution', String(request.resolution || 720));
      formData.append('reconstruction_method', request.reconstructionMethod || 'optimization');
      formData.append('camera_trajectory', request.cameraTrajectory || 'straight');
      formData.append('output_format', request.outputFormat || 'ply');

      if (request.customTrajectoryJson) {
        formData.append('custom_trajectory_json', request.customTrajectoryJson);
      }

      // Handle image upload
      if (request.imagePath) {
        const imageBuffer = fs.readFileSync(request.imagePath);
        formData.append('image', imageBuffer, 'image.jpg');
      } else if (request.imageUrl) {
        formData.append('image_url', request.imageUrl);
      } else {
        throw new Error('Either imagePath or imageUrl must be provided');
      }

      const response = await this.client.post<SceneGenerationResponse>(
        '/api/v1/generate/image-to-scene',
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      this.emit('scene-generated', {
        type: 'image-to-scene',
        jobId: response.data.jobId,
        plyPath: response.data.plyPath
      });

      return response.data;
    } catch (error) {
      this.emit('error', { type: 'image-to-scene', error });
      throw this.handleError(error, 'image-to-scene generation');
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<SceneJobStatus> {
    try {
      const response = await this.client.get<SceneJobStatus>(`/api/v1/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `get job status for ${jobId}`);
    }
  }

  /**
   * Poll job until completion
   */
  async waitForCompletion(
    jobId: string,
    maxWaitTime: number = 7200000, // 2 hours default
    pollInterval: number = 10000 // 10 seconds
  ): Promise<SceneGenerationResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getJobStatus(jobId);

      this.emit('job-status', { jobId, status });

      if (status.status === 'completed') {
        return {
          jobId: status.jobId,
          plyPath: status.plyPath!,
          videoPath: status.videoPath!,
          panoramicImagePath: '',
          outputDir: '',
          resolution: 720,
          cameraTrajectory: status.currentStep || 'straight',
          createdAt: '',
          completedAt: ''
        };
      }

      if (status.status === 'failed') {
        throw new Error(`Job ${jobId} failed: ${status.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Job ${jobId} did not complete within ${maxWaitTime}ms`);
  }

  /**
   * Generate multiple scenes (batch processing)
   */
  async generateScenesBatch(
    prompts: string[],
    options?: {
      resolution?: 480 | 720 | 1080;
      reconstructionMethod?: 'optimization' | 'feed-forward';
      cameraTrajectory?: 'straight' | 's-curve' | 'forward-right' | 'circular' | 'custom';
    }
  ): Promise<SceneGenerationResponse[]> {
    const scenes: SceneGenerationResponse[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];

      try {
        const response = await this.generateTextToScene({
          prompt,
          resolution: options?.resolution || 720,
          reconstructionMethod: options?.reconstructionMethod || 'feed-forward', // Faster for batch
          cameraTrajectory: options?.cameraTrajectory || 'straight'
        });

        // Wait for completion
        const completed = await this.waitForCompletion(response.jobId);
        scenes.push(completed);

        this.emit('scene-batch-progress', {
          completed: i + 1,
          total: prompts.length,
          percentage: Math.round(((i + 1) / prompts.length) * 100)
        } as any);
      } catch (error) {
        this.emit('error', {
          type: 'scene-batch',
          sceneIndex: i,
          error
        });
        throw error;
      }
    }

    return scenes;
  }

  /**
   * Download generated scene (PLY file)
   */
  async downloadScene(
    jobId: string,
    outputPath: string
  ): Promise<void> {
    try {
      const response = await this.client.get(
        `/api/v1/jobs/${jobId}/download`,
        { responseType: 'stream' }
      );

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      throw this.handleError(error, `download scene ${jobId}`);
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await this.client.post(`/api/v1/jobs/${jobId}/cancel`);
      this.emit('job-cancelled', { jobId });
    } catch (error) {
      throw this.handleError(error, `cancel job ${jobId}`);
    }
  }

  /**
   * List recent jobs
   */
  async listJobs(limit: number = 10): Promise<SceneJobStatus[]> {
    try {
      const response = await this.client.get<SceneJobStatus[]>('/api/v1/jobs', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'list jobs');
    }
  }

  /**
   * Get server health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    gpuAvailable: boolean;
    queueLength: number;
    averageProcessingTime: number; // seconds
  }> {
    try {
      const response = await this.client.get('/api/v1/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'get health status');
    }
  }

  /**
   * Get API statistics
   */
  async getStats(): Promise<{
    totalScenesGenerated: number;
    totalJobsCompleted: number;
    totalJobsFailed: number;
    averageProcessingTime: number;
    totalComputeHours: number;
  }> {
    try {
      const response = await this.client.get('/api/v1/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'get stats');
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: any, context: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 400) {
        return new Error(`Bad request: ${message}`);
      } else if (status === 404) {
        return new Error(`Not found: ${message}`);
      } else if (status === 429) {
        return new Error(`Rate limit exceeded. Please retry after some time.`);
      } else if (status === 500) {
        return new Error(`Server error: ${message}`);
      } else if (status === 503) {
        return new Error(`Service unavailable. GPU cluster may be overloaded.`);
      }

      return new Error(`Matrix-3D API error (${status}): ${message}`);
    }

    return new Error(`Failed to ${context}: ${error.message}`);
  }
}

/**
 * Singleton instance
 */
let instance: Matrix3DClient | null = null;

export function initMatrix3D(config: Matrix3DConfig): Matrix3DClient {
  instance = new Matrix3DClient(config);
  return instance;
}

export function getMatrix3D(): Matrix3DClient {
  if (!instance) {
    throw new Error('Matrix-3D client not initialized. Call initMatrix3D first.');
  }
  return instance;
}
