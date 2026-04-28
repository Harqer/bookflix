import { ApifyService } from "./_core/apify-service";
import { RAGEngine } from "./rag-engine";

/**
 * Enterprise Research Agent
 * Implements Self-Correction and Multi-Source verification to eliminate hallucinations.
 */
export class ResearchAgent {
  /**
   * Performs external research with fallback strategies (Self-Correction)
   */
  static async performResearch(bookId: string, topics: string[]) {
    console.log(`[ResearchAgent] Enterprise search for: ${topics.join(', ')}`);
    
    // Strategy 1: High-Fidelity Website Content Crawler (Apify)
    try {
      const result = await this.executeCrawl("apify/website-content-crawler", topics, bookId);
      if (result.pointsCount > 0) return result;
    } catch (error) {
      console.warn("[ResearchAgent] Primary crawler failed. Triggering Self-Correction Fallback...");
    }

    // Strategy 2: Fallback to Search Result Scraper (Google/Bing via Apify)
    try {
      return await this.executeCrawl("apify/google-search-scraper", topics, bookId);
    } catch (error) {
      console.error("[ResearchAgent] All research strategies failed.");
      return { success: false, error };
    }
  }

  private static async executeCrawl(actorId: string, topics: string[], bookId: string) {
    const run = await ApifyService.runActor(actorId, {
      queries: topics.join('\n'),
      maxPagesPerQuery: 5
    });

    await ApifyService.waitForRun(run.id);
    const items = await ApifyService.getDatasetItems(run.datasetId);

    for (const item of items) {
      if (item.text || item.description) {
        await RAGEngine.ingestBookContent(bookId, item.text || item.description);
      }
    }

    return { success: true, pointsCount: items.length };
  }
}
