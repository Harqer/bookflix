import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * 🧊 Blender MCP Bridge
 * Purpose: Direct control over the Blender rendering nodes for asset preprocessing.
 */
export const run_blender_script = internalAction({
  args: {
    script: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = "blender-mcp";
    await logger.info("🧊 Blender MCP: Executing technical script...", traceId);

    const node = await ctx.runAction(internalAny.lib.siphon_service.discoverNode, {
      type: "blender_preproc",
      preferredRegion: "us-east-1",
    });

    if (!node) throw new Error("❌ Blender MCP: No available nodes found.");

    const response = await fetch(`${node.endpoint}/mcp/tool`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GPU-Cluster-Secret": process.env.GPU_CLUSTER_SECRET || "",
      },
      body: JSON.stringify({
        tool: "run_script",
        arguments: { script: args.script },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Blender MCP Script Failure: ${error}`);
    }

    return await response.json();
  },
});
