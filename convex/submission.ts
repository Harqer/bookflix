"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { protectAction } from "./arcjet";

/**
 * 🔒 Protected Production Submission
 */
export const submitBookProtected = action({
  args: {
    title: v.string(),
    author: v.string(),
    genre: v.optional(v.string()),
    rawText: v.string(),
    productionStyle: v.optional(v.string()),
    tone: v.optional(v.string()),
    productionMode: v.optional(v.union(v.literal("movie"), v.literal("series"))),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log("🚀 [Submission] Starting protected submission cycle...");
    
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity) {
      throw new Error("Unauthorized");
    }
    const identity = userIdentity;

    console.log("🛡️ [Submission] Identity verified:", identity.subject);

    // --- 🛡️ ARCJET PROTECTION ---
    try {
      await protectAction(identity.subject, undefined, `${args.title} ${args.author} ${args.rawText.substring(0, 1000)}`);
      console.log("✅ [Submission] Arcjet check passed.");
    } catch (e) {
      console.warn("⚠️ [Submission] Arcjet check failed or skipped:", e);
    }

    // --- ✅ TRIGGERING PRODUCTION ---
    try {
      console.log("📡 [Submission] Triggering submitBookInternal mutation...");
      const result: any = await ctx.runMutation(internal.studio.submitBookInternal, {
        userId: identity.subject,
        title: args.title,
        author: args.author,
        genre: args.genre,
        rawText: args.rawText,
        productionStyle: args.productionStyle,
        tone: args.tone,
        productionMode: args.productionMode,
      });
      console.log("✨ [Submission] Mutation successful. Book ID:", result.bookId);
      return result;
    } catch (err: any) {
      console.error("❌ [Submission] Mutation Error:", err);
      throw new Error(`Submission Failed: ${err.message}`);
    }
  },
});
