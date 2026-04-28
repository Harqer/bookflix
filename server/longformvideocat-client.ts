import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

/**
 * LongFormVideoCat Client
 * Integrates with LongFormVideoCat API for long-form video generation
 * Supports text-to-video, image-to-video, and video continuation
 */

export interface LongFormVideoCatConfig {
  apiKey: string;
  endpoint: string;
  timeout?: number;
  retries?: number;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number; // seconds (default: 10)
  resolution?: 'low' | 'medium' | 'high'; // 480p, 720p, 1080p
  fps?: number; // frames per second (default: 30)
  format?: 'mp4' | 'webm';
  seed?: number; // for reproducibility
}

export interface ImageToVideoRequest extends VideoGenerationRequest {
  imagePath: string;
  imageUrl?: string;
}

export interface VideoContinuationRequest extends VideoGenerationRequest {
  previousVideoUrl: string;
  seamlessTransition?: boolean;
}

export interface VideoGenerationResponse {
  jobId: string;
  videoUrl: string;
  duration: number;
  resolution: string;
  fps: number;
  fileSize: number;
  createdAt: string;
  completedAt: string;
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  videoUrl?: string;
  error?: string;
  estimatedTimeRemaining?: number; // seconds
}

export class LongFormVideoCatClient extends EventEmitter {
  private client: AxiosInstance;
  private apiKey: string;
  private endpoint: string;
  private retries: number;

