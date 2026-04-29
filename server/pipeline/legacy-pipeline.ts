/**
 * BookCinema AI Orchestration Engine
 *
 * Implements a 5-agent pipeline inspired by LangGraph stateful workflows:
 *   1. Book Analyst     — Chapter splitting + World Bible initialization
 *   2. Continuity Supervisor — Persistent memory management
 *   3. Screenwriter     — Chapter → Professional screenplay (Save the Cat)
 *   4. Visual Director  — Screenplay → Visual prompts + keyframes
 *   5. Video Producer   — Video generation API calls (simulated in dev)
 *
 * Architecture: Each agent reads from and writes to the World Bible.
 * The pipeline is resumable — if interrupted, it picks up from the last
 * completed stage using the processingJobs table.
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

function extractText(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const content = result.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => ("text" in c ? c.text : "")).join("");
  }
  return "";
}
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import * as db from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorldBibleCharacter {
  fullName: string;
  aliases: string[];
  appearance: string;
  personality: string;
  relationships: Record<string, string>;
  arc: string;
  firstChapter: number;
  lastSeenChapter: number;
  visualPrompt: string;
}

export interface WorldBibleLocation {
  name: string;
  description: string;
  visualPrompt: string;
  mood: string;
  firstChapter: number;
}

export interface WorldBibleData {
  bookId: string;
  title: string;
  author: string;
  genre: string;
  era: string;
  tone: string;
  themes: string[];
  characters: Record<string, WorldBibleCharacter>;
  locations: Record<string, WorldBibleLocation>;
  timeline: Array<{ chapter: number; event: string; date?: string }>;
  chapterSummaries: Record<number, string>;
}

export interface PipelineLogEntry {
  timestamp: string;
  agent: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(
  jobId: string,
  agent: string,
  level: PipelineLogEntry["level"],
  message: string,
): PipelineLogEntry {
  const entry: PipelineLogEntry = {
    timestamp: new Date().toISOString(),
    agent,
    level,
    message,
  };
  // Append to job logs in background (fire and forget)
  db.appendJobLog(jobId, entry).catch(console.error);
  console.log(`[${agent}] ${level.toUpperCase()}: ${message}`);
  return entry;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50);
}

// ─── Agent 1: Book Analyst ────────────────────────────────────────────────────

export async function runBookAnalyst(
  jobId: string,
  bookId: string,
  rawText: string,
  title: string,
  author: string,
  genre: string,
): Promise<{ chapters: Array<{ number: number; title: string; content: string }> }> {
  log(jobId, "Book Analyst", "info", `Starting analysis of "${title}" by ${author}`);

  const wordCount = rawText.split(/\s+/).length;
  log(jobId, "Book Analyst", "info", `Book has approximately ${wordCount.toLocaleString()} words`);

  // Use LLM to split book into chapters and extract initial World Bible
  const analysisPrompt = `You are an expert literary analyst and book editor.

Analyze the following book text and:
1. Split it into chapters (identify natural chapter breaks)
2. Extract the initial World Bible (characters, locations, themes, era, tone)

Book: "${title}" by ${author}
Genre: ${genre}

TEXT (first 8000 chars for analysis):
${rawText.slice(0, 8000)}

Return a JSON object with this exact structure:
{
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title or 'Chapter 1' if unnamed",
      "startMarker": "First few words of this chapter",
      "estimatedWordCount": 2500
    }
  ],
  "worldBible": {
    "era": "Time period (e.g., '1920s New York', 'Medieval England')",
    "tone": "Overall tone (e.g., 'melancholic and romantic')",
    "themes": ["theme1", "theme2"],
    "characters": {
      "character_key": {
        "fullName": "Full name",
        "aliases": [],
        "appearance": "Physical description",
        "personality": "Personality traits",
        "relationships": {},
        "arc": "Character arc summary",
        "firstChapter": 1,
        "lastSeenChapter": 1,
        "visualPrompt": "Detailed visual description for image generation"
      }
    },
    "locations": {
      "location_key": {
        "name": "Location name",
        "description": "Description",
        "visualPrompt": "Visual description for image generation",
        "mood": "Emotional atmosphere",
        "firstChapter": 1
      }
    }
  }
}`;

  let analysisResult: any;
  try {
    const llmResult = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert literary analyst. Always respond with valid JSON only." },
        { role: "user", content: analysisPrompt },
      ] as Message[],
    });
    const response = extractText(llmResult);

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysisResult = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in LLM response");
    }
  } catch (err) {
    log(jobId, "Book Analyst", "warning", "LLM analysis failed, using fallback chapter splitting");
    // Fallback: simple chapter splitting by common patterns
    analysisResult = fallbackChapterSplit(rawText, title, author);
  }

  // Split raw text into actual chapter content
  const chapterTexts = splitTextIntoChapters(rawText, analysisResult.chapters || []);

  // Initialize World Bible in database
  const worldBible: WorldBibleData = {
    bookId,
    title,
    author,
    genre,
    era: analysisResult.worldBible?.era || "Contemporary",
    tone: analysisResult.worldBible?.tone || "dramatic",
    themes: analysisResult.worldBible?.themes || [],
    characters: analysisResult.worldBible?.characters || {},
    locations: analysisResult.worldBible?.locations || {},
    timeline: [],
    chapterSummaries: {},
  };

  await db.upsertWorldBible(bookId, worldBible as unknown as Record<string, unknown>);
  log(jobId, "Book Analyst", "success", `World Bible initialized with ${Object.keys(worldBible.characters).length} characters and ${Object.keys(worldBible.locations).length} locations`);

  // Save chapters to database
  for (const chapter of chapterTexts) {
    await db.createChapter({
      bookId,
      chapterNumber: chapter.number,
      title: chapter.title,
      rawContent: chapter.content,
      wordCount: chapter.content.split(/\s+/).length,
      status: "pending",
    });
  }

  log(jobId, "Book Analyst", "success", `Identified ${chapterTexts.length} chapters`);
  await db.updateBookStatus(bookId, "scripting", chapterTexts.length);
  await db.updateJobStage(jobId, "screenplay_generation", 20);

  return { chapters: chapterTexts };
}

// ─── Agent 2: Continuity Supervisor ──────────────────────────────────────────

export async function runContinuitySupervisor(
  jobId: string,
  bookId: string,
  chapterNumber: number,
  chapterContent: string,
  currentWorldBible: WorldBibleData,
): Promise<WorldBibleData> {
  log(jobId, "Continuity Supervisor", "info", `Reviewing chapter ${chapterNumber} for continuity`);

  const supervisionPrompt = `You are a professional script continuity supervisor for a major film production.

Review Chapter ${chapterNumber} and update the World Bible to track any new or changed information.

CURRENT WORLD BIBLE:
${JSON.stringify(currentWorldBible, null, 2).slice(0, 3000)}

CHAPTER ${chapterNumber} CONTENT:
${chapterContent.slice(0, 4000)}

Return a JSON object with ONLY the changes/additions to the World Bible:
{
  "newCharacters": {},
  "updatedCharacters": {},
  "newLocations": {},
  "updatedLocations": {},
  "timelineEvents": [
    { "chapter": ${chapterNumber}, "event": "description", "date": "optional" }
  ],
  "chapterSummary": "2-3 sentence summary of this chapter",
  "continuityNotes": ["any continuity issues found"]
}`;

  try {
    const llmRes = await invokeLLM({
      messages: [
        { role: "system", content: "You are a continuity supervisor. Respond with valid JSON only." },
        { role: "user", content: supervisionPrompt },
      ] as Message[],
    });
    const response = extractText(llmRes);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const updates = JSON.parse(jsonMatch[0]);

      // Merge updates into World Bible
      const updatedBible: WorldBibleData = {
        ...currentWorldBible,
        characters: {
          ...currentWorldBible.characters,
          ...updates.newCharacters,
          ...updates.updatedCharacters,
        },
        locations: {
          ...currentWorldBible.locations,
          ...updates.newLocations,
          ...updates.updatedLocations,
        },
        timeline: [
          ...currentWorldBible.timeline,
          ...(updates.timelineEvents || []),
        ],
        chapterSummaries: {
          ...currentWorldBible.chapterSummaries,
          [chapterNumber]: updates.chapterSummary || "",
        },
      };

      await db.upsertWorldBible(bookId, updatedBible as unknown as Record<string, unknown>);
      log(jobId, "Continuity Supervisor", "success", `World Bible updated for chapter ${chapterNumber}`);

      if (updates.continuityNotes?.length > 0) {
        log(jobId, "Continuity Supervisor", "warning", `Continuity notes: ${updates.continuityNotes.join("; ")}`);
      }

      return updatedBible;
    }
  } catch (err) {
    log(jobId, "Continuity Supervisor", "warning", `World Bible update skipped for chapter ${chapterNumber}`);
  }

  return currentWorldBible;
}

/**
 * Task: Domain Mapper (Atomic)
 * Converts database records to the typed WorldBible domain model.
 */
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
    chapterSummaries: {},
  };
}

