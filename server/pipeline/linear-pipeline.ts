import * as db from "../db";
import { log } from "../agents/base";
import { runBookAnalyst } from "../agents/book-analyst";
import { runContinuitySupervisor } from "../agents/continuity-supervisor";
import { runScreenwriter } from "../agents/screenwriter";
import { runVisualDirector } from "../agents/visual-director";
import { runVideoProducer } from "../agents/video-producer";

/**
 * BookCinema AI Orchestration Engine (Linear Pipeline)
 * Refactored using Invisible Atomic Design principles.
 * 
 * Molecules: processChapter
 * Organism: runFullPipeline
 */

import { WorldBibleData, PipelineLogEntry, WorldBibleCharacter, WorldBibleLocation } from "../types";

// ─── Molecule: Chapter Workflow ───────────────────────────────────────────────

async function processChapter(
  jobId: string,
  bookId: string,
  chapterData: any,
  worldBible: WorldBibleData,
  progress: number
): Promise<void> {
  const dbChapter = await db.getChapterByNumber(bookId, chapterData.number);
  if (!dbChapter) return;

  // 1. Continuity check (Atomic Agent)
  await db.updateJobStage(jobId, "screenplay_generation", progress);
  const updatedBible = await runContinuitySupervisor(jobId, bookId, chapterData.number, chapterData.content, worldBible);

  // 2. Screenplay generation (Atomic Agent)
  await db.updateChapterStatus(dbChapter.id, "scripting");
  const screenplay = await runScreenwriter(jobId, dbChapter.id, chapterData.number, chapterData.content, updatedBible);

  // 3. Visual Direction (Atomic Agent)
  await db.updateChapterStatus(dbChapter.id, "directing");
  const scenes = await runVisualDirector(jobId, dbChapter.id, chapterData.number, screenplay, updatedBible);

  // 4. Video Production (Atomic Agent)
  await db.updateChapterStatus(dbChapter.id, "filming");
  await runVideoProducer(jobId, dbChapter.id, chapterData.number, scenes, updatedBible);
}

// ─── Organism: Main Pipeline Orchestrator ─────────────────────────────────────

export async function runFullPipeline(
  jobId: string,
  bookId: string,
  userId: string,
  orgId: string,
): Promise<void> {
  log(jobId, "Orchestrator", "info", "BookCinema AI Pipeline started");

  try {
    const book = await db.getBookById(bookId, orgId);
    if (!book) throw new Error(`Book ${bookId} not found`);

    await db.updateJobStage(jobId, "book_analysis", 5);

    // Stage 1: Book Analysis (Atomic Agent)
    const { chapters } = await runBookAnalyst(jobId, bookId, book.rawText, book.title, book.author, book.genre || "Drama");

    const totalChapters = chapters.length;
    for (let i = 0; i < totalChapters; i++) {
      const job = await db.getJobById(jobId);
      if (job?.isCancelled) {
        log(jobId, "Orchestrator", "warning", "Pipeline cancelled");
        return;
      }

      const chapterData = chapters[i];
      const progress = 20 + Math.floor((i / totalChapters) * 75);
      log(jobId, "Orchestrator", "info", `Processing chapter ${chapterData.number}/${totalChapters}`);

      const worldBible = await getValidatedWorldBible(bookId, book);
      await processChapter(jobId, bookId, chapterData, worldBible, progress);
    }

    await db.updateJobStage(jobId, "final_assembly", 95);
    await db.updateBookStatus(bookId, "complete", totalChapters);
    await db.completeJob(jobId);
    log(jobId, "Orchestrator", "success", "Pipeline complete!");

  } catch (err: any) {
    log(jobId, "Orchestrator", "error", `Pipeline failed: ${err.message}`);
    await db.failJob(jobId, err.message);
    await db.updateBookStatusError(bookId);
    throw err;
  }
}

async function getValidatedWorldBible(bookId: string, book: any): Promise<WorldBibleData> {
  const worldBibleData = await db.getWorldBible(bookId);
  return {
    bookId,
    title: book.title,
    author: book.author || "Unknown",
    genre: book.genre || "Drama",
    era: (worldBibleData?.era as string) || "Contemporary",
    tone: (worldBibleData?.tone as string) || "dramatic",
    themes: (worldBibleData?.themes as string[]) || [],
    characters: (worldBibleData?.characters as Record<string, WorldBibleCharacter>) || {},
    locations: (worldBibleData?.locations as Record<string, WorldBibleLocation>) || {},
    timeline: (worldBibleData?.timeline as any[]) || [],
    chapterSummaries: (worldBibleData?.chapterSummaries as Record<number, string>) || {},
  };
}