  constructor(config: LongFormVideoCatConfig) {
    super();
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.retries = config.retries || 3;

    this.client = axios.create({
      baseURL: this.endpoint,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
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
   * Generate video from text prompt
   */
  async generateTextToVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await this.client.post<VideoGenerationResponse>(
        '/api/v1/generate/text-to-video',
        {
          prompt: request.prompt,
          duration: request.duration || 10,
          resolution: request.resolution || 'high',
          fps: request.fps || 30,
          format: request.format || 'mp4',
          seed: request.seed
        }
      );

      this.emit('video-generated', {
        type: 'text-to-video',
        jobId: response.data.jobId,
        videoUrl: response.data.videoUrl
      });

      return response.data;
    } catch (error) {
      this.emit('error', { type: 'text-to-video', error });
      throw this.handleError(error, 'text-to-video generation');
    }
  }

  /**
   * Generate video from image
   */
  async generateImageToVideo(request: ImageToVideoRequest): Promise<VideoGenerationResponse> {
    try {
      const formData = new FormData();
      formData.append('prompt', request.prompt);
      formData.append('duration', String(request.duration || 10));
      formData.append('resolution', request.resolution || 'high');
      formData.append('fps', String(request.fps || 30));
      formData.append('format', request.format || 'mp4');

      if (request.seed) {
        formData.append('seed', String(request.seed));
      }

      // Handle image upload
      if (request.imagePath) {
        const fs = await import('fs');
        const imageBuffer = fs.readFileSync(request.imagePath);
        formData.append('image', new Blob([imageBuffer]), 'image.jpg');
      } else if (request.imageUrl) {
        formData.append('image_url', request.imageUrl);
      } else {
        throw new Error('Either imagePath or imageUrl must be provided');
      }

      const response = await this.client.post<VideoGenerationResponse>(
        '/api/v1/generate/image-to-video',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      this.emit('video-generated', {
        type: 'image-to-video',
        jobId: response.data.jobId,
        videoUrl: response.data.videoUrl
      });

      return response.data;
    } catch (error) {
      this.emit('error', { type: 'image-to-video', error });
      throw this.handleError(error, 'image-to-video generation');
    }
  }

  /**
   * Continue video seamlessly
   */
  async continueVideo(request: VideoContinuationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await this.client.post<VideoGenerationResponse>(
        '/api/v1/generate/video-continuation',
        {
          previous_video_url: request.previousVideoUrl,
          prompt: request.prompt,
          duration: request.duration || 10,
          resolution: request.resolution || 'high',
          fps: request.fps || 30,
          format: request.format || 'mp4',
          seamless_transition: request.seamlessTransition !== false,
          seed: request.seed
        }
      );

      this.emit('video-generated', {
        type: 'video-continuation',
        jobId: response.data.jobId,
        videoUrl: response.data.videoUrl
      });

      return response.data;
    } catch (error) {
      this.emit('error', { type: 'video-continuation', error });
      throw this.handleError(error, 'video continuation');
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const response = await this.client.get<JobStatus>(`/api/v1/jobs/${jobId}`);
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
    maxWaitTime: number = 3600000, // 1 hour default
    pollInterval: number = 5000 // 5 seconds
  ): Promise<VideoGenerationResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getJobStatus(jobId);

      this.emit('job-status', { jobId, status });

      if (status.status === 'completed') {
        return {
          jobId: status.jobId,
          videoUrl: status.videoUrl!,
          duration: 0,
          resolution: '',
          fps: 30,
          fileSize: 0,
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
   * Generate long-form video (multiple segments with continuation)
   */
  async generateLongFormVideo(
    prompts: string[],
    options?: {
      duration?: number;
      resolution?: 'low' | 'medium' | 'high';
      fps?: number;
    }
  ): Promise<string[]> {
    const videoUrls: string[] = [];
    let previousVideoUrl: string | null = null;

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];

      try {
        let response: VideoGenerationResponse;

        if (i === 0) {
          // First segment: text-to-video
          response = await this.generateTextToVideo({
            prompt,
            duration: options?.duration || 10,
            resolution: options?.resolution || 'high',
            fps: options?.fps || 30
          });
        } else {
          // Subsequent segments: video continuation
          response = await this.continueVideo({
            previousVideoUrl: previousVideoUrl!,
            prompt,
            duration: options?.duration || 10,
            resolution: options?.resolution || 'high',
            fps: options?.fps || 30,
            seamlessTransition: true
          });
        }

        // Wait for completion
        const completed = await this.waitForCompletion(response.jobId);
        videoUrls.push(completed.videoUrl);
        previousVideoUrl = completed.videoUrl;

        this.emit('segment-completed', {
          segmentIndex: i,
          totalSegments: prompts.length,
          videoUrl: completed.videoUrl
        });
      } catch (error) {
        this.emit('error', {
          type: 'long-form-video',
          segmentIndex: i,
          error
        });
        throw error;
      }
    }

    return videoUrls;
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
  async listJobs(limit: number = 10): Promise<JobStatus[]> {
    try {
      const response = await this.client.get<JobStatus[]>('/api/v1/jobs', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'list jobs');
    }
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<{
    totalMinutesGenerated: number;
    totalJobsCompleted: number;
    totalJobsFailed: number;
    quotaRemaining: number;
  }> {
    try {
      const response = await this.client.get('/api/v1/usage');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'get usage stats');
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: any, context: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 401) {
        return new Error(`Authentication failed: Invalid API key`);
      } else if (status === 429) {
        return new Error(`Rate limit exceeded. Please retry after some time.`);
      } else if (status === 400) {
        return new Error(`Bad request: ${message}`);
      } else if (status === 500) {
        return new Error(`Server error: ${message}`);
      }

      return new Error(`LongFormVideoCat API error (${status}): ${message}`);
    }

    return new Error(`Failed to ${context}: ${error.message}`);
  }
}

/**
 * Singleton instance
 */
let instance: LongFormVideoCatClient | null = null;

export function initLongFormVideoCat(config: LongFormVideoCatConfig): LongFormVideoCatClient {
  instance = new LongFormVideoCatClient(config);
  return instance;
}

export function getLongFormVideoCat(): LongFormVideoCatClient {
  if (!instance) {
    throw new Error('LongFormVideoCat client not initialized. Call initLongFormVideoCat first.');
  }
  return instance;
}
