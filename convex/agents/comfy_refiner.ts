import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 🎨 ComfyUI Visual Refinement Agent
 * Purpose: Applies high-fidelity visual style and consistency to base renders.
 * Logic: Dispatches tasks to remote ComfyUI workers via the studio queue.
 */
export const orchestrateVisualRefinement = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.string(),
    baseVisualUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const traceId = args.sceneId;
    await logger.info("🎨 ComfyUI: Synthesizing 'Timeless' Refinement Manifest...", traceId);

    // 1. Fetch Book DNA & Production Deck
    const book = await ctx.runQuery(api.studio.getBook, { id: args.bookId });
    if (!book || !book.atmosphericDNA) throw new Error("Narrative DNA Missing");

    // 🚀 LIVE REFINEMENT SYNTHESIS: Translating 'Timeless' DNA into Technical Params
    const manifest = await runNvidiaChat(
      [{
        role: "user",
        content: `DNA: ${JSON.stringify(book.atmosphericDNA)}`
      }],
      {
        traceId,
        systemPrompt: `You are a ComfyUI Technical Director. Translate the 'Timeless' British DNA (Soft-bounce, Net-diffusion, 30% Flash) into technical params. OUTPUT FORMAT (JSON ONLY): { "denoise": 0.45, "cfg": 7.5, "sampler": "euler_a", "scheduler": "karras", "flash_level": 0.3 }`,
        responseFormat: "json_object"
      }
    );

    // 2. Queue the Refinement Job with the Universal Manifest
    await ctx.runMutation(internal.studio.createRenderJobInternal, {
      bookId: args.bookId,
      chapterId: args.chapterId,
      type: "comfyui_refinement",
      config: {
        sceneId: args.sceneId,
        baseVisualUrl: args.baseVisualUrl,
        manifest, // 🚀 Universal Technical Parameters
        style: book.atmosphericDNA,
      },
    });

    await logger.info(`✅ ComfyUI: Refinement Manifest Synthesized. Denoise: ${manifest.denoise}`, traceId);
  },
});
