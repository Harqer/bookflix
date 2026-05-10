import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * 🦴 RigGS Agent (4D Gaussian Splatting Rigging)
 * Purpose: Commands the autonomous rigging training cycles for character deformation.
 */
export const triggerRiggingTraining = internalAction({
  args: {
    characterId: v.string(),
    usdData: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.characterId;
    await logger.info(`🦴 RigGS: Triggering autonomous rigging for ${args.characterId}...`, traceId);

    const gpuSecret = process.env.GPU_CLUSTER_SECRET;
    const response = await fetch(`${process.env.RIGGING_CLUSTER_URL}/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GPU-Cluster-Secret": gpuSecret || "",
      },
      body: JSON.stringify({
        characterId: args.characterId,
        usd: args.usdData,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`RigGS Training Failed: ${error}`);
    }

    return await response.json();
  },
});
