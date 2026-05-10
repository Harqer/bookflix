import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, MutationCtx, QueryCtx } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { Doc, Id } from "../_generated/dataModel";
import { logger } from "./observability";

/**
 * 🛰️ Siphon Domain Service (Enterprise Edition)
 * Purpose: Centralized logic for GPU Fleet Management.
 */

export const SiphonService = {
  registerNode: async (ctx: MutationCtx, params: {
    nodeId: string;
    type: string;
    vram: number;
    status: string;
    endpoint: string;
    region?: string;
  }) => {
    const existing = await ctx.db
      .query("siphon_nodes")
      .withIndex("by_nodeId", (q) => q.eq("nodeId", params.nodeId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: params.status,
        vram: params.vram,
        region: params.region,
        lastSeen: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("siphon_nodes", {
        ...params,
        lastSeen: Date.now(),
      });
    }
  },

  getHealthiestNode: async (ctx: QueryCtx, type: string, preferredRegion?: string) => {
    // 🚀 Use the composite index [type, status]
    let query = ctx.db.query("siphon_nodes")
      .withIndex("by_type", (q) => q.eq("type", type).eq("status", "idle"));

    if (preferredRegion) {
      query = query.filter((q) => q.eq(q.field("region"), preferredRegion));
    }

    return await query.order("desc").first();
  },

  sanitizeFleet: async (ctx: MutationCtx) => {
    const timeout = Date.now() - (5 * 60 * 1000); // 5 minutes
    const deadNodes = await ctx.db
      .query("siphon_nodes")
      .filter((q) => q.lt(q.field("lastSeen"), timeout))
      .collect();

    for (const node of deadNodes) {
      await ctx.db.patch(node._id, { status: "offline" });
    }
  }
};

export const discoverNode = internalAction({
  args: {
    type: v.string(),
    preferredRegion: v.optional(v.string()),
    minVram: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const node = await ctx.runQuery(internalAny.lib.siphon_service.getHealthiestNodeInternal, {
      type: args.type,
      preferredRegion: args.preferredRegion,
    });
    
    return node;
  },
});

export const getHealthiestNodeInternal = internalQuery({
  args: {
    type: v.string(),
    preferredRegion: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    return await SiphonService.getHealthiestNode(ctx, args.type, args.preferredRegion);
  },
});

export const registerNodeAction = internalMutation({
  args: {
    nodeId: v.string(),
    type: v.string(),
    vram: v.number(),
    status: v.string(),
    endpoint: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    return await SiphonService.registerNode(ctx, args);
  },
});

export const sanitizeFleetAction = internalMutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    return await SiphonService.sanitizeFleet(ctx);
  },
});
