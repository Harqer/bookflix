"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { renderMediaOnLambda } from "@remotion/lambda/client";
import { Id } from "../_generated/dataModel";
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
  },
  handler: async (ctx, args) => {
    const traceId = args.chapterId;
    await logger.info("🎬 Assembler: Starting Chapter Feature Assembly...", traceId);

    // 1. Fetch all scenes for this chapter
    const scenes = await ctx.runQuery(internal.studio.listScenesInternal, { 
      chapterId: args.chapterId 
    });
    
    if (scenes.length === 0) throw new Error("No scenes found for assembly.");

    // 2. Sort scenes chronologically
    const sortedScenes = scenes.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

    // 3. Prepare Remotion Input Props
    const inputProps = {
      scenes: sortedScenes.map(s => ({
        url: s.videoUrl,
        startTime: s.startTime,
        endTime: s.endTime,
        captionUrl: s.captionUrl,
      })),
      chapterId: args.chapterId,
    };

    // 4. Trigger Remotion Lambda Render
    try {
      const { renderId } = await renderMediaOnLambda({
        region: (process.env.REMOTION_AWS_REGION as any) || "us-east-1",
        functionName: process.env.REMOTION_FUNCTION_NAME || "bookflix-render-h264",
        composition: "ChapterFeature",
        serveUrl: process.env.REMOTION_SERVE_URL || "https://bookflix-renders.s3.amazonaws.com/bundle.js",
        inputProps,
        codec: "h264",
        audioCodec: "aac",
      });

      // 5. Create Render Job
      await ctx.runMutation(internal.studio.createRenderJobInternal, {
        bookId: args.bookId,
        chapterId: args.chapterId,
        type: "feature_assembly",
        config: { renderId, sceneCount: scenes.length },
      });

      await logger.info(`✅ Assembler: Assembly Job Dispatched (ID: ${renderId})`, traceId);
      
    } catch (err) {
      await logger.error("❌ Assembler: Render Dispatch Failed", traceId, { error: String(err) });
      throw err;
    }
  },
});
