"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * 🧪 Global Binary Audit Orchestrator
 * Purpose: Real-time verification of the entire Siphon Binary Fleet.
 */
export const runGlobalAudit = internalAction({
  args: {},
  handler: async (ctx): Promise<any> => {
    const traceId = "global-audit-" + Date.now();
    await logger.info("🧪 Starting Global Binary Audit...", traceId);
    const results: any = {};

    // 1. Nuke Audit
    try {
      results.nuke = await ctx.runAction(internalAny.agents.nuke_mcp.audit_binaries, {});
    } catch (e) {
      results.nuke = `❌ Failed: ${String(e)}`;
    }

    // 2. Unreal Audit
    try {
      results.unreal = await ctx.runAction(internalAny.agents.unreal_orchestrator.audit_binaries, {});
    } catch (e) {
      results.unreal = `❌ Failed: ${String(e)}`;
    }

    // 3. Houdini Audit
    try {
      results.houdini = await ctx.runAction(internalAny.agents.houdini_orchestrator.audit_binaries, {});
    } catch (e) {
      results.houdini = `❌ Failed: ${String(e)}`;
    }

    await logger.info("✅ Global Audit Complete", traceId, results);
    return results;
  },
});
