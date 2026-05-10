import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "../_generated/server";
import { SiphonService } from "../lib/siphon_service";

/**
 * 🛰️ Siphon Service Registry (Enterprise Controller)
 * Purpose: Public and Internal API entry points for the GPU fleet.
 * Rationale: Logic is decoupled into SiphonService for enterprise scalability.
 */

// --- Public Endpoints ---

export const registerNode = mutation({
  args: {
    nodeId: v.string(),
    type: v.string(),
    vram: v.number(),
    status: v.string(),
    endpoint: v.string(),
    region: v.optional(v.string()),
    oidcToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await SiphonService.registerNode(ctx, args);
  },
});

export const getHealthiestNode = query({
  args: { 
    type: v.string(),
    preferredRegion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await SiphonService.getHealthiestNode(ctx, args.type, args.preferredRegion);
  },
});

// --- Internal Endpoints (System-to-System) ---

export const registerNodeInternal = internalMutation({
  args: {
    nodeId: v.string(),
    type: v.string(),
    vram: v.number(),
    status: v.string(),
    endpoint: v.string(),
    region: v.optional(v.string()),
    oidcToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await SiphonService.registerNode(ctx, args);
  },
});

export const getHealthiestNodeInternal = internalQuery({
  args: { 
    type: v.string(),
    preferredRegion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await SiphonService.getHealthiestNode(ctx, args.type, args.preferredRegion);
  },
});

/**
 * 🧹 Fleet Maintenance Cron
 * Scheduled task to prune stale nodes from the registry.
 */
export const runFleetSanitization = internalMutation({
  args: {},
  handler: async (ctx) => {
    await SiphonService.sanitizeFleet(ctx);
  },
});
