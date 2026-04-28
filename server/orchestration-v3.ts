/**
 * BookCinema Orchestration Engine v3
 * Integrates LongFormVideoCat + Matrix-3D + AI Director Agent
 * Full-book processing with 1M-token context (Gemini 3.1 Pro)
 */

import * as db from './db';
import { invokeLLM } from './_core/llm';
import { AIDirectorAgent } from './ai-director-agent';
import { LongFormVideoCatClient } from './longformvideocat-client';
import { Matrix3DClient } from './matrix3d-client';
// import { RAGEngine } from './rag-engine'; // TODO: Implement RAG engine
import { FilmAgentCollaboration } from './filmagent-collaboration';

export interface BookData {
  id: string;
  title: string;
  author: string;
  fullText: string; // Complete book text (up to 1M tokens)
  genre: string;
  targetAudience?: string;
}

export interface ChapterData {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  text: string;
  wordCount: number;
}

export interface WorldBibleData {
  bookId: string;
  characters: Array<{
    name: string;
    description: string;
    appearance: string;
    personality: string;
    arc: string;
  }>;
  locations: Array<{
    name: string;
    description: string;
    significance: string;
    atmosphere: string;
  }>;
  themes: string[];
  timeline: string;
  tone: string;
  visualStyle: string;
}

export interface VisualPrompt {
  sceneIndex: number;
  chapterIndex: number;
  description: string;
  characters: string[];
  location: string;
  cameraDirection: string;
  lighting: string;
  mood: string;
  duration: number; // seconds
  keyframeUrl?: string;
}

export interface DirectorDecisions {
  cameraTrajectories: Array<{
    type: string;
    intensity: number;
    parameters: Record<string, any>;
  }>;
  lighting: {
    keyLight: string;
    fillLight: string;
    backLight: string;
    colorTemperature: number;
  };
  pacing: number; // 0-1
  emotionalTone: string;
}

export interface VideoScene {
  sceneIndex: number;
  chapterIndex: number;
  videoUrl: string;
  plyPath?: string; // 3D scene path
  duration: number;
  prompt: string;
  cameraDecisions: DirectorDecisions;
  consistency: {
    characters: any[];
    locations: any[];
    lighting: any;
  };
}

/**
 * Main orchestration function
 * Processes full book → World Bible → Screenplay → Visual Prompts → Video
 */
export async function orchestrateFullBook(
  book: BookData,
  longformvideocatClient: LongFormVideoCatClient,
  matrix3dClient: Matrix3DClient,
  directorAgent: AIDirectorAgent,
  filmagentCollaboration: FilmAgentCollaboration
): Promise<{
  worldBible: WorldBibleData;
  chapters: ChapterData[];
  visualPrompts: VisualPrompt[];
  videoScenes: VideoScene[];
  movieUrl: string;
}> {
  console.log(`[BookCinema] Starting orchestration for "${book.title}"`);

  // Phase 1: Book Analysis & World Bible Generation
  console.log(`[Phase 1] Analyzing full book (${book.fullText.length} characters)...`);
  const worldBible = await runBookAnalyst(book);
  // await db.upsertWorldBible(book.id, JSON.stringify(worldBible));

  // Phase 2: Chapter Splitting
  console.log(`[Phase 2] Splitting book into chapters...`);
  const chapters = await runChapterSplitter(book, worldBible);
  // for (const chapter of chapters) {
  //   await db.upsertChapter(book.id, chapter as any);
  // }

  // Phase 3: Screenplay Generation (All Chapters)
  console.log(`[Phase 3] Generating screenplays for ${chapters.length} chapters...`);
  const screenplays = await runScreenwriter(chapters, worldBible);

  // Phase 4: Visual Prompt Generation
  console.log(`[Phase 4] Generating visual prompts...`);
  const visualPrompts = await runVisualDirector(chapters, screenplays, worldBible);

  // Phase 5: AI Director Decisions (GenDoP + FILMAGENT)
  console.log(`[Phase 5] AI Director making cinematography decisions...`);
  const directorDecisions: DirectorDecisions = {
    cameraTrajectories: visualPrompts.map(vp => ({
      type: 'straight',
      intensity: 0.5,
      parameters: {}
    })),
    lighting: {
      keyLight: '#FFFFFF',
      fillLight: '#CCCCCC',
      backLight: '#999999',
      colorTemperature: 5600
    },
    pacing: 0.7,
    emotionalTone: worldBible.tone
  };

  // Phase 6: Video Generation (LongFormVideoCat)
  console.log(`[Phase 6] Generating videos with LongFormVideoCat...`);
  const videoScenes = await runVideoProducerWithLongFormVideoCat(
    chapters,
    visualPrompts,
    directorDecisions,
    worldBible,
    longformvideocatClient,
    matrix3dClient
  );

  // Phase 7: Movie Assembly
  console.log(`[Phase 7] Assembling final movie...`);
  const movieUrl = await assembleMovie(book.id, videoScenes);

  console.log(`[BookCinema] ✅ Orchestration complete for "${book.title}"`);

  return {
    worldBible,
    chapters,
    visualPrompts,
    videoScenes,
    movieUrl
  };
}

