import { EventEmitter } from 'events';

export interface PollOptions {
  maxWaitTime?: number;
  pollInterval?: number;
}

/**
 * Polling Engine
 * Responsibility: Generic lifecycle management for asynchronous jobs.
 */
export class PollingEngine extends EventEmitter {
  /**
   * Poll a job until it reaches a terminal state (completed or failed)
   */
  async waitForCompletion<T>(
    jobId: string,
    fetchStatus: (id: string) => Promise<any>,
    options: PollOptions = {}
  ): Promise<any> {
    const { maxWaitTime = 3600000, pollInterval = 5000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await fetchStatus(jobId);
      
      this.emit('status-update', { jobId, status });

      if (status.status === 'completed') return status;
      if (status.status === 'failed') throw new Error(`Job ${jobId} failed: ${status.error}`);

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Job ${jobId} timed out after ${maxWaitTime}ms`);
  }
}
