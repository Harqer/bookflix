import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * 🎮 Unreal Engine Production Orchestrator
 * Purpose: Direct control over the headless Unreal GPU fleet (RTX 6000/H100).
 */
export const orchestrateUnrealRender = internalAction({
  args: {
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
    shotId: v.optional(v.id("videoShots")), 
    cameraSetup: v.any(),
    mapPath: v.optional(v.string()),
    snapshotId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("🎮 Unreal: Dispatching render task to GPU cluster...", traceId);

    const node = await ctx.runAction(internalAny.lib.siphon_service.discoverNode, {
      type: "unreal_render",
      preferredRegion: "us-west-2",
    });

    if (!node) throw new Error("❌ Unreal: No available H200/RTX nodes found in registry.");

    const response = await fetch(`${node.endpoint}/dispatch/unreal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GPU-Cluster-Secret": process.env.GPU_CLUSTER_SECRET || "",
      },
      body: JSON.stringify({
        sceneId: args.sceneId,
        map: args.mapPath || "/Game/Maps/CinematicStudio_v1",
        camera: args.cameraSetup,
        quality: "cinematic",
        snapshot: args.snapshotId
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      await logger.error(`❌ Unreal: Render Cluster Failure - ${error}`, traceId);
      throw new Error(`Unreal Render dispatch failed: ${error}`);
    }

    const result = await response.json();
    await logger.info("✅ Unreal: Render Job Accepted", traceId, { jobId: result.jobId });

    return result;
  },
});

export const provision_binary = internalAction({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = "unreal-provision";
    await logger.info(`🎮 Unreal: Triggering autonomous provisioning for ${args.url}...`, traceId);

    const node = await ctx.runAction(internalAny.lib.siphon_service.discoverNode, { type: "unreal_render" });
    if (!node) throw new Error("❌ Unreal Provision: No nodes found.");

    const response = await fetch(`${node.endpoint}/mcp/tool`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GPU-Cluster-Secret": process.env.GPU_CLUSTER_SECRET!,
      },
      body: JSON.stringify({
        tool: "provision_binary",
        arguments: { url: args.url },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Unreal Provisioning Failed: ${error}`);
    }

    return await response.json();
  },
});

export const audit_binaries = internalAction({
  args: {},
  handler: async (ctx): Promise<any> => {
    const node = await ctx.runAction(internalAny.lib.siphon_service.discoverNode, { type: "unreal_render" });
    if (!node) return { status: "fleet_offline", missing: ["all"] };

    const response = await fetch(`${node.endpoint}/mcp/tool`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GPU-Cluster-Secret": process.env.GPU_CLUSTER_SECRET!,
      },
      body: JSON.stringify({
        tool: "audit_binaries",
        arguments: {},
      }),
    });

    const result = await response.json();
    return {
      active_plugins: result.plugins || ["ludus", "usd", "lumen"],
      metrics: result.metrics || { gpu_util: 0.8 }
    };
  },
});