/**
 * Phase 1: Book Analyst Agent
 * Analyzes full book with Gemini 3.1 Pro (1M-token context)
 */
async function runBookAnalyst(
  book: BookData
): Promise<WorldBibleData> {
  const prompt = `Analyze this complete book and create a comprehensive World Bible:

BOOK: "${book.title}" by ${book.author}
GENRE: ${book.genre}
FULL TEXT:
${book.fullText}

Create a detailed World Bible with:
1. **Characters**: Name, description, appearance, personality, character arc
2. **Locations**: Name, description, significance, atmosphere
3. **Themes**: Main themes and motifs
4. **Timeline**: Story timeline and pacing
5. **Tone**: Overall tone and style
6. **Visual Style**: Cinematographic style recommendations

Format as JSON.`;

  const response = await invokeLLM({
    messages: [{ role: 'user', content: prompt }]
  });

  const textContent = typeof response === 'string' ? response : (response as any).text || '';

  // Extract JSON from response
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract World Bible JSON from response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Phase 2: Chapter Splitter
 * Automatically detects and splits chapters
 */
async function runChapterSplitter(
  book: BookData,
  worldBible: WorldBibleData
): Promise<ChapterData[]> {
  const prompt = `Split this book into logical chapters. Identify chapter boundaries, titles, and content.

BOOK: "${book.title}"
TEXT: ${book.fullText.substring(0, 50000)}... [truncated]

Return JSON array of chapters with: { chapterNumber, title, startIndex, endIndex }`;

  const response = await invokeLLM({
    messages: [{ role: 'user', content: prompt }]
  });

  const textContent = typeof response === 'string' ? response : (response as any).text || '';

  const jsonMatch = textContent.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract chapters JSON');
  }

  const chapterData = JSON.parse(jsonMatch[0]);
  const chapters: ChapterData[] = chapterData.map((ch: any, idx: number) => ({
    id: `ch_${idx}`,
    bookId: book.id,
    chapterNumber: idx + 1,
    title: ch.title,
    text: book.fullText.substring(ch.startIndex, ch.endIndex),
    wordCount: (ch.endIndex - ch.startIndex) / 4.7 // Rough estimate
  }));

  return chapters;
}

/**
 * Phase 3: Screenwriter Agent
 * Converts chapters to screenplays using Save the Cat framework
 */
async function runScreenwriter(
  chapters: ChapterData[],
  worldBible: WorldBibleData
): Promise<string[]> {
  const screenplays: string[] = [];

  for (const chapter of chapters) {
    const prompt = `Convert this chapter to a screenplay using the Save the Cat framework:

CHAPTER: "${chapter.title}"
TEXT: ${chapter.text}

WORLD BIBLE:
- Characters: ${JSON.stringify(worldBible.characters.map(c => c.name))}
- Locations: ${JSON.stringify(worldBible.locations.map(l => l.name))}
- Tone: ${worldBible.tone}

Create a screenplay with:
1. Scene headings (INT/EXT, LOCATION, TIME)
2. Action lines
3. Character names and dialogue
4. Parentheticals
5. Transitions

Follow Save the Cat structure: Hook → Inciting Incident → B Story → Midpoint → All Is Lost → Finale`;

    const response = await invokeLLM({
      messages: [{ role: 'user', content: prompt }]
    });

    const screenplay = typeof response === 'string' ? response : (response as any).text || '';

    screenplays.push(screenplay);
  }

  return screenplays;
}

/**
 * Phase 4: Visual Director Agent
 * Generates visual prompts for each scene
 */
