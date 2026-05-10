import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";

/**
 * 🦴 Kimodo Motion Orchestrator (Fully Decoupled Edition)
 * Purpose: Generates high-fidelity 3D character motion.
 * Logic: Pivots OUTSIDE the NVIDIA ecosystem if the cluster fails.
 */
export const generateCharacterMotion = internalAction({
  args: {
    sceneId: v.string(),
    prompt: v.string(),
    duration: v.optional(v.number()),
    productionDeck: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info(`🦴 Kimodo: Initiating performance synthesis for: ${args.prompt}`, traceId);

    const gpuSecret = process.env.GPU_CLUSTER_SECRET;
    const nimEndpoint = process.env.NVIDIA_NIM_ENDPOINT?.replace("/render", "/motion");

    // ── 🛡️ TIER 1: Private H200 Cluster (NVIDIA) ───────────────────────
    if (nimEndpoint && gpuSecret) {
      try {
        const response = await fetch(nimEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-GPU-Cluster-Secret": gpuSecret,
          },
          body: JSON.stringify({
            prompt: args.prompt,
            duration: args.duration || 5.0,
            production_deck: args.productionDeck,
          })
        });

        if (response.ok) {
          const result = await response.json();
          await logger.info("✅ Kimodo: Motion asset generated successfully (Tier 1)", traceId);
          return result;
        }
      } catch (err) {
        await logger.warn("⚠️ Kimodo: Tier 1 Cluster failed. Pivoting OUTSIDE NVIDIA domain...", traceId);
      }
    }

    // ── 🛡️ TIER 2: Sovereign Swarm (Vercel / Google / Kling - DECOUPLED) ─
    try {
      await logger.info("🛰️ Kimodo: Triggering Decoupled Rescue Swarm (Tier 2)...", traceId);
      const rescueResult = await ctx.runAction(internal.agents.vercel_rescue_agent.synthesizeRescueAsset, {
        sceneId: args.sceneId,
        prompt: args.prompt,
        targetDuration: args.duration || 5.0,
        payload: {
          directorBrief: { 
            sceneDescription: args.prompt,
            productionDeck: args.productionDeck 
          }
        },
      });

      if (rescueResult && rescueResult.status !== "neutral_performance") {
        return rescueResult;
      }
    } catch (err) {
      await logger.warn("⚠️ Kimodo: Tier 2 Rescue Swarm failed. Engaging final failover...", traceId);
    }

    // ── 🛡️ TIER 3: Zero-Blackout Fallback (Neutral Manifest) ──────────
    await logger.info("🛡️ Kimodo: Defaulting to Sovereign Neutral Performance (Tier 3).", traceId);
    return { 
      status: "neutral_performance", 
      videoUrl: null, 
      message: "Primary and Rescue clusters unavailable. Defaulting to Sovereign Static Pose." 
    };
  },
});