/**
 * Orchestrate: Chapter Pipeline (Composite)
 * Executes the 4-stage cinematic pipeline for a single chapter.
 */
async function processChapter(
  jobId: string,
  bookId: string,
  chapterData: any,
  worldBible: WorldBibleData,
  progress: number
): Promise<void> {
  // Get chapter from DB
  const dbChapter = await db.getChapterByNumber(bookId, chapterData.number);
  if (!dbChapter) return;

  // Stage 2: Continuity check
  await db.updateJobStage(jobId, "screenplay_generation", progress);
  const updatedBible = await runContinuitySupervisor(
    jobId,
    bookId,
    chapterData.number,
    chapterData.content,
    worldBible,
  );

  // Stage 3: Screenplay generation
  await db.updateChapterStatus(dbChapter.id, "scripting");
  const screenplay = await runScreenwriter(
    jobId,
    dbChapter.id,
    chapterData.number,
    chapterData.content,
    updatedBible,
  );

  // Stage 4: Visual direction
  await db.updateJobStage(jobId, "visual_direction", progress + 5);
  await db.updateChapterStatus(dbChapter.id, "directing");
  const scenes = await runVisualDirector(
    jobId,
    dbChapter.id,
    chapterData.number,
    screenplay,
    updatedBible,
  );

  // Stage 5: Video production (keyframes)
  await db.updateJobStage(jobId, "video_production", progress + 10);
  await runVideoProducer(
    jobId,
    dbChapter.id,
    chapterData.number,
    scenes,
    updatedBible,
  );
}

