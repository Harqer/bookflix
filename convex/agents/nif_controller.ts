import { v } from "convex/values";
import { ActionCtx, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { logger } from "../lib/observability";
import { withSentry } from "../lib/sentry";
import { Id } from "../_generated/dataModel";

/**
 * 👑 Sovereign NIF Controller (Atomic Architecture Edition)
 * Purpose: Global Orchestration of the Cinematic Firing Cycle.
 * Principles: Single Responsibility, Composable Phases, Scalable State.
 */

// --- 1. Focus Units (Internal Logic Atoms) ---

async function runIngestionPhase(ctx: ActionCtx, bookId: Id<"books">, userId: string) {
  await logger.info("📚 NIF: Phase 1 - Ingestion (The Scout)", bookId);
  return await ctx.runAction(api.agents.book_analyst.analyzeBook, {
    bookId,
    userId,
  });
}

async function runOrchestrationPhase(ctx: ActionCtx, bookId: Id<"books">) {
  await logger.info("🎬 NIF: Phase 2 - Orchestration (The Director)", bookId);
  
  const book = await ctx.runQuery(api.studio.getBook, { id: bookId });
  if (!book || !book.atmosphericDNA) throw new Error("Narrative Context Missing");

  const chapters = await ctx.runQuery(api.studio.listChapters, { bookId });
  
  // Parallel execution for high-throughput scaling
  return await Promise.all(
    chapters.map((ch: any) =>
      ctx.runAction(internal.agents.director.orchestrateChapterProduction, {
        chapterId: ch._id,
        bookId,
        screenplay: ch.summary || "",
        dna: book.atmosphericDNA,
      })
    )
  );
}

// --- 2. The Orchestrator (Global Action) ---

export const triggerProductionCycle = internalAction({
  args: {
    bookId: v.id("books"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await withSentry("triggerProductionCycle", async () => {
      const traceId = args.bookId;
      
      try {
        // Step 1: Scout Ingestion
        await runIngestionPhase(ctx, args.bookId, args.userId);

        // Step 2: Director Orchestration
        await runOrchestrationPhase(ctx, args.bookId);

        await logger.info("✅ NIF: Firing Cycle Complete", traceId);
        return { status: "success" };

      } catch (err) {
        await logger.error("❌ NIF: Firing Cycle Failed", traceId, { error: String(err) });
        
        await ctx.runMutation(internal.studio.updateBookStatusInternal, {
          bookId: args.bookId,
          status: "failed",
        });
        
        throw err;
      }
    });
  },
});
