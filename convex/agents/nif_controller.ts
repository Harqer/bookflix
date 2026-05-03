"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";

/**
 * 🛰️ Sovereign NIF (Narrative Intelligence Flow) Controller
 * Purpose: Conductor of the autonomous cinematic fleet.
 * Orchestrates: Director -> Unreal (Luminous) -> Nuke (Finishing).
 */
export const orchestrateChapterProduction = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
  },
  handler: async (ctx, args) => {
    const traceId = args.chapterId;
    try {
      // 1. Narrative Analysis & Cinematic Scoping
      const screenplay = await ctx.runAction(internal.agents.book_analyst.analyzeChapter, {
        bookId: args.bookId,
        chapterId: args.chapterId,
      });

      // 2. Director Scout & Scene Distribution
      const dna = await ctx.runQuery(internal.studio.getWorldBible, { bookId: args.bookId });
      const brief = await ctx.runAction(internal.agents.director.orchestrateChapterProduction, {
        bookId: args.bookId,
        chapterId: args.chapterId,
        screenplay,
        dna: {
          theme: dna.theme,
          mood: dna.mood,
          texture: dna.texture,
          era: dna.era,
        },
      });

      // 3. Parallel Scene Production Loop
      const scenes = await ctx.runQuery(internal.studio.listScenesInternal, { chapterId: args.chapterId });
      
      await Promise.all(scenes.map(async (scene) => {
        await ctx.runAction(internal.agents.master_orchestrator.orchestrateFullFiringCycle, {
          bookId: args.bookId,
          chapterId: args.chapterId,
          sceneId: scene._id,
          directorBrief: brief,
        });
      }));

      await logger.info("✅ NIF: Sovereign Production Dispatched to Fleet", traceId);
    } catch (err) {
      await logger.error(`❌ NIF: Production Dispatch Failed: ${err}`, traceId);
      throw err;
    }
  },
});

export const triggerProductionCycle = internalAction({
  args: {
    bookId: v.id("books"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const traceId = args.bookId;
    await logger.info("🚀 NIF: Triggering Master Production Cycle...", traceId);

    // 1. Initial Book Analysis (DNA & Chapters)
    await ctx.runAction(internal.agents.book_analyst.analyzeBook, {
      bookId: args.bookId,
    });

    await logger.info("✅ NIF: Master Cycle Triggered Successfully", traceId);
  },
});
