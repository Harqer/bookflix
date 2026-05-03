"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { logger } from "../lib/observability";

/**
 * 🏗️ Maya Technical Animation Agent
 * Purpose: Orchestrates USD character rigs and technical animation.
 * Logic: Links the world bible character refs to the technical render brief.
 */
export const orchestrateMayaAnimation = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
    usdManifest: v.any(),
  },
  handler: async (ctx, args) => {
    const traceId = args.sceneId;
    await logger.info("🏗️ Maya: Orchestrating Technical Animation...", traceId);

    // 1. Fetch World Bible for character rig references
    const bible = await ctx.runQuery(internal.studio.getBookInternal, { bookId: args.bookId });
    
    // 2. Queue Maya Render Job
    await ctx.runMutation(internal.studio.createRenderJobInternal, {
      bookId: args.bookId,
      chapterId: args.chapterId,
      type: "maya_animation",
      config: {
        sceneId: args.sceneId,
        usd: args.usdManifest,
        characterRefs: bible?.characters || [], // Linking to specific .ma or .usd rigs
      },
    });

    await logger.info("🏗️ Maya: Job Queued Successfully", traceId);
  },
});
