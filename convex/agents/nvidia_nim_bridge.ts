"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";

/**
 * ⚡ NVIDIA NIM Sovereign Bridge
 * Purpose: Securely dispatches "Firing" requests to remote H200 clusters.
 * Triggers: Blender LLM (Modeling) -> Unreal (Rendering) -> Nuke LLM (Mastering).
 */
export const dispatchFiringCycle = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
    payload: v.any(), // High-fidelity narrative + cinematography DNA
  },
  handler: async (ctx, args) => {
    const traceId = args.sceneId;
    await logger.info("🔥 NIM: Initiating Firing Cycle on H200 Cluster...", traceId);

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const nimEndpoint = process.env.NVIDIA_NIM_ENDPOINT || "https://ai.api.nvidia.com/v1/nif/firing";

    if (!nvidiaKey) throw new Error("NVIDIA_API_KEY missing. Firing cycle aborted.");

    try {
      const response = await fetch(nimEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaKey}`,
          "Content-Type": "application/json",
          "X-NIF-Phase": "firing",
          "X-Luminous-Snapshot": "enabled", // Ensure Luminous is active
        },
        body: JSON.stringify({
          bookId: args.bookId,
          sceneId: args.sceneId,
          ...args.payload,
          config: {
            platforms: ["unreal", "blender", "nuke"], // Pre-installed fleet
            engine: "lumen",
            mastering: "cinematic_gold_v2",
          }
        })
      });

      if (!response.ok) throw new Error(`NIM Firing Failed: ${await response.text()}`);

      const result = await response.json();
      await logger.info("✅ NIM: Firing Cycle Accepted & Dispatched", traceId, { jobId: result.jobId });
      
      return result;

    } catch (err) {
      await logger.error("❌ NIM: Firing Dispatch Failed", traceId, { error: String(err) });
      throw err;
    }
  },
});
