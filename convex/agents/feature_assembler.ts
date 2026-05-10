"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
// import { renderMediaOnLambda } from "@remotion/lambda"; // Removed due to bundling conflicts
import { logger } from "../lib/observability";

/**
 * 🎬 Feature Assembler Agent
 * Purpose: Stitches individual scenes into a continuous narrative feature.
 * Logic: Sequences scenes by sceneNumber and applies cinematic rhythm.
 */
export const assembleChapterFeature = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    enable4KRefinement: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.chapterId;
    await logger.info("🎬 Assembler: Starting Chapter Feature Assembly...", traceId);

    // 1. Fetch all scenes for this chapter
    const scenes = await ctx.runQuery(internalAny.studio.listScenesInternal, { 
      chapterId: args.chapterId 
    });
    
    if (scenes.length === 0) throw new Error("No scenes found for assembly.");

    // 2. Sort scenes chronologically
    const sortedScenes = scenes.sort((a: any, b: any) => (a.startTime || 0) - (b.startTime || 0));

    // 🚀 3. PHASE 4: 4K HIGH-FIDELITY REFINEMENT (AI Parallel Suite)
    if (args.enable4KRefinement) {
      await logger.info("🎬 Assembler: Executing 4K High-Fidelity Mastery Pass...", traceId);
      
      // A. Cosmos Temporal Grounding
      await ctx.runAction(internal.agents.nvidia_nim_bridge.generateGeneralMedia, {
        model: "cosmos",
        prompt: `Ensure physical consistency and 4K temporal grounding for chapter ${args.chapterId}.`,
        sceneId: sortedScenes[0]._id, // Using first scene as anchor
        params: {
          input_urls: sortedScenes.map((s: any) => s.videoUrl),
          enhancement_level: "maximum"
        }
      });

      // B. Sana Texture Enhancement
      await ctx.runAction(internal.agents.nvidia_nim_bridge.generateGeneralMedia, {
        model: "sana",
        prompt: "Inject high-fidelity 4K surface textures, cinematic lighting depth, and sharp micro-details.",
        sceneId: sortedScenes[0]._id,
        params: { mode: "upscale_and_enhance", scale: 4.0 }
      });

      // C. ComfyUI Aesthetic Mastery (Dual-Track Polish)
      await logger.info("🎨 Assembler: Triggering ComfyUI Aesthetic Mastery Pass...", traceId);
      await Promise.all(sortedScenes.map(async (scene: any) => {
        await ctx.runAction(internal.agents.comfy_refiner.orchestrateVisualRefinement, {
          bookId: args.bookId,
          chapterId: args.chapterId,
          sceneId: scene._id,
          baseVisualUrl: scene.videoUrl || "", // Refinement from base cluster render
        });
      }));
    }

    // 4. Prepare Remotion Input Props
    const inputProps = {
      scenes: sortedScenes.map((s: any) => ({
        url: s.videoUrl,
        startTime: s.startTime,
        endTime: s.endTime,
        captionUrl: s.captionUrl,
      })),
      chapterId: args.chapterId,
    };

    // 5. Trigger Remotion Lambda Render
    try {
      const remotionPkg = "@remotion/lambda";
      const { renderMediaOnLambda } = await import(remotionPkg as any);

      const { renderId } = await renderMediaOnLambda({
        region: (process.env.REMOTION_AWS_REGION as any) || "us-east-1",
        functionName: process.env.REMOTION_FUNCTION_NAME || "bookflix-render-h264",
        composition: "ChapterFeature",
        serveUrl: process.env.REMOTION_SERVE_URL || "https://bookflix-renders.s3.amazonaws.com/bundle.js",
        inputProps,
        codec: "h264",
        audioCodec: "aac",
      });

      // 6. Create Render Job
      await ctx.runMutation(internalAny.studio.createRenderJobInternal, {
        bookId: args.bookId,
        chapterId: args.chapterId,
        type: "feature_assembly",
        config: { renderId, sceneCount: scenes.length, enhanced: args.enable4KRefinement },
      });

      await logger.info(`✅ Assembler: Assembly Job Dispatched (ID: ${renderId})`, traceId);
      return { renderId };
      
    } catch (err) {
      await logger.error("❌ Assembler: Render Dispatch Failed", traceId, { error: String(err) });
      throw err;
    }
  },
});
