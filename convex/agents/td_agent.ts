import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 🛰️ Sovereign Technical Director (TD) Agent
 * Purpose: Ensures technical fidelity, plugin availability, and narrative consistency.
 * Logic: Performs "Deep Audit" of GPU nodes and sets reality-audit thresholds.
 */

// --- SHARED HELPERS ---

async function runDeepAudit(ctx: any, nodeType: string): Promise<any> {
  const traceId = "td-deep-audit";
  await logger.info(`🛰️ TD: Initiating Deep Audit for ${nodeType} fleet...`, traceId);

  // 1. Trigger the MCP-based binary audit
  let auditResult;
  try {
    if (nodeType === "nuke_render") auditResult = await ctx.runAction(internalAny.agents.nuke_mcp.audit_binaries);
    else if (nodeType === "unreal_render") auditResult = await ctx.runAction(internalAny.agents.unreal_orchestrator.audit_binaries);
    else if (nodeType === "houdini_fx") auditResult = await ctx.runAction(internalAny.agents.houdini_orchestrator.audit_binaries);
    else if (nodeType === "maya_animation") auditResult = await ctx.runAction(internalAny.agents.maya_mcp.audit_binaries);
    else auditResult = await ctx.runAction(internalAny.agents.nuke_mcp.audit_binaries); // Default
  } catch (e) {
    await logger.warn(`⚠️ TD: Audit call failed for ${nodeType}. Assuming offline.`, traceId);
    return { status: "fail", missing: ["fleet_offline"] };
  }
  
  if (auditResult?.status === "fleet_offline" || !auditResult) {
    await logger.warn(`⚠️ TD: Fleet ${nodeType} is currently offline. Deep Audit skipped.`, traceId);
    return { status: "fail", missing: auditResult?.missing ?? ["all"] };
  }

  const manifests: Record<string, string[]> = {
    nuke_render: ["vray", "usd", "arnold", "ocula"],
    unreal_render: ["ludus", "luminous", "lumen", "usd"],
    houdini_fx: ["neural_physics", "karma_xpu", "vdb"],
    maya_animation: ["golaem", "diffuman", "usd"],
  };

  const requiredPlugins = manifests[nodeType] || manifests.nuke_render;
  const activePlugins = auditResult?.active_plugins ?? [];
  const missing = requiredPlugins.filter((p: string) => !activePlugins.includes(p));

  if (missing.length > 0) {
    await logger.error(`❌ TD: Deep Audit Failed. Missing critical plugins: ${missing.join(", ")}`, traceId);
    return { status: "fail", missing };
  }

  await logger.info("✅ TD: Deep Audit Passed. Theatrical pipeline is healthy.", traceId);
  return { status: "pass", metrics: auditResult.metrics };
}

async function runRepairFleet(ctx: any, nodeType: string): Promise<any> {
  const traceId = "fleet-repair";
  await logger.info(`🛠️ TD: Initiating Fleet Repair for ${nodeType}...`, traceId);

  const audit = await runDeepAudit(ctx, nodeType);
  if (audit.status === "pass") return { status: "healthy", message: "Fleet is already at 100% capacity." };

  if (audit.missing?.includes("fleet_offline")) {
    throw new Error("Fleet is offline. Cannot repair.");
  }

  const binaryUrlMap: Record<string, string> = {
    golaem: process.env.GOLAEM_BINARY_URL || "https://assets.cinegraph.studio/binaries/golaem_latest.tar.gz",
    ludus: process.env.LUDUS_PLUGIN_URL || "https://assets.cinegraph.studio/plugins/ludus_v13.zip",
    arnold: process.env.VRAY_BINARY_URL || "https://assets.cinegraph.studio/binaries/vray_latest.tar.gz",
    ocula: process.env.NUKE_BINARY_URL || "https://assets.cinegraph.studio/binaries/nuke_latest.run",
    unity_engine: process.env.UNITY_BINARY_URL || "https://assets.cinegraph.studio/binaries/unity_latest.tar.gz",
    unreal_engine: process.env.UNREAL_BINARY_URL || "https://assets.cinegraph.studio/binaries/unreal_latest.tar.gz",
  };

  const targetUrl = audit.missing?.map((p: string) => binaryUrlMap[p]).filter(Boolean)[0];
  if (!targetUrl) throw new Error("No infrastructure URL found for missing plugins.");

  await logger.info(`🛰️ TD: Commanding node to Siphon binary from Registry: ${targetUrl}`, traceId);
  
  let provisionResult;
  try {
    if (nodeType === "maya_animation") {
      provisionResult = await ctx.runAction(internalAny.agents.maya_mcp.provision_binary, { url: targetUrl });
    } else if (nodeType === "unreal_render") {
      provisionResult = await ctx.runAction(internalAny.agents.unreal_orchestrator.provision_binary, { url: targetUrl });
    } else if (nodeType === "houdini_fx") {
      provisionResult = await ctx.runAction(internalAny.agents.houdini_orchestrator.provision_binary, { url: targetUrl });
    } else if (nodeType === "nuke_render") {
      provisionResult = await ctx.runAction(internalAny.agents.nuke_mcp.call_nuke_tool, { 
        toolName: "provision_binary", 
        parameters: { url: targetUrl } 
      });
    }
  } catch (e) {
    throw new Error(`Provisioning action failed: ${String(e)}`);
  }

  return { 
    status: "provisioning_triggered", 
    targetUrl,
    result: provisionResult 
  };
}

