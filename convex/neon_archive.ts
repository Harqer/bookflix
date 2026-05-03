import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { logger } from "./lib/observability";

/**
 * 🏛️ Neon Archive Bridge
 * Purpose: Pipes finished cinematic data to the Neon Serverless Data Lake.
 * Usage: Long-term historical records and studio performance analytics.
 */

export const archiveProductionData = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    dna: v.any(),
    brief: v.any(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const NEON_URL = process.env.NEON_API_URL;
    if (!NEON_URL) return;

    await logger.info("🏛️ Neon: Archiving Production Metadata", args.bookId);

    try {
      // 🚀 RESTful Archival: Neon Serverless SQL
      await fetch(NEON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: args.bookId,
          chapter_id: args.chapterId,
          atmospheric_dna: args.dna,
          usd_brief: args.brief,
          reality_score: args.score,
          archived_at: new Date().toISOString()
        })
      });
      
      await logger.info("✅ Neon: Data Successfully Archived", args.bookId);
    } catch (err) {
      await logger.error("❌ Neon: Archival Failed", args.bookId, { error: String(err) });
    }
  },
});
