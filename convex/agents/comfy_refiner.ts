"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { logger } from "../lib/observability";

/**
 * 🎨 ComfyUI Visual Refinement Agent
 * Purpose: Applies high-fidelity visual style and consistency to base renders.
 * Logic: Dispatches tasks to remote ComfyUI workers via the studio queue.
 */
export const orchestrateVisualRefinement = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
    baseVisualUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const traceId = args.sceneId;
    await logger.info("🎨 ComfyUI: Orchestrating Visual Refinement...", traceId);

    // 1. Fetch Book DNA for style consistency
    const book = await ctx.runQuery(api.studio.getBook, { id: args.bookId });
    if (!book || !book.atmosphericDNA) throw new Error("Narrative DNA Missing");

    // 2. Queue the Refinement Job
    await ctx.runMutation(internal.studio.createRenderJobInternal, {
      bookId: args.bookId,
      chapterId: args.chapterId,
      type: "comfyui_refinement",
      config: {
        sceneId: args.sceneId,
        baseVisualUrl: args.baseVisualUrl,
        style: book.atmosphericDNA,
      },
    });

    await logger.info("🎨 ComfyUI: Job Queued Successfully", traceId);
  },
});
