"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { logger } from "../lib/observability";

/**
 * 🚀 Enterprise Unreal Orchestrator (Global Scale Edition)
 * Purpose: Dynamically dispatches cinematic jobs to a serverless GPU fleet.
 * Infrastructure: Designed for CoreWeave / Modal / AWS G6 instances.
 */
export const orchestrateUnrealProduction = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
    directorBrief: v.any(),
  },
  handler: async (ctx, args) => {
    const traceId = args.sceneId;
    await logger.info("🚀 Enterprise: Provisioning Unreal Worker Instance...", traceId);

    // 1. Request a Dynamic Worker from the GPU Orchestrator
    // This calls your cluster's Load Balancer to find an available UE 5.7.4 node
    const dispatcherUrl = process.env.GPU_DISPATCHER_URL; 
    if (!dispatcherUrl) throw new Error("GPU Dispatcher URL not configured.");

    try {
      const dispatchResponse = await fetch(`${dispatcherUrl}/provision`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.GPU_CLUSTER_SECRET}` },
        body: JSON.stringify({
          engineVersion: "5.7.4",
          plugin: "LudusAI-13.1",
          jobType: "cinematic_render"
        })
      });

      const { workerUrl, workerId } = await dispatchResponse.json();
      await logger.info(`🚀 Enterprise: Worker ${workerId} Assigned`, traceId);

      // 2. Dispatch the Production Brief to the assigned worker
      const renderResponse = await fetch(`${workerUrl}/RemoteControl/Object/Call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectPath: "/Game/Cinematics/MasterDirector.MasterDirector_C",
          functionName: "LudusHydraSolve",
          parameters: {
            UsdManifest: JSON.stringify(args.directorBrief.usdManifest || {}),
            AtmosphericDNA: JSON.stringify(args.directorBrief.dna || {}),
            SceneId: args.sceneId,
          }
        })
      });

      if (!renderResponse.ok) throw new Error(`Render Dispatch Failed on Worker ${workerId}`);

      // 3. Track the Job in our sovereign database
      await ctx.runMutation(internal.studio.createRenderJobInternal, {
        bookId: args.bookId,
        chapterId: args.chapterId,
        type: "unreal_render",
        config: {
          sceneId: args.sceneId,
          workerId,
          cluster: "coreweave-us-east"
        }
      });

    } catch (err) {
      await logger.error("❌ Enterprise: Orchestration Failed", traceId, { error: String(err) });
      throw err;
    }
  },
});