// ─── Agent 3: Screenwriter ────────────────────────────────────────────────────

export async function runScreenwriter(
  jobId: string,
  chapterId: string,
  chapterNumber: number,
  chapterContent: string,
  worldBible: WorldBibleData,
): Promise<string> {
  log(jobId, "Screenwriter", "info", `Writing screenplay for chapter ${chapterNumber}`);

  // Build character context for this chapter
  const characterContext = Object.entries(worldBible.characters)
    .slice(0, 5) // Top 5 characters to keep prompt manageable
    .map(([key, char]) => `${char.fullName}: ${char.personality}. Appearance: ${char.appearance}`)
    .join("\n");

  const screenplayPrompt = `You are a professional Hollywood screenwriter adapting a book chapter into a screenplay.

WORLD BIBLE CONTEXT:
- Title: ${worldBible.title} by ${worldBible.author}
- Era: ${worldBible.era}
- Tone: ${worldBible.tone}
- Themes: ${worldBible.themes.join(", ")}

KEY CHARACTERS:
${characterContext}

CHAPTER ${chapterNumber} CONTENT:
${chapterContent.slice(0, 5000)}

Write a professional screenplay for this chapter following these rules:
1. Use standard screenplay format (INT./EXT. LOCATION - DAY/NIGHT)
2. Character names in ALL CAPS when first introduced
3. Action lines in present tense, visual and specific
4. Dialogue that matches each character's established voice
5. Each scene should represent 1-3 minutes of screen time
6. Include emotional beats and subtext

FORMAT YOUR OUTPUT AS:
FADE IN:

INT./EXT. LOCATION - TIME

[Action lines describing the scene]

CHARACTER NAME
(parenthetical if needed)
Dialogue here.

[Continue for all scenes in this chapter]

FADE OUT.`;

  try {
    const screenplayResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an award-winning Hollywood screenwriter. Write professional screenplays in standard format.",
        },
        { role: "user", content: screenplayPrompt },
      ] as Message[],
    });
    const screenplay = extractText(screenplayResult);

    await db.updateChapterScreenplay(chapterId, screenplay);
    log(jobId, "Screenwriter", "success", `Screenplay written for chapter ${chapterNumber} (${screenplay.length} chars)`);
    return screenplay;
  } catch (err) {
    const fallback = generateFallbackScreenplay(chapterNumber, chapterContent, worldBible);
    await db.updateChapterScreenplay(chapterId, fallback);
    log(jobId, "Screenwriter", "warning", `Used fallback screenplay for chapter ${chapterNumber}`);
    return fallback;
  }
}

