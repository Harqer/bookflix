import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { PollingEngine } from './_core/polling-engine';

/**
 * LongFormVideoCat Client
 * Refactored using Invisible Atomic Design principles.
 * Decomposed into: Transport (Axios), Polling (Engine), and Orchestration (Long-Form).
 */

export interface LongFormVideoCatConfig {
  apiKey: string;
  endpoint: string;
  timeout?: number;
  retries?: number;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  resolution?: 'low' | 'medium' | 'high';
  fps?: number;
  format?: 'mp4' | 'webm';
  seed?: number;
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
  progress: number;
  videoUrl?: string;
  error?: string;
  estimatedTimeRemaining?: number;
}

export class LongFormVideoCatClient extends EventEmitter {
  private client: AxiosInstance;
  private poller: PollingEngine;

  constructor(config: LongFormVideoCatConfig) {
    super();
    this.poller = new PollingEngine();
    this.client = axios.create({
      baseURL: config.endpoint.replace(/\/$/, ''),
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Forward polling status to client emitters
    this.poller.on('status-update', (data) => this.emit('job-status', data));
  }

  /**
   * Atomic: Raw API Dispatch (Text-to-Video)
   */
  async generateTextToVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await this.client.post<VideoGenerationResponse>('/api/v1/generate/text-to-video', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Atomic: Raw API Dispatch (Video Continuation)
   */
  async continueVideo(request: VideoContinuationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await this.client.post<VideoGenerationResponse>('/api/v1/generate/video-continuation', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Atomic: Job Monitoring (Delegated to PollingEngine)
   */
  async waitForCompletion(jobId: string, maxWait?: number): Promise<VideoGenerationResponse> {
    const status = await this.poller.waitForCompletion(jobId, (id) => this.getJobStatus(id), { maxWaitTime: maxWait });
    return {
      jobId: status.jobId,
      videoUrl: status.videoUrl!,
      fps: 30, // Default fallback
    } as VideoGenerationResponse;
  }

  /**
   * Orchestrate: Multi-Segment Logic (Composite)
   */
  async generateLongFormVideo(prompts: string[], options?: any): Promise<string[]> {
    const videoUrls: string[] = [];
    let previousUrl: string | null = null;

    for (let i = 0; i < prompts.length; i++) {
      const response = i === 0 
        ? await this.generateTextToVideo({ prompt: prompts[i], ...options })
        : await this.continueVideo({ previousVideoUrl: previousUrl!, prompt: prompts[i], ...options });

      const completed = await this.waitForCompletion(response.jobId);
      videoUrls.push(completed.videoUrl);
      previousUrl = completed.videoUrl;
    }
    return videoUrls;
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await this.client.get<JobStatus>(`/api/v1/jobs/${jobId}`);
    return response.data;
  }

  private handleError(error: any): Error {
    const message = axios.isAxiosError(error) ? error.response?.data?.message || error.message : error.message;
    return new Error(`[VideoCat API] ${message}`);
  }
}

let instance: LongFormVideoCatClient | null = null;
export const initLongFormVideoCat = (config: LongFormVideoCatConfig) => instance = new LongFormVideoCatClient(config);
export const getLongFormVideoCat = () => {
  if (!instance) throw new Error('Not initialized');
  return instance;
};
