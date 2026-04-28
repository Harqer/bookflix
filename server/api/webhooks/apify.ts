import { ApifyService } from "../../_core/apify-service";
import { RAGEngine } from "../../rag-engine";
import { getDb } from "../../db";

/**
 * Apify Webhook Handler (Enterprise Event-Driven)
 * Automatically processes research data once the Apify actor completes.
 */
export async function handleApifyWebhook(req: Request) {
  // 1. Verify source (In production, use IP filtering or HMAC)
  const payload = await req.json();
  const { runId, status, datasetId } = payload;

  console.log(`[Apify Webhook] Received notification for run ${runId} [Status: ${status}]`);

  if (status !== 'SUCCEEDED') {
    console.error(`[Apify Webhook] Research run ${runId} failed.`);
    return new Response('Run Failed', { status: 200 });
  }

  // 2. Fetch Data and Ingest into RAG
  try {
    const items = await ApifyService.getDatasetItems(datasetId);
    
    // We need the bookId associated with this run
    // In production, we'd store the mapping in Vercel KV or Postgres
    const bookId = 'temp_mapping_needed'; // Placeholder for mapping logic

    console.log(`[Apify Webhook] Ingesting ${items.length} items for Book ${bookId}...`);
    
    for (const item of items) {
      if (item.text || item.description) {
        await RAGEngine.ingestBookContent(bookId, item.text || item.description);
      }
    }

    // 3. Trigger next stage of LangGraph (Event-driven Orchestration)
    // Here we would signal the LangGraph that research is complete.
    
    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error(`[Apify Webhook] Error processing data:`, error);
    return new Response('Processing Error', { status: 500 });
  }
}
