"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { logger } from "../lib/observability";

/**
 * 🎬 Master Finisher Agent
 * Purpose: Final narrative check and production wrap-up.
 */
export const finalizeProduction = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
  },
  handler: async (ctx, args) => {
    const traceId = args.chapterId;
    await logger.info("🎬 Finisher: Starting Final Production Wrap-up...", traceId);

    // 1. Fetch Book context
    const book = await ctx.runQuery(api.studio.getBook, { id: args.bookId });
    if (!book || !book.atmosphericDNA) throw new Error("Narrative DNA Missing");

    const user = await ctx.runQuery(internal.users.getUserByIdInternal, { userId: book.userId as any });
    const isPremium = user?.tier === "pro" || user?.tier === "enterprise";

    await logger.info(`👁️ Finisher: ${isPremium ? "Premium Run" : "Ad-Supported Run"}`, traceId);

    // 2. Mark Chapter as Complete
    await ctx.runMutation(internal.studio.updateChapterInternal, {
      chapterId: args.chapterId,
      status: "complete",
    });

    await logger.info("✅ Finisher: Production Wrap-up Complete", traceId);
    return { status: "complete" };
  },
});
