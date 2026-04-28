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
  type User,
  type Book,
  type WorldBible,
  type ProcessingJob
} from "../drizzle/schema";
import type { PipelineLogEntry } from "./orchestration";
import { ENV } from "./_core/env";

// ─── Connection Management ───────────────────────────────────────────────────

let _db: ReturnType<typeof drizzle> | null = null;

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

/**
 * Global limit for concurrent AI/DB operations to ensure scalability
 * and prevent overwhelming serverless resources.
 */
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

export async function getUserById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// ─── Books ────────────────────────────────────────────────────────────────────

export async function createBook(data: any, orgId: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Enforce Org Binding for Enterprise Security
  const [inserted] = await db.insert(books).values({
    ...data,
    organizationId: orgId
  }).returning({ id: books.id });
  
  return inserted.id;
}

export async function getBookById(id: string, orgId: string) {
  const db = await getDb();
  if (!db) return null;
  
  // RLS Enforcement: User can only see books in their organization
  const result = await db.select().from(books)
    .where(and(eq(books.id, id), eq(books.organizationId, orgId)))
    .limit(1);
    
  return result[0] || null;
}

export async function getUserBooks(userId: string, orgId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(books)
    .where(and(eq(books.userId, userId), eq(books.organizationId, orgId)))
    .orderBy(desc(books.createdAt));
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

/**
 * Inserts a semantic vector embedding into the World Bible
 */
export async function insertWorldBibleEmbedding(bookId: string, content: string, vector: number[]) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(worldBibleEmbeddings).values({
    bookId,
    content,
    embedding: vector,
    createdAt: new Date(),
  });
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
  await db.update(processingJobs)
    .set({ currentStage: stage, overallProgress: progress })
    .where(eq(processingJobs.id, jobId));
}

export async function appendJobLog(jobId: string, entry: PipelineLogEntry) {
  const db = await getDb();
  if (!db) return;
  
  // Note: For massive log arrays in Postgres, we append to the JSONB array
  // In production, consider a separate 'job_logs' table for indexing.
  const job = await db.select().from(processingJobs).where(eq(processingJobs.id, jobId)).limit(1);
  if (!job[0]) return;
  
  const updatedLogs = [...((job[0].logs as any[]) || []), entry];
  await db.update(processingJobs)
    .set({ logs: updatedLogs })
    .where(eq(processingJobs.id, jobId));
}