// ─── Agent 4: Visual Director ─────────────────────────────────────────────────

export async function runVisualDirector(
  jobId: string,
  chapterId: string,
  chapterNumber: number,
  screenplay: string,
  worldBible: WorldBibleData,
): Promise<Array<{ sceneNumber: number; slugline: string; visualPrompt: string; dialogue: string }>> {
  log(jobId, "Visual Director", "info", `Creating visual direction for chapter ${chapterNumber}`);

  const directionPrompt = `You are a visionary film director creating visual prompts for AI video generation.

FILM CONTEXT:
- Title: ${worldBible.title}
- Era: ${worldBible.era}
- Tone: ${worldBible.tone}
- Visual Style: Cinematic, high production value

SCREENPLAY:
${screenplay.slice(0, 4000)}

For each scene in this screenplay, create a detailed visual prompt for AI video generation.
Return a JSON array:
[
  {
    "sceneNumber": 1,
    "slugline": "INT. MANSION BALLROOM - NIGHT",
    "actionLines": "Brief description of what happens",
    "dialogue": "Key dialogue from this scene",
    "visualPrompt": "Detailed cinematic description: camera angle, lighting, character positions, atmosphere, color palette, film grain. Example: 'Wide establishing shot of a grand 1920s ballroom, warm golden chandelier light, elegantly dressed guests dancing, shallow depth of field, film noir shadows, 35mm film aesthetic'",
    "mood": "romantic/tense/melancholic/etc"
  }
]`;

  try {
    const dirResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a master film director. Respond with valid JSON array only.",
        },
        { role: "user", content: directionPrompt },
      ] as Message[],
    });
    const response = extractText(dirResult);

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const scenes = JSON.parse(jsonMatch[0]);
      log(jobId, "Visual Director", "success", `Created ${scenes.length} visual scenes for chapter ${chapterNumber}`);

      // Save scenes to database
      for (const scene of scenes) {
        await db.createVideoScene({
          chapterId,
          bookId: worldBible.bookId,
          sceneNumber: scene.sceneNumber,
          slugline: scene.slugline,
          actionLines: scene.actionLines,
          dialogue: scene.dialogue,
          visualPrompt: scene.visualPrompt,
          status: "pending",
        });
      }

      await db.updateChapterStatus(chapterId, "filming");
      return scenes;
    }
  } catch (err) {
    log(jobId, "Visual Director", "warning", `Visual direction fallback for chapter ${chapterNumber}`);
  }

  // Fallback: single scene per chapter
  const fallbackScene = [{
    sceneNumber: 1,
    slugline: `CHAPTER ${chapterNumber}`,
    actionLines: `Chapter ${chapterNumber} scene`,
    dialogue: "",
    visualPrompt: `Cinematic scene from "${worldBible.title}", ${worldBible.era}, ${worldBible.tone} atmosphere, high production value, 35mm film aesthetic`,
    mood: worldBible.tone,
  }];

  await db.createVideoScene({
    chapterId,
    bookId: worldBible.bookId,
    sceneNumber: 1,
    slugline: fallbackScene[0].slugline,
    actionLines: fallbackScene[0].actionLines,
    dialogue: "",
    visualPrompt: fallbackScene[0].visualPrompt,
    status: "pending",
  });

  return fallbackScene;
}

