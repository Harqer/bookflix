"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";

/**
 * 🎮 Unreal Engine 5.7.4 Orchestrator (Global Cloud Fleet)
 * Purpose: Headless GPU rendering via Remote Control API & Luminous Plugin.
 * Target: Millions of users via distributed serverless workers.
 */
export const orchestrateUnrealProduction = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
    directorBrief: v.any(), // High-fidelity screenplay + cinematography DNA
    mapPath: v.optional(v.string()), // Path to the Luminous Master Level
    snapshotId: v.optional(v.string()), // specific World State Snapshot
  },
  handler: async (ctx, args) => {
    const traceId = args.sceneId;
    await logger.info("🎮 Unreal: Initializing Headless Production...", traceId);

    const gpuDispatcherUrl = process.env.GPU_DISPATCHER_URL;
    const gpuSecret = process.env.GPU_CLUSTER_SECRET;

    if (!gpuDispatcherUrl || !gpuSecret) {
      throw new Error("Enterprise GPU Infrastructure not provisioned (Missing URL/Secret).");
    }

    try {
      // 🚀 Dispatched to Remote Control API (Hydra/Ludus/Luminous Native)
      const response = await fetch(`${gpuDispatcherUrl}/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GPU-Cluster-Secret": gpuSecret,
          "X-Ludus-Version": "13.1",
          "X-Luminous-Enabled": "true", // ⚡ Lighting Hardening
        },
        body: JSON.stringify({
          sceneId: args.sceneId,
          // 🗺️ Level Snapshot Logic
          level: args.mapPath || "/Game/Cinematics/MasterLevels/Luminous_Studio_01",
          snapshot: args.snapshotId || "Default_Production_State",
          
          // 🧠 Narrative Injection
          brief: args.directorBrief,
          
          // 🎥 Cinematic Config (Luminous Native)
          config: {
            renderEngine: "Lumen",
            rayTracing: true,
            postProcess: {
              exposure: args.directorBrief.cinematography.exposure,
              colorGrading: args.directorBrief.cinematography.toneMap,
              luminousBloom: true,
            },
            resolution: "4K",
            fps: 24,
          },
          
          callbackUrl: `${process.env.CONVEX_SITE_URL}/nvidia-callback`,
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GPU Dispatch Failure: ${error}`);
      }

      const { jobId } = await response.json();
      
      // Register the production job
      await ctx.runMutation(internal.studio.createRenderJobInternal, {
        bookId: args.bookId,
        chapterId: args.chapterId,
        sceneId: args.sceneId,
        type: "unreal_render",
        config: { jobId, level: args.mapPath },
      });

      await logger.info(`✅ Unreal: Job Dispatched to Global Fleet (Job: ${jobId})`, traceId);
      return { jobId };

    } catch (err) {
      await logger.error("❌ Unreal: Production Dispatch Failed", traceId, { error: String(err) });
      throw err;
    }
  },
});
