import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * ⚛️ Nuke Mastering Orchestrator
 * Purpose: Coordinates the final cinematic color grade and delivery.
 */
export const orchestrateNukeMastering = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
    masteringBrief: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("⚛️ Nuke: Starting final mastering pass...", traceId);

    const result = await ctx.runAction(internalAny.agents.nuke_mcp.call_nuke_tool, {
      toolName: "master_scene",
      parameters: {
        sceneId: args.sceneId,
        brief: args.masteringBrief,
        config: args.config,
      },
    });

    await logger.info("✅ Nuke: Mastering Complete. Delivery Ready.", traceId);
    return result;
  },
});
