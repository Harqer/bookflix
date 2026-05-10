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
    sceneId: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("🔥 NIM: Initiating Firing Cycle on H200 Cluster...", traceId);

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const nimEndpoint = process.env.NVIDIA_NIM_ENDPOINT || "https://integrate.api.nvidia.com/v1/nif/firing";

    if (!nvidiaKey) throw new Error("NVIDIA_API_KEY missing. Firing cycle aborted.");

    try {
      const response = await fetch(nimEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaKey}`,
          "Content-Type": "application/json",
          "X-NIF-Phase": "firing",
          "X-Luminous-Snapshot": "enabled",
        },
        body: JSON.stringify({
          bookId: args.bookId,
          sceneId: args.sceneId,
          ...args.payload,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        // 🚨 FALLBACK 1: Cluster Restricted -> Route to Cloud NIMs
        if (response.status === 402 || response.status === 500 || errorText.includes("spend limit")) {
          await logger.info("⚠️ NIM: Cluster restricted. Falling back to Cloud NIM (Tier 2)...", traceId);
          try {
            const cloudResult: any = await ctx.runAction(internal.agents.nvidia_nim_bridge.generateGeneralMedia, {
              model: "longcatvideo",
              prompt: args.payload.directorBrief.sceneDescription,
              sceneId: args.sceneId,
              params: {
                duration: args.payload.directorBrief.targetDuration,
                payload: args.payload,
              }
            });

            if (cloudResult.status === "error") throw new Error(cloudResult.message);
            return cloudResult;

          } catch (cloudErr) {
            // 🚨 FALLBACK 2: Cloud NIM Failed -> Route to Vercel Rescue (Veo 3)
            await logger.info(`🆘 NIM: Cloud fallback failed [${String(cloudErr)}]. Triggering Vercel Rescue (Tier 3 - Veo 3)...`, traceId);
            return await ctx.runAction(internal.agents.vercel_rescue_agent.synthesizeRescueAsset, {
              sceneId: args.sceneId,
              prompt: args.payload.directorBrief.sceneDescription,
              targetDuration: args.payload.directorBrief.targetDuration,
              payload: args.payload,
            });
          }
        }
        throw new Error(`NIM Firing Failed: ${errorText}`);
      }

      const result = await response.json();
      await logger.info("✅ NIM: Firing Cycle Accepted & Dispatched", traceId, { jobId: result.jobId });
      return result;

    } catch (err) {
      // Final catch-all to ensure we try Vercel Rescue if anything else explodes
      await logger.error("❌ NIM: Primary dispatch failed. Attempting final Rescue...", traceId);
      return await ctx.runAction(internal.agents.vercel_rescue_agent.synthesizeRescueAsset, {
        sceneId: args.sceneId,
        prompt: args.payload?.directorBrief?.sceneDescription || "Cinematic scene generation",
        targetDuration: args.payload?.directorBrief?.targetDuration || 10,
        payload: args.payload || {}, // 🚀 PERSISTING PAYLOAD
      });
    }
  },
});

/**
 * 🛰️ Sovereign Cloud Generation (NIM-Cloud)
 * Purpose: Directly generates media from general models (LongCatVideo, Cosmos, DiffuMan)
 * without hitting the private GPU cluster for non-specialized tasks.
 */
export const generateGeneralMedia = internalAction({
  args: {
    model: v.union(v.literal("longcatvideo"), v.literal("cosmos"), v.literal("diffuman"), v.literal("sana")),
    prompt: v.string(),
    sceneId: v.string(),
    params: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info(`☁️ NIM-Cloud: Generating ${args.model} asset...`, traceId);

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    // Map internal models to stable v1 integrate endpoints
    const modelMap: Record<string, string> = {
      longcatvideo: "meituan/longcat-video",
      cosmos: "nvidia/cosmos-1.0",
      diffuman: "nvidia/diffuman-4d",
      sana: "nvidia/sana", 
    };

    const modelId = modelMap[args.model];
    const endpoint = `https://integrate.api.nvidia.com/v1/chat/completions`; // Standard v1 endpoint

    if (!nvidiaKey) throw new Error("NVIDIA_API_KEY missing. Cloud generation aborted.");

    try {
      const qualityStandard = args.params?.qualityStandard || "timeless_sovereign";
      const dna = args.params?.dna || "Timeless Cinematic Realism";
      
      const technicalBrief = args.params?.cinematography?.[0] ? 
        `LENS: ${args.params.cinematography[0].opticalConstraints.focalLength} @ ${args.params.cinematography[0].opticalConstraints.aperture}. LIGHTING: ${JSON.stringify(args.params.cinematography[0].lightingBrief)}` : 
        "Naturalistic soft-bounce lighting, 35mm optics.";

      const enhancedPrompt = qualityStandard === "timeless_sovereign" ? 
        `SOVEREIGN THEATRICAL ASSET: ${args.prompt}. DNA: ${JSON.stringify(dna)}. AESTHETIC: Jia Zhangke Realism + British New Wave. TECHNICAL: ${technicalBrief}. PACING: ${args.params?.duration}s duration.` : 
        args.prompt;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { 
              role: "user", 
              content: enhancedPrompt 
            }
          ],
          temperature: 0.2,
          max_tokens: 1024,
          ...args.params,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        await logger.warn(`⚠️ NIM-Cloud: ${args.model} generation failed: ${errorText}`, traceId);
        return { status: "error", message: `NIM Cloud Failed: ${errorText}` };
      }

      const result = await response.json();
      await logger.info(`✅ NIM-Cloud: ${args.model} asset generated successfully`, traceId);
      
      return result;

    } catch (err) {
      await logger.error(`❌ NIM-Cloud: ${args.model} exception occurred`, traceId, { error: String(err) });
      return { status: "error", message: String(err) };
    }
  },
});

/**
 * 🌡️ Cluster Warmth Verification
 * Purpose: Performs a "Deep Audit" of the H200 fleet to verify binaries and plugins.
 */
export const verifyClusterWarmth = internalAction({
  args: {},
  handler: async (ctx) => {
    await logger.info("🌡️ NIM: Initiating Deep Audit of H200 Fleet...", "global_audit");

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const auditEndpoint = process.env.NVIDIA_NIM_ENDPOINT?.replace("/render", "/audit") || "https://integrate.api.nvidia.com/v1/nif/audit";

    if (!nvidiaKey) throw new Error("NVIDIA_API_KEY missing.");

    try {
      const response = await fetch(auditEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaKey}`,
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) throw new Error(`Audit Failed: ${await response.text()}`);

      const results = await response.json();
      await logger.info("✅ NIM: Deep Audit Complete.", "global_audit", { results });
      
      return results;

    } catch (err) {
      await logger.error("❌ NIM: Deep Audit Failed", "global_audit", { error: String(err) });
      throw err;
    }
  },
});
