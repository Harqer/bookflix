"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { protectAction } from "../arcjet";

/**
 * 📚 Book Analyst Agent (Gemini 1.5 Pro Edition)
 * Purpose: Deep Narrative Comprehension & Scene Extraction.
 * Logic: Breaks a book into chapters and extracts atmospheric DNA.
 */
export const analyzeBook = internalAction({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const traceId = args.bookId;
    await logger.info("📚 Analyst: Starting Book Analysis...", traceId);

    // 1. Fetch raw text
    const rawText = await ctx.runQuery(internal.studio.getRawTextInternal, { bookId: args.bookId });
    if (!rawText) throw new Error("Book content missing.");

    // 🚀 Signal Progress: Analyzing
    await ctx.runMutation(internal.studio.updateBookStatusInternal, {
      bookId: args.bookId,
      status: "analyzing",
    });

    // 🛡️ ARCJET: Prompt Injection Detection
    // For internal actions, we use the bookId as the fingerprint if subject is unavailable.
    const identity = await ctx.auth.getUserIdentity();
    await protectAction(identity?.subject || args.bookId, undefined, rawText.substring(0, 1000));

    // 2. Perform AI analysis (DNA Extraction)
    // We simulate the extraction of Atmospheric DNA for the POC.
    await ctx.runMutation(internal.studio.updateBookDNAInternal, {
      bookId: args.bookId,
      dna: {
        theme: "Emergent Consciousness",
        mood: "Atmospheric Cyberpunk",
        texture: "Neon-Drenched Metal",
        era: "2026 Sovereign Horizon",
      },
    });
    
    await logger.info("📚 Analyst: Analysis Completed Successfully", traceId);
    
    // 🚀 Signal Progress: Scripting (Moving to next phase)
    await ctx.runMutation(internal.studio.updateBookStatusInternal, {
      bookId: args.bookId,
      status: "scripting",
    });

    // 3. Chapter Segmentation (POC: Seed a single chapter)
    const chapterId = await ctx.runMutation(internal.studio.createChapterInternal, {
      bookId: args.bookId,
      chapterNumber: 1,
      title: "The Awakening",
      summary: "Kael discovers the sovereign code in the H200 cluster.",
      status: "pending",
    });

    // 4. Trigger Chapter Firing Cycle
    await ctx.runAction(internal.agents.nif_controller.orchestrateChapterProduction, {
      bookId: args.bookId,
      chapterId,
    });
  },
});
