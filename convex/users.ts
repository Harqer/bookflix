import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * 👤 User Management API
 * Handles identity lifecycle and session validation.
 */

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    const userData = {
      name: identity.name,
      email: identity.email!,
      imageUrl: identity.pictureUrl,
      lastSignedIn: Date.now(),
    };

    let userId;
    if (user !== null) {
      await ctx.db.patch(user._id, userData);
      userId = user._id;
    } else {
      userId = await ctx.db.insert("users", {
        ...userData,
        clerkId: identity.subject,
        tokenIdentifier: identity.tokenIdentifier,
        tier: "free",
        credits: 10,
      });
    }

    // 🔄 Sync to Neon
    await ctx.scheduler.runAfter(0, internal.sync.syncUserToNeon, {
      clerkId: identity.subject,
      email: identity.email!,
      name: identity.name,
      imageUrl: identity.pictureUrl,
    });

    return userId;
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();
  },
});

export const getUserByIdInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
