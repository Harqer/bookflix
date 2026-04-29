import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import pLimit from "p-limit";
import { 
  users, 
  books, 
  worldBibles, 
  worldBibleEmbeddings, 
  processingJobs,
  chapters,
  videoScenes,
  type User,
  type Book,
  type WorldBible,
  type ProcessingJob,
  type Chapter
} from "../drizzle/schema";
import type { PipelineLogEntry } from "./types";
import { ENV } from "./_core/env";

// ─── Connection Management ───────────────────────────────────────────────────

let _db: any = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      const sql = neon(ENV.databaseUrl);
      _db = drizzle(sql);
    } catch (error) {
      console.warn("[Database] Failed to connect to Neon:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Batching & Performance ─────────────────────────────────────────────────

export const StudioConcurrency = pLimit(5);

// ─── User Management ────────────────────────────────────────────────────────

export async function upsertUser(user: Partial<User>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(users).values({
    id: user.id!,
    name: user.name ?? null,
    email: user.email ?? null,
    imageUrl: user.imageUrl ?? null,
    role: user.role ?? 'user',
    credits: user.credits ?? 100,
    tier: user.tier ?? 'free',
    lastSignedIn: new Date(),
  }).onConflictDoUpdate({
    target: users.id,
    set: {
      name: user.name ?? null,
      email: user.email ?? null,
      imageUrl: user.imageUrl ?? null,
      lastSignedIn: new Date(),
    }
  });
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function deductCredits(userId: string, amount: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const user = await getUserById(userId);
  if (!user || user.credits < amount) return false;

  await db.update(users)
    .set({ credits: user.credits - amount, updatedAt: new Date() })
    .where(eq(users.id, userId));
    
  return true;
}

export async function updateUserTier(userId: string, tier: "free" | "pro" | "enterprise"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ tier, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Books ────────────────────────────────────────────────────────────────────

export async function createBook(data: any, orgId: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(books).values({ ...data, organizationId: orgId }).returning({ id: books.id });
  return inserted.id;
}

export async function getBookById(id: string, orgId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(books).where(and(eq(books.id, id), eq(books.organizationId, orgId))).limit(1);
  return result[0] || null;
}

// ─── World Bible & RAG ────────────────────────────────────────────────────────

export async function upsertWorldBible(bookId: string, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(worldBibles).values({
    bookId,
    characters: data.characters || {},
    locations: data.locations || {},
    timeline: data.timeline || [],
    themes: data.themes || [],
    tone: data.tone,
    era: data.era,
  }).onConflictDoUpdate({
    target: worldBibles.bookId,
    set: { ...data, updatedAt: new Date() }
  });
}

export async function getWorldBible(bookId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(worldBibles).where(eq(worldBibles.bookId, bookId)).limit(1);
  return result[0] || null;
}

export async function insertWorldBibleEmbedding(bookId: string, content: string, vector: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(worldBibleEmbeddings).values({ bookId, content, embedding: vector, createdAt: new Date() });
}

// ─── Processing Jobs ──────────────────────────────────────────────────────────

export async function createJob(data: any): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(processingJobs).values(data).returning({ id: processingJobs.id });
  return inserted.id;
}

export async function updateJobStage(jobId: string, stage: any, progress: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(processingJobs).set({ currentStage: stage, overallProgress: progress }).where(eq(processingJobs.id, jobId));
}

export async function appendJobLog(jobId: string, entry: PipelineLogEntry) {
  const db = await getDb();
  if (!db) return;
  const job = await db.select().from(processingJobs).where(eq(processingJobs.id, jobId)).limit(1);
  if (!job[0]) return;
  const updatedLogs = [...((job[0].logs as any[]) || []), entry];
  await db.update(processingJobs).set({ logs: updatedLogs }).where(eq(processingJobs.id, jobId));
}

// ─── Chapters ────────────────────────────────────────────────────────────────

export async function createChapter(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chapters).values(data);
}

export async function getChaptersByBookId(bookId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chapters).where(eq(chapters.bookId, bookId)).orderBy(chapters.chapterNumber);
}

export async function getChapterById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
  return result[0] || null;
}

export async function getChapterByNumber(bookId: string, chapterNumber: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chapters).where(and(eq(chapters.bookId, bookId), eq(chapters.chapterNumber, chapterNumber))).limit(1);
  return result[0] || null;
}

export async function updateChapterStatus(id: string, status: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(chapters).set({ status, updatedAt: new Date() }).where(eq(chapters.id, id));
}

export async function updateChapterScreenplay(id: string, screenplay: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(chapters).set({ screenplay, updatedAt: new Date() }).where(eq(chapters.id, id));
}

export async function updateChapterThumbnail(id: string, thumbnailUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(chapters).set({ thumbnailUrl, updatedAt: new Date() }).where(eq(chapters.id, id));
}

export async function updateBookStatus(id: string, status: any, chapterCount?: number) {
  const db = await getDb();
  if (!db) return;
  const update: any = { status, updatedAt: new Date() };
  if (chapterCount !== undefined) update.chapterCount = chapterCount;
  await db.update(books).set(update).where(eq(books.id, id));
}

export async function completeJob(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(processingJobs).set({ currentStage: "complete", overallProgress: 100, completedAt: new Date(), isActive: false }).where(eq(processingJobs.id, id));
}

export async function failJob(id: string, error: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(processingJobs).set({ currentStage: "error", isActive: false }).where(eq(processingJobs.id, id));
}

export async function updateBookStatusError(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(books).set({ status: "error", updatedAt: new Date() }).where(eq(books.id, id));
}

export async function getJobById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(processingJobs).where(eq(processingJobs.id, id)).limit(1);
  return result[0] || null;
}

export async function getScenesByChapterId(chapterId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoScenes).where(eq(videoScenes.chapterId, chapterId)).orderBy(videoScenes.sceneNumber);
}

export async function createVideoScene(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(videoScenes).values(data);
}

export async function updateSceneKeyframe(chapterId: string, sceneNumber: number, url: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(videoScenes)
    .set({ keyframeImageUrl: url, status: "complete", updatedAt: new Date() })
    .where(and(eq(videoScenes.chapterId, chapterId), eq(videoScenes.sceneNumber, sceneNumber)));
}
export async function getUserBooks(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(books).where(eq(books.userId, userId)).orderBy(desc(books.createdAt));
}

export async function deleteBook(id: string, userId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(books).where(and(eq(books.id, id), eq(books.userId, userId)));
}

export async function getActiveJobForBook(bookId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(processingJobs)
    .where(and(eq(processingJobs.bookId, bookId), eq(processingJobs.isActive, true)))
    .limit(1);
  return result[0] || null;
}

export async function cancelJob(jobId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(processingJobs).set({ isCancelled: true, isActive: false }).where(eq(processingJobs.id, jobId));
}
