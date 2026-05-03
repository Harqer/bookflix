import { v } from "convex/values";
import {
  action,
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
  ActionCtx,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * 🎨 Studio Core API
 * Orchestrates the production lifecycle, state management, and semantic search.
 */

// --- 1. Primitives (Atomic Mutations & Queries) ---

export const updateJobStatusInternal = internalMutation({
  args: {
    jobId: v.id("render_jobs"),
    status: v.string(),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, { status: args.status, progress: args.progress });
  },
});

export const updateBookStatusInternal = internalMutation({
  args: {
    bookId: v.id("books"),
    status: v.string(),
    chapterCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookId, { 
      status: args.status,
      ...(args.chapterCount !== undefined && { chapterCount: args.chapterCount })
    });
  },
});

export const updateBookDNAInternal = internalMutation({
  args: {
    bookId: v.id("books"),
    dna: v.object({
      theme: v.string(),
      mood: v.string(),
      texture: v.string(),
      era: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookId, { atmosphericDNA: args.dna });
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
  handler: async (ctx, args) => {
    return await ctx.db.insert("chapters", { ...args });
  },
});

export const updateChapterInternal = internalMutation({
  args: {
    chapterId: v.id("chapters"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chapterId, { status: args.status });
  },
});

export const updateSceneInternal = internalMutation({
  args: {
    sceneId: v.id("videoScenes"),
    storageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sceneId, {
      status: args.status,
      ...(args.storageId && { storageId: args.storageId }),
      ...(args.videoUrl && { videoUrl: args.videoUrl }),
    });
  },
});

export const createSceneInternal = internalMutation({
  args: {
    chapterId: v.id("chapters"),
    sceneNumber: v.number(),
    slugline: v.string(),
    description: v.optional(v.string()),
    screenplayChunk: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("videoScenes", {
      chapterId: args.chapterId,
      sceneNumber: args.sceneNumber,
      slugline: args.slugline,
      status: "pending",
    });
  },
});

export const updateSceneMetadataInternal = internalMutation({
  args: {
    sceneId: v.id("videoScenes"),
    startTime: v.number(),
    endTime: v.number(),
    captionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sceneId, {
      startTime: args.startTime,
      endTime: args.endTime,
      captionUrl: args.captionUrl,
    });
  },
});

export const getRawTextInternal = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    return book?.rawText || "";
  },
});

export const getBookInternal = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookId);
  },
});

export const getBook = query({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const book = await ctx.db.get(args.id);
    if (!book || book.userId !== identity.subject) return null;
    return book;
  },
});

export const listBooks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("books")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const submitBookInternal = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    author: v.string(),
    genre: v.optional(v.string()),
    rawText: v.string(),
    productionStyle: v.optional(v.string()),
    tone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bookId = await ctx.db.insert("books", {
      userId: args.userId,
      title: args.title,
      author: args.author,
      genre: args.genre,
      tone: args.tone,
      rawText: args.rawText,
      status: "pending",
      chapterCount: 0,
      analyzedChapters: 0,
      createdAt: Date.now(),
    });
    
    await ctx.scheduler.runAfter(0, internal.agents.nif_controller.triggerProductionCycle, {
      bookId,
      userId: args.userId,
    });
    
    return { bookId };
  },
});

export const getWorldBible = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("worldBibles")
      .filter((q) => q.eq(q.field("bookId"), args.bookId))
      .collect();
    
    const characters = entries.filter(e => e.metadata?.type === 'character').map(e => e.metadata);
    const locations = entries.filter(e => e.metadata?.type === 'location').map(e => e.metadata);
    const timeline = entries.filter(e => e.metadata?.type === 'timeline').map(e => e.metadata);
    const themes = entries.filter(e => e.metadata?.type === 'theme').map(e => e.metadata);
    
    return { characters, locations, timeline, themes };
  },
});

export const listChaptersInternal = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chapters")
      .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
      .collect();
  },
});

export const listChapters = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chapters")
      .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
      .collect();
  },
});

export const getChapterById = query({
  args: { id: v.id("chapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) return null;

    const scenes = await ctx.db
      .query("videoScenes")
      .withIndex("by_chapterId", (q) => q.eq("chapterId", args.id))
      .collect();
    return { chapter, scenes };
  },
});

export const createRenderJobInternal = internalMutation({
  args: {
    chapterId: v.optional(v.id("chapters")),
    bookId: v.id("books"),
    type: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    
    return await ctx.db.insert("render_jobs", {
      userId: book.userId,
      bookId: args.bookId,
      chapterId: args.chapterId,
      type: args.type,
      config: args.config,
      status: "pending",
      progress: 0,
      cost: 0,
      createdAt: Date.now(),
    });
  },
});

export const listJobsInternal = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("render_jobs")
      .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
      .collect();
  },
});

export const getJobInternal = internalQuery({
  args: { jobId: v.id("render_jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const listScenesInternal = internalQuery({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videoScenes")
      .withIndex("by_chapterId", (q) => q.eq("chapterId", args.chapterId))
      .collect();
  },
});

export const getCachedBriefInternal = internalQuery({
  args: {
    dna: v.any(),
    screenplayHash: v.string(),
  },
  handler: async (ctx, args) => {
    const dnaHash = JSON.stringify(args.dna);
    const cached = await ctx.db
      .query("brief_cache")
      .withIndex("by_dna_screenplay", (q) => 
        q.eq("dnaHash", dnaHash).eq("screenplayHash", args.screenplayHash)
      )
      .first();
    return cached?.brief || null;
  },
});

export const cacheBriefInternal = internalMutation({
  args: {
    dna: v.any(),
    screenplayHash: v.string(),
    brief: v.any(),
  },
  handler: async (ctx, args) => {
    const dnaHash = JSON.stringify(args.dna);
    await ctx.db.insert("brief_cache", {
      dnaHash,
      screenplayHash: args.screenplayHash,
      brief: args.brief,
      createdAt: Date.now(),
    });
  },
});
