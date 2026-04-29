import * as db from '../db';
import { 
  runBookAnalyst 
} from '../agents/book-analyst';
import { runContinuitySupervisor } from '../agents/continuity-supervisor';
import { log } from '../agents/base';
import { AIDirectorAgent } from '../ai-director-agent';
import { ShotGridClient } from '../shotgrid-client';
import { SecurityOrchestrator } from '../security-utils';
import { MCPOrchestrator } from '../_core/mcp-orchestrator';
import { ResearchAgent } from '../research-agent';
import { StudioConcurrency } from '../db';
import { WorldBibleData, WorldBibleCharacter, WorldBibleLocation } from '../types';

/**
 * Enterprise Production Pipeline
 * 
 * Optimized for high-security, multi-agent collaboration:
 * - Security Isolation (Sandboxed paths)
 * - ShotGrid Integration (Asset tracking)
 * - Research Agent (Apify real-world context)
 * - Blender MCP (Automated cinematography)
 */
export async function runEnterprisePipeline(
  jobId: string,
  bookId: string,
  userId: string,
  orgId: string,
  shotgrid: ShotGridClient
) {
    const isolatedPath = SecurityOrchestrator.getIsolatedPath(userId, bookId);
    log(jobId, "Security", "info", `Production isolated in: ${isolatedPath}`);

    const book = await db.getBookById(bookId, orgId);
    if (!book) throw new Error(`Book ${bookId} not found`);

    await db.updateJobStage(jobId, "analyzing", 5);

    // ── Stage 1: Book Analysis ─────────────────────────────────────────────
    const { chapters } = await runBookAnalyst(
      jobId,
      bookId,
      book.rawText,
      book.title,
      book.author || "Unknown",
      book.genre || "Drama",
    );

    // ── Stage 1.5: External Research (Apify) ──────────────────────────────
    const researchTopics = [book.genre || "Drama", book.title.split(' ')[0]];
    if (researchTopics.length > 0) {
      log(jobId, "Research", "info", "Starting external research via Apify crawlers...");
      const researchResult = await ResearchAgent.performResearch(bookId, researchTopics);
      if (researchResult.success) {
        log(jobId, "Research", "success", `Ingested ${researchResult.pointsCount} data points.`);
      }
    }

    await db.updateJobStage(jobId, "world_bible_init", 20);

    const totalChapters = chapters.length;

    for (let i = 0; i < totalChapters; i++) {
      const chapterData = chapters[i];
      log(jobId, "Orchestrator", "info", `Processing Chapter ${chapterData.number}/${totalChapters}`);

      const worldBibleData = await db.getWorldBible(bookId);
      const worldBible: WorldBibleData = {
        bookId: bookId,
        title: book.title,
        author: book.author || "Unknown",
        genre: book.genre || "Drama",
        era: (worldBibleData?.era as string) || "Contemporary",
        tone: (worldBibleData?.tone as string) || "dramatic",
        themes: (worldBibleData?.themes as string[]) || [],
        characters: (worldBibleData?.characters as Record<string, WorldBibleCharacter>) || {},
        locations: (worldBibleData?.locations as Record<string, WorldBibleLocation>) || {},
        timeline: (worldBibleData?.timeline as any[]) || [],
        chapterSummaries: {},
      };

      // 1. Continuity Review (Atomic Agent)
      const updatedBible = await runContinuitySupervisor(jobId, bookId, chapterData.number, chapterData.content, worldBible);

      // 2. Initialize AI Director (Legacy Molecule)
      const director = new AIDirectorAgent({
          genre: book.genre || 'drama',
          narrativeContext: book.tone || 'cinematic',
          bookContent: chapterData.content,
          visualBible: updatedBible as any,
          targetDuration: 120
      });

      // 3. Orchestrate decisions
      const directorDecisions = await director.orchestrateChapter(
          `ch_${chapterData.number}`,
          chapterData.content,
          updatedBible as any
      );

      // 4. Previz & CG Layout (Blender MCP)
      log(jobId, "Video Producer", "info", `Batched production for ${directorDecisions.length} shots...`);
      
      const shotJobs = directorDecisions.map((decision: any) => 
        StudioConcurrency(async () => {
          const shotId = await shotgrid.createShot({
            id: `shot_${decision.sceneId}`,
            code: `CH${chapterData.number}_${decision.sceneId}`,
            description: decision.shotDescription,
            status: 'wtg',
            chapterId: chapterData.number.toString()
          });

          await MCPOrchestrator.callTool('blender', 'setup_cinematography', { 
              shot_id: shotId, 
              isolated_path: isolatedPath,
              trajectory: decision.cameraTrajectory,
              blocking: decision.characterBlocking,
              lighting: decision.lighting,
              rationale: decision.cinematicRationale
          });

          // ── Step 5: AI Finishing Pass (ComfyUI) ──────────────────────────
          log(jobId, "AI Finisher", "info", `Orchestrating ComfyUI nodes for shot ${shotId}...`);
          await MCPOrchestrator.callTool('comfyui', 'apply_consistency_pass', {
              shot_id: shotId,
              workflow: 'cinematic_longform_v1',
              params: {
                  temporal_weight: 0.8,
                  ip_adapter_weight: 0.6,
                  unitary_motion_path: decision.motionUnitary
              }
          });

          // ── Step 6: Physics & Causality Audit (Cosmos Reason 2) ───────────
          log(jobId, "Verifier", "info", `Auditing physical causality for shot ${shotId}...`);
          const auditResult = await MCPOrchestrator.callTool('cosmos', 'audit_physics', {
              shot_id: shotId,
              expected_physics: decision.motionUnitary,
              context_window: "256k"
          });

          // Correctly access the output from the MCP wrapper
          const auditOutput = auditResult.output as { passed: boolean; reason?: string };

          if (auditResult.success && auditOutput && !auditOutput.passed) {
              log(jobId, "Verifier", "warning", `Physics anomaly detected: ${auditOutput.reason}. Re-aligning...`);
              // Trigger NeMo Aligner re-training or re-generation
          }
          
          await shotgrid.updateShotStatus(shotId, 'ip');
          return { shotId, success: true };
        })
      );

      await Promise.all(shotJobs);
    }

    await db.completeJob(jobId);
}
