import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * 🌊 Convex Reactive Schema
 * Replaces Drizzle/Postgres with a high-performance document store.
 * Scaled for millions of users with native vector search.
 */
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    credits: v.number(),
    organizationId: v.optional(v.string()),
    lastSignedIn: v.number(), // Timestamp
  }).index("by_clerkId", ["clerkId"]),

  books: defineTable({
    userId: v.string(),
    title: v.string(),
    author: v.string(),
    genre: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    era: v.optional(v.string()),
    tone: v.optional(v.string()),
    summary: v.optional(v.string()),
    rawText: v.string(),
    status: v.string(),
    chapterCount: v.number(),
    analyzedChapters: v.number(),
    createdAt: v.number(),
    preferredLlm: v.optional(v.union(v.literal("cloud"), v.literal("personal"))),
    backgroundTrainingEnabled: v.optional(v.boolean()),
    atmosphericDNA: v.optional(v.any()), // Extracted by Scout, used by Director
  }).index("by_userId", ["userId"]),

  chapters: defineTable({
    bookId: v.id("books"),
    chapterNumber: v.number(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    screenplay: v.optional(v.string()),
    status: v.string(),
  })
    .index("by_bookId", ["bookId"])
    .searchIndex("search_screenplay", {
      searchField: "screenplay",
      filterFields: ["bookId"],
    }),

  videoScenes: defineTable({
    chapterId: v.id("chapters"),
    sceneNumber: v.number(),
    slugline: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")), // Native Convex File Storage
    status: v.string(), // pending, complete
  }).index("by_chapterId", ["chapterId"]),

  render_jobs: defineTable({
    userId: v.string(),
    bookId: v.id("books"),
    status: v.string(),
    progress: v.number(),
    cost: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // 🧠 World Bible (Vector Store)
  // Advanced 2026 Feature: Native Vector Search inside Convex
  worldBibles: defineTable({
    bookId: v.id("books"),
    content: v.string(),
    embedding: v.array(v.number()), // 1536-dim or 4096-dim NVIDIA embeddings
    metadata: v.any(),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["bookId"],
  }),
});
