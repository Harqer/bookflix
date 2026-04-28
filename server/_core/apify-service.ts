import axios from 'axios';
import { ENV } from './env';

export interface ApifyRunResult {
  id: string;
  datasetId: string;
}

/**
 * Enterprise Apify Service
 * Implements high-performance research with Actor Standby, Residential Proxies, 
 * and Webhook-driven orchestration.
 */
export class ApifyService {
  private static API_BASE = 'https://api.apify.com/v2';
  private static TOKEN = ENV.apifyApiToken || process.env.APIFY_API_TOKEN;

  /**
   * Triggers an Apify actor with Enterprise-grade configurations.
   */
  static async runActor(
    actorId: string, 
    input: any, 
    options: { useProxy?: boolean, standby?: boolean } = {}
  ): Promise<ApifyRunResult> {
    if (!this.TOKEN) throw new Error("APIFY_API_TOKEN is not configured.");

    console.log(`[Apify] Triggering actor ${actorId} (Standby: ${!!options.standby})...`);
    
    const payload = {
      ...input,
      // Residential Proxy: Crucial for bypassing enterprise anti-scraping
      proxyConfiguration: options.useProxy ? { useApifyProxy: true, groups: ['RESIDENTIAL'] } : undefined,
      // Standby Mode: Low-latency execution for real-time agents
      waitForwardTerm: options.standby ? 300 : undefined 
    };

    const response = await axios.post(
      `${this.API_BASE}/acts/${actorId}/runs?token=${this.TOKEN}`,
      payload
    );

    return {
      id: response.data.data.id,
      datasetId: response.data.data.defaultDatasetId
    };
  }

  /**
   * Configures an Ad-hoc Webhook to notify our server when research is complete.
   * This removes the need for polling and optimizes serverless costs.
   */
  static async createWebhook(runId: string, targetUrl: string) {
    if (!this.TOKEN) return;
    
    await axios.post(`${this.API_BASE}/webhooks?token=${this.TOKEN}`, {
      isAdHoc: true,
      eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
      condition: { runId },
      requestUrl: targetUrl,
      payloadTemplate: JSON.stringify({
        runId: '{{resource.id}}',
        status: '{{eventData.status}}',
        datasetId: '{{resource.defaultDatasetId}}'
      })
    });
  }

  /**
   * Retrieves dataset items from a completed run
   */
  static async getDatasetItems(datasetId: string): Promise<any[]> {
    if (!this.TOKEN) throw new Error("APIFY_API_TOKEN is not configured.");
    const response = await axios.get(`${this.API_BASE}/datasets/${datasetId}/items?token=${this.TOKEN}`);
    return response.data;
  }

  /**
   * Helper to wait for a run to finish (Polling - Fallback only)
   */
  static async waitForRun(runId: string, timeoutMs: number = 300000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const response = await axios.get(`${this.API_BASE}/actor-runs/${runId}?token=${this.TOKEN}`);
      const status = response.data.data.status;
      if (status === 'SUCCEEDED') return true;
      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
        throw new Error(`Apify run ${runId} failed: ${status}`);
      }
      await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error(`Apify run ${runId} timed out.`);
  }
}
