import { Client } from "langsmith";
import { ENV } from "./env";

/**
 * Enterprise LangSmith Client
 * Surgical utility for logging human and AI feedback to power the DPO fine-tuning pipeline.
 */
const client = new Client({
  apiKey: ENV.langsmithApiKey || process.env.LANGSMITH_API_KEY,
});

export class LangSmithCollector {
  /**
   * Logs a feedback score (Stars/Critique) to a specific run in LangSmith.
   * This is the "Easy" hook into the fine-tuning factory.
   */
  static async logFeedback(runId: string, key: string, score: number, comment?: string) {
    if (!ENV.langsmithApiKey) return;
    
    await client.createFeedback(runId, key, {
      score: score / 5, // Normalize 1-5 stars to 0-1 range
      comment,
    });
    
    console.log(`[LangSmith] Logged feedback for run ${runId}: ${key}=${score}`);
  }
}