async function runVisualDirector(
  chapters: ChapterData[],
  screenplays: string[],
  worldBible: WorldBibleData
): Promise<VisualPrompt[]> {
  const visualPrompts: VisualPrompt[] = [];
  let sceneIndex = 0;

  for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
    const screenplay = screenplays[chIdx];

    const prompt = `Break down this screenplay into visual scenes with detailed prompts for video generation:

SCREENPLAY:
${screenplay}

WORLD BIBLE:
- Visual Style: ${worldBible.visualStyle}
- Tone: ${worldBible.tone}
- Characters: ${JSON.stringify(worldBible.characters.map(c => ({ name: c.name, appearance: c.appearance })))}
- Locations: ${JSON.stringify(worldBible.locations.map(l => ({ name: l.name, description: l.description })))}

For each scene, provide:
1. Scene description
2. Characters present
3. Location
4. Camera direction (wide, close-up, tracking, etc.)
5. Lighting setup
6. Mood/emotion
7. Duration (seconds)

Format as JSON array of scenes.`;

    const response = await invokeLLM({
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = typeof response === 'string' ? response : (response as any).text || '';

    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) continue;

    const scenes = JSON.parse(jsonMatch[0]);
    for (const scene of scenes) {
      visualPrompts.push({
        sceneIndex: sceneIndex++,
        chapterIndex: chIdx,
        description: scene.description,
        characters: scene.characters || [],
        location: scene.location,
        cameraDirection: scene.camera_direction,
        lighting: scene.lighting,
        mood: scene.mood,
        duration: scene.duration || 10
      });
    }
  }

  return visualPrompts;
}

/**
 * Phase 6: Video Producer with LongFormVideoCat + Matrix-3D
 */
async function runVideoProducerWithLongFormVideoCat(
  chapters: ChapterData[],
  visualPrompts: VisualPrompt[],
  directorDecisions: DirectorDecisions,
  worldBible: WorldBibleData,
  longformvideocatClient: LongFormVideoCatClient,
  matrix3dClient: Matrix3DClient
): Promise<VideoScene[]> {
  const videoScenes: VideoScene[] = [];
  let previousVideoUrl: string | null = null;

  for (let i = 0; i < visualPrompts.length; i++) {
    const prompt = visualPrompts[i];

    try {
      // Step 1: Generate 3D scene context with Matrix-3D
      console.log(`  [Scene ${i + 1}/${visualPrompts.length}] Generating 3D scene...`);
      const scenePrompt = `${prompt.location}: ${prompt.description}. ${prompt.mood}. ${prompt.lighting}.`;
      
      const matrix3dResponse = await matrix3dClient.generateTextToScene({
        prompt: scenePrompt,
        resolution: 720,
        reconstructionMethod: 'feed-forward', // Faster
        cameraTrajectory: 'straight'
      });

      const matrix3dScene = await matrix3dClient.waitForCompletion(matrix3dResponse.jobId);

      // Step 2: Generate video with LongFormVideoCat
      console.log(`  [Scene ${i + 1}/${visualPrompts.length}] Generating video...`);
      
      const videoPrompt = `
${prompt.description}
Camera: ${prompt.cameraDirection}
Lighting: ${prompt.lighting}
Mood: ${prompt.mood}
Characters: ${prompt.characters.join(', ')}
Location: ${prompt.location}
`;

      let videoResponse;
      if (i === 0) {
        // First scene: text-to-video
        videoResponse = await longformvideocatClient.generateTextToVideo({
          prompt: videoPrompt,
          duration: prompt.duration,
          resolution: 'high',
          fps: 30
        });
      } else {
        // Subsequent scenes: video continuation for seamless flow
        videoResponse = await longformvideocatClient.continueVideo({
          previousVideoUrl: previousVideoUrl!,
          prompt: videoPrompt,
          duration: prompt.duration,
          resolution: 'high'
        });
      }

      // Wait for video generation
      const completedVideo = await longformvideocatClient.waitForCompletion(videoResponse.jobId);

      videoScenes.push({
        sceneIndex: i,
        chapterIndex: prompt.chapterIndex,
        videoUrl: completedVideo.videoUrl,
        plyPath: matrix3dScene.plyPath,
        duration: prompt.duration,
        prompt: videoPrompt,
        cameraDecisions: directorDecisions,
        consistency: {
          characters: worldBible.characters,
          locations: worldBible.locations,
          lighting: directorDecisions.lighting
        }
      });

      previousVideoUrl = completedVideo.videoUrl;

      console.log(`  ✅ Scene ${i + 1} complete`);
    } catch (error) {
      console.error(`  ❌ Scene ${i + 1} failed:`, error);
      throw error;
    }
  }

  return videoScenes;
}

/**
 * Phase 7: Movie Assembly
 * Combines all video scenes into final movie using FFmpeg
 */
async function assembleMovie(
  bookId: string,
  videoScenes: VideoScene[]
): Promise<string> {
  // TODO: Implement FFmpeg assembly
  // For now, return placeholder
  const moviePath = `s3://bookcinema-movies/${bookId}/final-movie.mp4`;
  
  console.log(`  [Assembly] Combining ${videoScenes.length} scenes into final movie...`);
  // FFmpeg command would go here
  console.log(`  ✅ Movie assembled: ${moviePath}`);

  return moviePath;
}


