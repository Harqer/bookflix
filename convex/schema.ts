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
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    credits: v.number(),
    organizationId: v.optional(v.string()),
    lastSignedIn: v.number(), // Timestamp
  }).index("by_clerkId", ["clerkId"])
    .index("by_token", ["tokenIdentifier"]),

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
    productionMode: v.optional(v.union(v.literal("movie"), v.literal("series"))),
    createdAt: v.number(),
    preferredLlm: v.optional(v.union(v.literal("cloud"), v.literal("personal"))),
    backgroundTrainingEnabled: v.optional(v.boolean()),
    progress: v.optional(v.number()), // Production progress tracking
    atmosphericDNA: v.optional(v.any()), // Extracted by Scout, used by Director
    characterManifest: v.optional(v.any()), // Sovereign asset tracking
    productionStyle: v.optional(v.string()), // Luminous, etc.
    productionType: v.optional(v.string()), // Legacy field
    consistencyScores: v.optional(v.object({
      characterAppearance: v.number(),
      characterPersonality: v.number(),
      locationVisuals: v.number(),
      locationMood: v.number(),
      timelineAccuracy: v.number(),
      themeCoherence: v.number(),
      overall: v.number(),
    })),
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
    videoUrl: v.optional(v.string()), // 🚀 Vercel Blob Storage URL
    startTime: v.optional(v.number()), // For metadata-aware clipping
    endTime: v.optional(v.number()), // For metadata-aware clipping
    captionUrl: v.optional(v.string()), // Deepgram generated captions
    cameraParams: v.optional(v.any()), // JSON representation of CameraControlState
    status: v.string(), // pending, complete
    audioManifest: v.optional(v.any()), // Symphonic mix (Voice + Score + SFX)
  }).index("by_chapterId", ["chapterId"]),

  render_jobs: defineTable({
    userId: v.string(),
    bookId: v.id("books"),
    chapterId: v.optional(v.id("chapters")),
    sceneId: v.optional(v.id("videoScenes")),
    type: v.optional(v.string()), // e.g., "vision", "lighting", "consistency"
    config: v.optional(v.any()), // The brief or task payload
    status: v.string(), // "pending", "processing", "completed", "failed"
    progress: v.number(),
    cost: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_bookId", ["bookId"]),

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

  // 🛰️ Siphon Fleet Nodes
  siphon_nodes: defineTable({
    nodeId: v.string(),
    type: v.string(), // "nuke_render", "unreal_render", "houdini_fx", "maya_animation"
    vram: v.number(),
    status: v.string(), // "idle", "busy", "offline"
    endpoint: v.string(),
    region: v.optional(v.string()),
    lastSeen: v.number(),
  })
    .index("by_nodeId", ["nodeId"])
    .index("by_type", ["type", "status"]),

  // 👤 Character Consistency DNA
  characters: defineTable({
    bookId: v.id("books"),
    name: v.string(),
    dna: v.any(), // Visual anchor, latent seed, etc.
  }).index("by_bookId", ["bookId"]),

  // 🎬 Video Shots (Granular scene breakdown)
  videoShots: defineTable({
    sceneId: v.id("videoScenes"),
    shotNumber: v.number(),
    description: v.string(),
    status: v.string(),
  }).index("by_sceneId", ["sceneId"]),

  // 🛡️ Scalability: Semantic Brief Cache
  brief_cache: defineTable({
    dnaHash: v.string(), // Hashed Atmospheric DNA
    screenplayHash: v.string(), // Hashed Screenplay snippet
    brief: v.any(), // The generated USD brief
    createdAt: v.number(),
  }).index("by_dna_screenplay", ["dnaHash", "screenplayHash"]),

  // 💬 Directorial Chat & Feedback Loops
  messages: defineTable({
    bookId: v.id("books"),
    text: v.string(),
    role: v.union(v.literal("user"), v.literal("ai")),
    createdAt: v.number(),
  }).index("by_bookId", ["bookId"]),
});