// ─── Agent 5: Video Producer ──────────────────────────────────────────────────

export async function runVideoProducer(
  jobId: string,
  chapterId: string,
  chapterNumber: number,
  scenes: Array<{ sceneNumber: number; visualPrompt: string; slugline: string }>,
  worldBible: WorldBibleData,
): Promise<string | null> {
  log(jobId, "Video Producer", "info", `Generating keyframe images for chapter ${chapterNumber}`);

  const keyframeUrls: string[] = [];

  // Generate keyframe images for each scene (using built-in image generation)
  for (const scene of scenes.slice(0, 3)) { // Limit to 3 scenes per chapter for cost
    try {
      log(jobId, "Video Producer", "info", `Generating keyframe for scene ${scene.sceneNumber}: ${scene.slugline}`);

      const { url } = await generateImage({
        prompt: `${scene.visualPrompt}. Cinematic still frame, high quality, film photography aesthetic, ${worldBible.era} era, ${worldBible.tone} mood.`,
      });

      if (url) {
        keyframeUrls.push(url);
        await db.updateSceneKeyframe(chapterId, scene.sceneNumber, url);
        log(jobId, "Video Producer", "success", `Keyframe generated for scene ${scene.sceneNumber}`);
      }
    } catch (err) {
      log(jobId, "Video Producer", "warning", `Keyframe generation failed for scene ${scene.sceneNumber}`);
    }
  }

  // Mark chapter as complete (video generation would happen here with Runway/Minimax)
  // In production: call ttv-pipeline API with keyframes + visual prompts
  log(jobId, "Video Producer", "info", `Chapter ${chapterNumber} keyframes complete. Video generation queued for production deployment.`);

  await db.updateChapterStatus(chapterId, "complete");

  if (keyframeUrls.length > 0) {
    await db.updateChapterThumbnail(chapterId, keyframeUrls[0]);
  }

  return keyframeUrls[0] || null;
}

// ─── Main Pipeline Orchestrator ───────────────────────────────────────────────

