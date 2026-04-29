import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

/**
 * Enums for Type Safety
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "pro", "enterprise"]);
export const productionStyleEnum = pgEnum("production_style", ["cinematic", "animated", "documentary"]);
export const productionStatusEnum = pgEnum("production_status", [
  "pending",
  "analyzing",
  "scripting",
  "directing",
  "filming",
  "assembling",
  "complete",
  "error",
]);

/**
 * Core User Table
 * Using UUIDv7 for high-performance indexing in 2026.
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk ID
  name: text("name"),
  email: varchar("email", { length: 320 }),
  imageUrl: text("imageUrl"),
  role: roleEnum("role").default("user").notNull(),
  tier: subscriptionTierEnum("tier").default("free").notNull(),
  credits: integer("credits").default(100).notNull(),
  organizationId: varchar("organizationId", { length: 255 }), // Enterprise Org Support
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Books Table
 */
export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(), // UUIDv7 compatible
  userId: varchar("userId", { length: 255 }).notNull(),
  organizationId: varchar("organizationId", { length: 255 }), // RLS Partition
  title: varchar("title", { length: 500 }).notNull(),
  author: varchar("author", { length: 255 }).notNull().default("Unknown"),
  genre: varchar("genre", { length: 100 }).default("Drama"),
  synopsis: text("synopsis"),
  rawText: text("rawText").notNull(),
  wordCount: integer("wordCount").default(0),
  chapterCount: integer("chapterCount").default(0),
  productionStyle: productionStyleEnum("productionStyle").default("cinematic"),
  status: productionStatusEnum("status").default("pending").notNull(),
  tone: varchar("tone", { length: 100 }).default("dramatic"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Chapters Table
 * Stores individual chapter text and status for iterative processing.
 */
export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("bookId").notNull().references(() => books.id),
  chapterNumber: integer("chapterNumber").notNull(),
  title: varchar("title", { length: 500 }),
  rawContent: text("rawContent").notNull(),
  screenplay: text("screenplay"),
  summary: text("summary"),
  thumbnailUrl: text("thumbnailUrl"),
  wordCount: integer("wordCount").default(0),
  status: productionStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * World Bible (RAG Memory)
 * Optimized with JSONB for binary search and nested data.
 */
export const worldBibles = pgTable("world_bibles", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("bookId").notNull().references(() => books.id),
  characters: jsonb("characters").notNull(),
  locations: jsonb("locations").notNull(),
  timeline: jsonb("timeline").notNull(),
  themes: jsonb("themes").notNull(),
  tone: varchar("tone", { length: 255 }),
  era: varchar("era", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Semantic Vector Layer (PgVector)
 * This stores the actual embeddings for RAG.
 */
export const worldBibleEmbeddings = pgTable("world_bible_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("bookId").notNull().references(() => books.id),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI standard
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // HNSW Index for Enterprise-grade Vector Search Speed (Postgres 18 optimized)
  embeddingIndex: vector("embeddingIndex").on(table.embedding).using("hnsw", { m: 16, ef_construction: 64 }),
}));

/**
 * Processing Jobs (Inngest State Machine)
 */
export const processingJobs = pgTable("processing_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("bookId").notNull().references(() => books.id),
  userId: varchar("userId", { length: 255 }).notNull(),

  currentStage: productionStatusEnum("currentStage").default("pending").notNull(),
  overallProgress: integer("overallProgress").default(0),
  logs: jsonb("logs").notNull().default([]),
  isActive: boolean("isActive").default(true).notNull(),
  isCancelled: boolean("isCancelled").default(false).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

/**
 * Video Scenes Table
 * Tracks granular scene data for Hollywood-standard quality control.
 */
export const videoScenes = pgTable("video_scenes", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("bookId").notNull().references(() => books.id),
  chapterId: uuid("chapterId").notNull().references(() => chapters.id),
  sceneNumber: integer("sceneNumber").notNull(),
  slugline: varchar("slugline", { length: 500 }),
  actionLines: text("actionLines"),
  dialogue: text("dialogue"),
  visualPrompt: text("visualPrompt"),
  videoUrl: text("videoUrl"),
  keyframeImageUrl: text("keyframeImageUrl"),
  status: text("status").default("pending"), // 'pending', 'reviewing', 'complete'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Feedback & RLHF Data (Continuous Improvement Loop)
 */
export const productionFeedback = pgTable("production_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("jobId").notNull().references(() => processingJobs.id),
  sceneId: uuid("sceneId").references(() => videoScenes.id),
  
  // Human Stars (1-5)
  userRating: integer("userRating"),
  userComment: text("userComment"),
  
  // AI Critique (Aesthetics, Physics, Lighting)
  aiScore: integer("aiScore"),
  aiCritique: jsonb("aiCritique"),
  
  promptUsed: text("promptUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Book = InferSelectModel<typeof books>;
export type NewBook = InferInsertModel<typeof books>;

export type Chapter = InferSelectModel<typeof chapters>;
export type NewChapter = InferInsertModel<typeof chapters>;

export type WorldBible = InferSelectModel<typeof worldBibles>;
export type NewWorldBible = InferInsertModel<typeof worldBibles>;

export type ProcessingJob = InferSelectModel<typeof processingJobs>;
export type NewProcessingJob = InferInsertModel<typeof processingJobs>;
