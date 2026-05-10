import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * 🎮 Unity Game Engine Orchestrator
 * Purpose: Manages interactive scene elements and real-time simulations in Unity.
 */
export const orchestrateUnityRender = internalAction({
  args: {
    sceneId: v.id("videoScenes"),
    parameters: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("🎮 Unity: Dispatching real-time simulation task...", traceId);

    const node = await ctx.runAction(internalAny.lib.siphon_service.discoverNode, {
      type: "unity_render",
      preferredRegion: "us-east-1",
    });

    if (!node) throw new Error("❌ Unity: No available simulation nodes found.");

    const response = await fetch(`${node.endpoint}/dispatch/unity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GPU-Cluster-Secret": process.env.GPU_CLUSTER_SECRET || "",
      },
      body: JSON.stringify({
        sceneId: args.sceneId,
        params: args.parameters,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Unity Dispatch Failure: ${error}`);
    }

    return await response.json();
  },
});