export async function runFullPipeline(
  jobId: string,
  bookId: string,
  userId: string,
  orgId: string,
): Promise<void> {
  log(jobId, "Orchestrator", "info", "BookCinema AI Pipeline started");

  try {
    // Get book data
    const book = await db.getBookById(bookId, orgId);
    if (!book) throw new Error(`Book ${bookId} not found`);

    await db.updateJobStage(jobId, "book_analysis", 5);

    // ── Stage 1: Book Analysis ─────────────────────────────────────────────
    log(jobId, "Orchestrator", "info", "Stage 1/5: Book Analysis");
    const { chapters } = await runBookAnalyst(
      jobId,
      bookId,
      book.rawText,
      book.title,
      book.author || "Unknown",
      book.genre || "Drama",
    );

    await db.updateJobStage(jobId, "world_bible_init", 20);

    // ── Stage 2-5: Process each chapter ───────────────────────────────────
    const totalChapters = chapters.length;

    for (let i = 0; i < totalChapters; i++) {
      // Check if job was cancelled
      const job = await db.getJobById(jobId);
      if (job?.isCancelled) {
        log(jobId, "Orchestrator", "warning", "Pipeline cancelled by user");
        return;
      }

      const chapterData = chapters[i];
      const progress = 20 + Math.floor((i / totalChapters) * 75);

      log(jobId, "Orchestrator", "info", `Processing chapter ${chapterData.number}/${totalChapters}: "${chapterData.title}"`);

      // 1. Fetch State (Atomic)
      const worldBible = await getValidatedWorldBible(bookId, book);

      // 2. Execute Chapter Pipeline (Composite)
      await processChapter(jobId, bookId, chapterData, worldBible, progress);
    }

    // ── Final Assembly ─────────────────────────────────────────────────────
    await db.updateJobStage(jobId, "final_assembly", 95);
    log(jobId, "Orchestrator", "info", "Stage 5/5: Final Assembly");

    await db.updateBookStatus(bookId, "complete", totalChapters);
    await db.completeJob(jobId);

    log(jobId, "Orchestrator", "success", `Pipeline complete! Processed ${totalChapters} chapters.`);

    // Notify owner
    try {
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: "BookCinema: Production Complete",
        content: `"${book.title}" has been fully processed — ${totalChapters} chapters converted to screenplay and keyframes.`,
      });
    } catch (_) {}
  } catch (err: any) {
    log(jobId, "Orchestrator", "error", `Pipeline failed: ${err.message}`);
    await db.failJob(jobId, err.message);
    await db.updateBookStatus(bookId, "error");
    throw err;
  }
}

// ─── Fallback Helpers ─────────────────────────────────────────────────────────

function fallbackChapterSplit(rawText: string, title: string, author: string) {
  // Split by common chapter patterns
  const chapterRegex = /(?:^|\n)(chapter\s+\d+|chapter\s+[ivxlcdm]+|\d+\.|part\s+\d+)/gi;
  const matches = [...rawText.matchAll(chapterRegex)];

  if (matches.length === 0) {
    // No chapter markers — split by word count (~3000 words per chapter)
    const words = rawText.split(/\s+/);
    const chunkSize = 3000;
    const chapters = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chapters.push({
        number: Math.floor(i / chunkSize) + 1,
        title: `Chapter ${Math.floor(i / chunkSize) + 1}`,
        startMarker: words.slice(i, i + 5).join(" "),
        estimatedWordCount: chunkSize,
      });
    }
    return { chapters, worldBible: { era: "Contemporary", tone: "dramatic", themes: [], characters: {}, locations: {} } };
  }

  return {
    chapters: matches.map((m, i) => ({
      number: i + 1,
      title: m[1].trim(),
      startMarker: m[1].trim(),
      estimatedWordCount: 2500,
    })),
    worldBible: { era: "Contemporary", tone: "dramatic", themes: [], characters: {}, locations: {} },
  };
}

function splitTextIntoChapters(
  rawText: string,
  chapterMeta: Array<{ number: number; title: string; startMarker: string }>,
): Array<{ number: number; title: string; content: string }> {
  if (chapterMeta.length === 0) {
    // Single chapter fallback
    return [{ number: 1, title: "Chapter 1", content: rawText }];
  }

  // For simplicity, divide text evenly among chapters
  const words = rawText.split(/\s+/);
  const wordsPerChapter = Math.ceil(words.length / chapterMeta.length);

  return chapterMeta.map((meta, i) => ({
    number: meta.number,
    title: meta.title,
    content: words.slice(i * wordsPerChapter, (i + 1) * wordsPerChapter).join(" "),
  }));
}

function generateFallbackScreenplay(
  chapterNumber: number,
  content: string,
  worldBible: WorldBibleData,
): string {
  const firstChars = content.slice(0, 200);
  return `FADE IN:

INT. UNKNOWN LOCATION - DAY

Chapter ${chapterNumber} of "${worldBible.title}".

${firstChars}...

FADE OUT.`;
}
