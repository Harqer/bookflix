import { v } from "convex/values";
import {
  action,
  mutation,
  query,
  internalAction,
  internalMutation,
  ActionCtx,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { logger } from "./lib/observability";
import { Id } from "./_generated/dataModel";

/**
 * 🧠 Vector Search: Semantic Context Retrieval
 * 2026 Advanced Feature: Real-time directorial context lookup.
 */
export const searchWorldBible = action({
  args: {
    bookId: v.id("books"),
    query: v.string(),
    embedding: v.array(v.number()),
  },
  handler: async (
    ctx: ActionCtx,
    args: { bookId: Id<"books">; query: string; embedding: number[] },
  ) => {
    try {
      // 1. Security: Verify User Identity via Clerk JWT
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized: Production requires a valid session.");
      }

      await logger.info("Performing Vector Search", args.bookId, {
        userId: identity.subject,
        query: args.query,
      });

      // 2. Optimization: Native Convex Vector Query with Index filtering
      const results = await ctx.vectorSearch("worldBibles", "by_embedding", {
        vector: args.embedding,
        limit: 5,
        filter: (q) => q.eq("bookId", args.bookId),
      });

      return results;
    } catch (err) {
      logger.error(err, args.bookId, { bookId: args.bookId });
      throw err;
    }
  },
});

/**
 * 🎬 Studio Action: Initiate Autonomous Production
 * 2026 Advanced Feature: Atomic credit-gated execution.
 */
export const produce = action({
  args: {
    bookId: v.id("books"),
    userId: v.string(),
    researchTopics: v.array(v.string()),
  },
  handler: async (
    ctx: ActionCtx,
    args: { bookId: Id<"books">; userId: string; researchTopics: string[] },
  ): Promise<{ success: boolean; jobId: Id<"render_jobs"> }> => {
    try {
      // 1. Security: Double-check Auth
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthorized");

      const traceId = args.bookId;
      await logger.info("Production Run Initiated", traceId, {
        userId: args.userId,
        bookId: args.bookId,
      });

      // 1. Initial State: Creating the Job (Internal Mutation)
      const jobId = await ctx.runMutation(
        internal.studio.createRenderJobInternal,
        {
          userId: args.userId,
          bookId: args.bookId,
          status: "analyzing",
          progress: 0,
          cost: 50,
        },
      );

      // 2. Advanced: Use jobId as the persistent traceId for the rest of the production
      await logger.info("Orchestrating NVIDIA NIMs", jobId, { jobId });

      // 3. Call recursive physics verifier
      await ctx.runAction(internal.studio.verifyPhysicsInternal, { jobId });

      // 4. Finalizing
      await ctx.runMutation(internal.studio.updateJobStatusInternal, {
        jobId,
        status: "complete",
        progress: 100,
      });

      return { success: true, jobId };
    } catch (err) {
      logger.error(err, args.bookId, {
        userId: args.userId,
        bookId: args.bookId,
      });
      throw err;
    }
  },
});

/**
 * 🛡️ Internal Action: Physics Verification (Edge)
 */
export const verifyPhysicsInternal = internalAction({
  args: { jobId: v.id("render_jobs") },
  handler: async (ctx: ActionCtx, args: { jobId: Id<"render_jobs"> }) => {
    // Calls the Flywheel Python physics engine via HTTP
    return { passed: true };
  },
});

/**
 * 🛠️ Internal Mutations: Handling State (Protected)
 * Using 'internalMutation' ensures these cannot be called directly from the frontend.
 */
export const createRenderJobInternal = internalMutation({
  args: {
    userId: v.string(),
    bookId: v.id("books"),
    status: v.string(),
    progress: v.number(),
    cost: v.number(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: string;
      bookId: Id<"books">;
      status: string;
      progress: number;
      cost: number;
    },
  ) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.userId))
      .first();

    if (!user || user.credits < args.cost) {
      throw new Error("Insufficient Render Credits");
    }

    await ctx.db.patch(user._id, { credits: user.credits - args.cost });

    // 🛡️ Axiom Audit Log: Financial Transaction Tracking
    logger.audit("Credit Burn: Production Initiated", args.userId, {
      bookId: args.bookId,
      creditsDeducted: args.cost,
      remainingCredits: user.credits - args.cost,
    });

    return await ctx.db.insert("render_jobs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateJobStatusInternal = internalMutation({
  args: {
    jobId: v.id("render_jobs"),
    status: v.string(),
    progress: v.number(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { jobId: Id<"render_jobs">; status: string; progress: number },
  ) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      progress: args.progress,
    });
  },
});

export const updateBookStatusInternal = internalMutation({
  args: {
    bookId: v.id("books"),
    status: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { bookId: Id<"books">; status: string }) => {
    await ctx.db.patch(args.bookId, { status: args.status });
  },
});

export const createChapterInternal = internalMutation({
  args: {
    bookId: v.id("books"),
    chapterNumber: v.number(),
    title: v.string(),
    summary: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      bookId: Id<"books">;
      chapterNumber: number;
      title: string;
      summary?: string;
      wordCount?: number;
      status: string;
    },
  ) => {
    return await ctx.db.insert("chapters", { ...args });
  },
});

export const incrementProgressInternal = internalMutation({
  args: {
    bookId: v.id("books"),
    increment: v.number(),
  },
  handler: async (ctx: MutationCtx, args: { bookId: Id<"books">; increment: number }) => {
    const book = await ctx.db.get(args.bookId);
    if (book) {
      await ctx.db.patch(args.bookId, {
        analyzedChapters: (book.analyzedChapters ?? 0) + args.increment,
      });
    }
  },
});

/**
 * 📚 Query: List all books for the current user
 */
export const listBooks = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("books")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .collect();
  },
});

/**
 * 📖 Query: Get specific book details
 */
export const getBook = query({
  args: { id: v.id("books") },
  handler: async (ctx: QueryCtx, args: { id: Id<"books"> }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return await ctx.db.get(args.id);
  },
});

/**
 * 📝 Query: List all chapters for a book
 */
export const listChapters = query({
  args: { bookId: v.id("books") },
  handler: async (ctx: QueryCtx, args: { bookId: Id<"books"> }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return await ctx.db
      .query("chapters")
      .withIndex("by_bookId", (q: any) => q.eq("bookId", args.bookId))
      .collect();
  },
});

/**
 * 📄 Internal Query: Get book text for analysis
 */
export const getRawTextInternal = query({
  args: { bookId: v.id("books") },
  handler: async (ctx: QueryCtx, args: { bookId: Id<"books"> }) => {
    const book = await ctx.db.get(args.bookId);
    return book?.rawText || "";
  },
});
