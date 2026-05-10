import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { ModelRegistry } from "../lib/model_registry";

/**
 * 🆘 Vercel Rescue Agent
 * Purpose: Provides rapid fallback assets when the primary rendering cluster is under heavy load.
 */
export const synthesizeRescueAsset = internalAction({
  args: {
    sceneId: v.string(),
    prompt: v.string(),
    targetDuration: v.optional(v.number()), // 🎬 Added duration awareness
    payload: v.optional(v.any()), // 🚀 Technical Deck persistence
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("🆘 Rescue: primary cluster timeout. Synthesizing fallback asset...", traceId);

    // 🚀 Sovereign Auto-Discovery: Try env first, then local fallback
    const rescueEndpoint = process.env.RESCUE_CLUSTER_URL || "https://bookflix-rescue.vercel.app";
    
    if (!process.env.RESCUE_CLUSTER_URL) {
      await logger.warn("⚠️ Rescue: RESCUE_CLUSTER_URL missing. Using sovereign default fallback.", traceId);
    }

    // 🚀 Vercel AI Swarm: Parallel Race-to-Render
    // We fire multiple cloud generators in parallel and take the first success.
    const swarmModels = ["google/veo-3.1", "kling-v2.6", "luma-dream-machine"];
    
    await logger.info(`⚡ Rescue: Initiating Parallel Swarm [${swarmModels.join(", ")}] for ${args.targetDuration || 10}s`, traceId);

    try {
      // Race the models to find the fastest/best available
      const winner = await Promise.any(swarmModels.map(async (model) => {
        const response = await fetch(`${rescueEndpoint}/api/generate/video`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Rescue-Secret": process.env.RESCUE_SECRET || "",
          },
          body: JSON.stringify({
            prompt: `SCENE: ${args.prompt}. DNA: ${JSON.stringify(args.payload?.dna || "Timeless Cinematic.")}. TECHNICAL: ${JSON.stringify(args.payload?.directorBrief?.cinematography || "High-fidelity cinematic framing.")}. LIGHTING: ${JSON.stringify(args.payload?.directorBrief?.cinematography?.[0]?.lightingBrief || "Naturalistic soft-bounce.")}`,
            model: model, 
            duration: args.targetDuration || 10, // ⏱️ Ensuring length consistency
            config: { 
              theatrical: true,
              atmosphericDNA: args.payload?.dna, // 🧬 Passing the Soul
              productionDeck: args.payload?.directorBrief?.productionDeck, // 🚀 Passing the deck
              cinematography: args.payload?.directorBrief?.cinematography, // 🎥 Passing DoP specs
            },
          }),
        });

        if (!response.ok) throw new Error(`Swarm node ${model} failed`);
        const data = await response.json();
        return { model, url: data.url };
      }));

      await logger.info(`🏆 Rescue Swarm: Winner [${winner.model}]`, traceId);
      return { status: "rescue_complete", videoUrl: winner.url, provider: winner.model };

    } catch (err) {
      await logger.warn("⚠️ Rescue Swarm Exhausted. Engaging Tier 2.5: Sovereign Cloud Pivot...", traceId);
      
      try {
        // 🚀 FINAL SOVEREIGN ATTEMPT: Direct NIM-Cloud Generation
        const cloudFallback = await ctx.runAction(internal.agents.nvidia_nim_bridge.generateGeneralMedia, {
          model: "longcatvideo", // 🐈 LongCat is the most resilient cloud fallback
          prompt: args.prompt,
          sceneId: args.sceneId,
          params: { 
            duration: args.targetDuration || 10,
            dna: args.payload?.dna, // 🧬 Passing the Soul
            cinematography: args.payload?.directorBrief?.cinematography, // 🎥 Inheriting DoP specs
            lighting: args.payload?.directorBrief?.cinematography?.[0]?.lightingBrief // 💡 Inheriting lighting
          }
        });

        if (cloudFallback && cloudFallback.url) {
          await logger.info("🏆 Tier 2.5: Sovereign Cloud Pivot SUCCESS [LongCatVideo]", traceId);
          return { status: "rescue_complete", videoUrl: cloudFallback.url, provider: "longcatvideo" };
        }
      } catch (cloudErr) {
        await logger.error("❌ Tier 2.5: Sovereign Cloud Pivot Failed.", traceId);
      }

      await logger.warn("⚠️ All Clusters Exhausted: Returning Neutral Performance manifest.", traceId);
      return { 
        status: "neutral_performance", 
        videoUrl: null, 
        message: "Primary, Rescue, and Cloud clusters unavailable. Defaulting to Sovereign Static Pose." 
      };
    }
  },
});