// --- EXPORTED ACTIONS ---

export const executeDeepAudit = internalAction({
  args: { nodeType: v.string() },
  handler: async (ctx, args) => await runDeepAudit(ctx, args.nodeType),
});


export const analyzeNarrativeConsistency = internalAction({
  args: {
    bookId: v.id("books"),
    sceneId: v.id("videoScenes"),
    directorBrief: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("🕵️ TD: Performing AI Narrative Consistency Audit...", traceId);

    // 🚀 LIVE CONSISTENCY AUDIT: Analyzing conflict and energy via NIM
    const decision = await runNvidiaChat(
      [{
        role: "user",
        content: JSON.stringify(args.directorBrief)
      }],
      { 
        traceId,
        systemPrompt: `You are a Technical Director Auditor. Analyze the provided Director Brief and determine the technical rendering thresholds. High-conflict or high-energy scenes require lower thresholds (higher precision). OUTPUT FORMAT (JSON ONLY): { "threshold": 0.02, "fixHallucinations": true, "mode": "sovereign", "reasoning": "..." }`,
        responseFormat: "json_object"
      }
    );

    await logger.info(`🕵️ TD: Consistency Decision - Threshold: ${decision.threshold}, Mode: ${decision.mode}`, traceId, { reasoning: decision.reasoning });
    return decision;
  },
});

export const repairFleet = internalAction({
  args: { nodeType: v.string() },
  handler: async (ctx, args) => await runRepairFleet(ctx, args.nodeType),
});

export const forceHardening = action({
  args: {
    platforms: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = "force-hardening";
    await logger.info("🛡️ TD: Starting Production Hardening Loop...", traceId);

    const results: Record<string, string> = {};

    for (const platform of args.platforms) {
      let attempts = 0;
      const maxAttempts = 5;
      let healthy = false;

      while (attempts < maxAttempts && !healthy) {
        attempts++;
        await logger.info(`🛡️ TD: Platform ${platform} - Attempt ${attempts}/${maxAttempts}`, traceId);

        let audit;
        try {
          audit = await runDeepAudit(ctx, platform);
        } catch (e) {
          audit = { status: "fail", missing: ["fleet_offline"] };
        }
        
        if (audit.status === "pass") {
          await logger.info(`✅ TD: Platform ${platform} is Hardened.`, traceId);
          results[platform] = "HEALTHY";
          healthy = true;
          break;
        }

        await logger.warn(`⚠️ TD: Platform ${platform} missing plugins: ${audit.missing?.join(", ")}. Forcing Repair...`, traceId);
        try {
          await runRepairFleet(ctx, platform);
        } catch (e) {
          await logger.error(`❌ TD: Repair failed for ${platform} (${String(e)})`, traceId);
        }

        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      if (!healthy) {
        results[platform] = "FAILED_TO_HARDEN";
        await logger.error(`❌ TD: Platform ${platform} failed to harden after ${maxAttempts} attempts.`, traceId);
      }
    }

    return { 
      status: Object.values(results).every(v => v === "HEALTHY") ? "SUCCESS" : "INCOMPLETE",
      report: results 
    };
  }
});
