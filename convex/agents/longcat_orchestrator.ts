import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * 🐈 Longcat Orchestrator (Multi-Scene Assembly)
 * Purpose: Merges individual renders into a continuous, seamless long-form video.
 */
export const assembleLongformVideo = internalAction({
  args: {
    chapterId: v.id("chapters"),
    sceneUrls: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.chapterId;
    await logger.info("🐈 Longcat: Assembling multi-scene production...", traceId);

    const gpuSecret = process.env.GPU_CLUSTER_SECRET;
    const response = await fetch(`${process.env.LONGCAT_CLUSTER_URL}/assemble`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GPU-Cluster-Secret": gpuSecret || "",
      },
      body: JSON.stringify({
        chapterId: args.chapterId,
        urls: args.sceneUrls,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Longcat Assembly Failed: ${error}`);
    }

    return await response.json();
  },
});
