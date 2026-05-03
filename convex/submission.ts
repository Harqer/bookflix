"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { protectAction } from "./arcjet";

/**
 * 🔒 Protected Production Submission
 * Uses Arcjet to prevent AI abuse and enforce the 1-video-per-day rule.
 */
export const submitBookProtected = action({
  args: {
    title: v.string(),
    author: v.string(),
    genre: v.optional(v.string()),
    rawText: v.string(),
    productionStyle: v.optional(v.string()),
    tone: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // --- 🛡️ ARCJET PROTECTION ---
    await protectAction(identity.subject, undefined, `${args.title} ${args.author} ${args.rawText.substring(0, 1000)}`);

    // --- ✅ AUTHORIZED: Triggering Production ---
    const result: any = await ctx.runMutation(internal.studio.submitBookInternal, {
      userId: identity.subject,
      title: args.title,
      author: args.author,
      genre: args.genre,
      rawText: args.rawText,
      productionStyle: args.productionStyle,
      tone: args.tone,
    });

    return result;
  },
});
