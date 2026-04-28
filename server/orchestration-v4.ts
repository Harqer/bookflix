import * as db from './db';
import { invokeLLM } from './_core/llm';
import { 
  runBookAnalyst, 
  runContinuitySupervisor, 
  runScreenwriter, 
  runVisualDirector, 
  runVideoProducer,
  WorldBibleData,
  WorldBibleCharacter,
  WorldBibleLocation
} from './orchestration';

import { AIDirectorAgent, DirectorDecision } from './ai-director-agent';
import { ShotGridClient } from './shotgrid-client';
import { SecurityOrchestrator, ProvenanceTracker } from './security-utils';
import { MCPOrchestrator } from './_core/mcp-orchestrator';
import { ResearchAgent } from './research-agent';
import { StudioConcurrency } from './db';
import { StudioCache } from './_core/cache';

export async function orchestrateV4(
  jobId: string,
  bookId: string,
  userId: string,
  shotgrid: ShotGridClient
) {
    const isolatedPath = SecurityOrchestrator.getIsolatedPath(userId, bookId);
    console.log(`[Security] Production isolated in: ${isolatedPath}`);

    // Get book data
    const book = await db.getBookById(bookId);
    if (!book) throw new Error(`Book ${bookId} not found`);

    await db.updateJobStage(jobId, "analyzing", 5);

    // ── Stage 1: Book Analysis ─────────────────────────────────────────────
    console.log(`[Phase 1] AI Analysis & Synopsis Generation...`);
    const { chapters } = await runBookAnalyst(
      jobId as any,
      bookId as any,
      book.rawText,
      book.title,
      book.author || "Unknown",
      book.genre || "Drama",
    );

    // ── Stage 1.5: External Research (Apify) ──────────────────────────────
    const researchTopics = [book.genre || "Drama", book.title.split(' ')[0]];
    if (researchTopics.length > 0) {
      console.log(`[Phase 1.5] Triggering Apify Research Agent...`);
      await db.appendJobLog(jobId, { 
        timestamp: new Date().toISOString(), 
        agent: "Research", 
        level: "info", 
        message: "Starting external research via Apify crawlers..." 
      });
      
      const researchResult = await ResearchAgent.performResearch(bookId as any, researchTopics);
      
      if (researchResult.success) {
        await db.appendJobLog(jobId, { 
          timestamp: new Date().toISOString(), 
          agent: "Research", 
          level: "success", 
          message: `External research completed. Ingested ${researchResult.pointsCount} data points.` 
        });
      }
    }

    await db.updateJobStage(jobId, "world_bible_init", 20);

    const totalChapters = chapters.length;

    for (let i = 0; i < totalChapters; i++) {
      const chapterData = chapters[i];
      
      console.log(`[Phase 2-5] Processing Chapter ${chapterData.number}/${totalChapters}`);

      const worldBibleData = await db.getWorldBible(bookId);
      const worldBible: WorldBibleData = {
        bookId: bookId as any,
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

      // 1. Continuity Review
      const updatedBible = await runContinuitySupervisor(jobId as any, bookId as any, chapterData.number, chapterData.content, worldBible);

      // 2. Initialize AI Director
      const director = new AIDirectorAgent({
          genre: book.genre || 'drama',
          narrativeContext: book.tone || 'cinematic',
          bookContent: chapterData.content,
          visualBible: updatedBible as any,
          targetDuration: 120
      });

      // 3. Orchestrate decisions
      const directorDecisions: DirectorDecision[] = await director.orchestrateChapter(
          `ch_${chapterData.number}`,
          chapterData.content,
          updatedBible as any
      );

      // 4. Previz & CG Layout (Blender MCP) - BATCHED FOR SCALE
      console.log(`[Phase 5] Batched production for ${directorDecisions.length} shots...`);
      
      const shotJobs = directorDecisions.map((decision) => 
        StudioConcurrency(async () => {
          const shotId = await shotgrid.createShot({
            id: `shot_${decision.sceneId}`,
            code: `CH${chapterData.number}_${decision.sceneId}`,
            description: decision.shotDescription,
            status: 'wtg',
            chapterId: chapterData.number.toString()
          });

          const blenderResult = await MCPOrchestrator.callTool('blender', 'setup_cinematography', { 
              shot_id: shotId, 
              isolated_path: isolatedPath,
              trajectory: decision.cameraTrajectory,
              blocking: decision.characterBlocking,
              lighting: decision.lighting,
              rationale: decision.cinematicRationale
          });
          
          if (!blenderResult.success) {
              return { shotId, success: false };
          }

          await shotgrid.updateShotStatus(shotId, 'ip');
          return { shotId, success: true };
        })
      );

      await Promise.all(shotJobs);
    }

    await db.completeJob(jobId);
}
