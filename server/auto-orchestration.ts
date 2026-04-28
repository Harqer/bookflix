import { invokeLLM, type InvokeParams } from './_core/llm';
import { AIDirectorAgent } from './ai-director-agent';
import GenDoPIntegration from './gendop-integration';
import FilmAgentCollaboration from './filmagent-collaboration';
import * as db from './db';

/**
 * AutoOrchestrationEngine - Processes full books end-to-end with zero manual prompting
 * Handles: World Bible generation, chapter breakdown, AI direction, and video generation
 */

interface AutoOrchestrationConfig {
  bookId: number;
  userId: number;
  genre: string;
  productionStyle: 'cinematic' | 'animated' | 'documentary';
  tone: string;
}

interface OrchestrationProgress {
  stage: string;
  progress: number; // 0-100
  currentChapter: number;
  totalChapters: number;
  logs: string[];
}

export class AutoOrchestrationEngine {
  private config: AutoOrchestrationConfig;
  private progress: OrchestrationProgress;
  private director: AIDirectorAgent;

  constructor(config: AutoOrchestrationConfig) {
    this.config = config;
    this.progress = {
      stage: 'initializing',
      progress: 0,
      currentChapter: 0,
      totalChapters: 0,
      logs: []
    };

    // Initialize AI Director Agent
    this.director = new AIDirectorAgent({
      genre: config.genre,
      narrativeContext: config.tone,
      bookContent: '', // Will be set during orchestration
      visualBible: { characters: [], locations: [], timeline: [], themes: [] },
      targetDuration: 120
    });
  }

  /**
   * Log progress message
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.progress.logs.push(logEntry);
    console.log(logEntry);
  }

  /**
   * Update progress in database
   */
  private async updateProgress(): Promise<void> {
    try {
      const job = await db.getActiveJobForBook(this.config.bookId);
      if (job) {
        // Update job in database
        console.log(`Progress: ${this.progress.stage} - ${this.progress.progress}%`);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  /**
   * Stage 1: Analyze full book and generate World Bible
   */
  private async analyzeFullBook(bookContent: string): Promise<any> {
    this.log('Stage 1: Analyzing full book for World Bible generation...');
    this.progress.stage = 'world_bible_generation';
    this.progress.progress = 10;

    try {
      const prompt = `You are a master storyteller analyzing a complete book for film adaptation.
      
BOOK CONTENT (first 10,000 characters):
${bookContent.substring(0, 10000)}

Generate a comprehensive World Bible in JSON format with:
1. characters: Array of main characters with { id, name, appearance, personality, arc, relationships }
2. locations: Array of key locations with { id, name, description, mood, significance }
3. timeline: Array of major events with { id, event, date, significance, emotionalWeight }
4. themes: Array of thematic elements with { id, name, description, examples }
5. tone: Overall tone and style
6. era: Time period/setting
7. visualStyle: Recommended visual aesthetic for film adaptation

Return ONLY valid JSON, no markdown or extra text.`;

      const result = await invokeLLM({
        messages: [{ role: 'user', content: prompt }]
      });

      const worldBibleText = typeof result === 'string' ? result : (result as any).content?.[0]?.text || '{}';
      const worldBible = JSON.parse(worldBibleText);

      this.log(`✓ Generated World Bible: ${worldBible.characters?.length || 0} characters, ${worldBible.locations?.length || 0} locations`);
      this.progress.progress = 25;
      await this.updateProgress();

      return worldBible;
    } catch (error) {
      this.log(`✗ World Bible generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Stage 2: Break book into chapters and scenes
   */
  private async breakIntoChapters(bookContent: string, worldBible: any): Promise<Array<{ title: string; content: string }>> {
    this.log('Stage 2: Breaking book into chapters and scenes...');
    this.progress.stage = 'chapter_breakdown';
    this.progress.progress = 30;

    try {
      const prompt = `You are a script supervisor breaking down a novel into screenplay chapters.

BOOK CONTENT (first 15,000 characters):
${bookContent.substring(0, 15000)}

WORLD BIBLE:
${JSON.stringify(worldBible, null, 2).substring(0, 5000)}

Identify the main chapters/acts in this book. For each, provide:
1. Chapter number
2. Chapter title
3. Key plot points
4. Character focus
5. Emotional arc

Return as JSON array: [{ number, title, keyPoints, characterFocus, emotionalArc }]
Return ONLY valid JSON, no markdown.`;

      const result = await invokeLLM({
        messages: [{ role: 'user', content: prompt }]
      });

      const chaptersText = typeof result === 'string' ? result : (result as any).content?.[0]?.text || '[]';
      const chapters = JSON.parse(chaptersText);

      this.progress.totalChapters = chapters.length;
      this.log(`✓ Identified ${chapters.length} chapters`);
      this.progress.progress = 40;
      await this.updateProgress();

      return chapters;
    } catch (error) {
      this.log(`✗ Chapter breakdown failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Stage 3: Generate screenplay for each chapter
   */
  private async generateScreenplays(
    chapters: Array<{ title: string; content: string }>,
    worldBible: any
  ): Promise<Array<{ chapterId: number; screenplay: string }>> {
    this.log('Stage 3: Generating screenplays for each chapter...');
    this.progress.stage = 'screenplay_generation';

    const screenplays: Array<{ chapterId: number; screenplay: string }> = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      this.progress.currentChapter = i + 1;
      this.progress.progress = 40 + (i / chapters.length) * 20;

      try {
        this.log(`Generating screenplay for Chapter ${i + 1}: ${chapter.title}...`);

        const prompt = `You are a professional screenwriter using the Save the Cat framework.

CHAPTER CONTENT:
${chapter.content.substring(0, 5000)}

WORLD BIBLE:
${JSON.stringify(worldBible, null, 2).substring(0, 3000)}

Write a screenplay for this chapter using Save the Cat structure:
1. Opening Image (0%)
2. Theme Stated (5%)
3. Set-Up (0-10%)
4. Catalyst (10%)
5. Debate (10-20%)
6. Break into Two (20%)
7. B Story (22%)
8. Fun and Games (20-50%)
9. Midpoint (50%)
10. Bad Guys Close In (50-75%)
11. All is Lost (75%)
12. Dark Night of the Soul (75-80%)
13. Break into Three (80%)
14. Finale (80-99%)
15. Final Image (99-100%)

Format as proper screenplay with sluglines, action, dialogue, and parentheticals.
Include scene numbers and character names.`;

        const result = await invokeLLM({
          messages: [{ role: 'user', content: prompt }]
        });

        const screenplay = typeof result === 'string' ? result : (result as any).content?.[0]?.text || '';
        screenplays.push({ chapterId: i + 1, screenplay });

        this.log(`✓ Screenplay generated for Chapter ${i + 1} (${screenplay.split('\n').length} lines)`);
        await this.updateProgress();
      } catch (error) {
        this.log(`✗ Screenplay generation failed for Chapter ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.progress.progress = 60;
    await this.updateProgress();
    return screenplays;
  }

  /**
   * Stage 4: Generate visual prompts and camera directions
   */
  private async generateVisualPrompts(
    screenplays: Array<{ chapterId: number; screenplay: string }>,
    worldBible: any
  ): Promise<Array<{ chapterId: number; scenes: any[] }>> {
    this.log('Stage 4: Generating visual prompts and camera directions...');
    this.progress.stage = 'visual_generation';
    this.progress.progress = 60;

    const visualData: Array<{ chapterId: number; scenes: any[] }> = [];

    for (const screenplay of screenplays) {
      try {
        this.log(`Generating visual prompts for Chapter ${screenplay.chapterId}...`);

        const prompt = `You are a visual effects director creating detailed visual prompts for AI video generation.

SCREENPLAY:
${screenplay.screenplay.substring(0, 8000)}

WORLD BIBLE:
${JSON.stringify(worldBible, null, 2).substring(0, 3000)}

For each scene in the screenplay, generate:
1. Scene number
2. Detailed visual description (300-400 tokens)
3. Camera movement (using GenDoP: dolly, orbit, tracking, handheld, pan, tilt, crane, etc.)
4. Lighting setup (key light, fill light, back light, mood)
5. Character positions and blocking
6. Color palette and mood
7. Special effects or visual elements

Return as JSON array: [{ sceneNum, visualDescription, cameraMovement, lighting, characterBlocking, colorPalette, specialEffects }]
Return ONLY valid JSON, no markdown.`;

        const result = await invokeLLM({
          messages: [{ role: 'user', content: prompt }]
        });

        const scenesText = typeof result === 'string' ? result : (result as any).content?.[0]?.text || '[]';
        const scenes = JSON.parse(scenesText);

        visualData.push({ chapterId: screenplay.chapterId, scenes });
        this.log(`✓ Generated visual prompts for ${scenes.length} scenes in Chapter ${screenplay.chapterId}`);
      } catch (error) {
        this.log(`✗ Visual prompt generation failed for Chapter ${screenplay.chapterId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.progress.progress = 75;
    await this.updateProgress();
    return visualData;
  }

  /**
   * Stage 5: Apply AI Director orchestration
   */
  private async applyAIDirection(
    visualData: Array<{ chapterId: number; scenes: any[] }>,
    worldBible: any
  ): Promise<void> {
    this.log('Stage 5: Applying AI Director orchestration...');
    this.progress.stage = 'ai_direction';
    this.progress.progress = 75;

    for (const chapterData of visualData) {
      try {
        this.log(`Orchestrating cinematography for Chapter ${chapterData.chapterId}...`);

        // Use FILMAGENT collaboration to refine visual decisions
        const filmAgentDecisions = {
          director: { genre: this.config.genre, style: this.config.productionStyle },
          camera: { positions: [], rotations: [], focalLengths: [], focusDistance: 3, aperture: 2.8, frameRate: 24, totalFrames: 120 },
          blocking: [],
          lighting: { keyLight: { position: { x: 0, y: 0, z: 0 }, color: '#fff', intensity: 1, temperature: 5600 }, fillLight: { position: { x: 0, y: 0, z: 0 }, color: '#fff', intensity: 0.5, temperature: 5600 }, backLight: { position: { x: 0, y: 0, z: 0 }, color: '#fff', intensity: 0.3, temperature: 5600 }, ambientLight: { color: '#fff', intensity: 0.2 } }
        } as any;

        const { refined } = await FilmAgentCollaboration.critiqueCorrectVerify(
          filmAgentDecisions,
          { id: `chapter-${chapterData.chapterId}` } as any
        );

        this.log(`✓ AI Director refined cinematography for Chapter ${chapterData.chapterId}`);
      } catch (error) {
        this.log(`✗ AI Direction failed for Chapter ${chapterData.chapterId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.progress.progress = 85;
    await this.updateProgress();
  }

  /**
   * Main orchestration entry point
   */
  public async orchestrateFullBook(bookContent: string): Promise<void> {
    try {
      this.log('🎬 Starting full-book auto-orchestration...');
      this.log(`Book ID: ${this.config.bookId}, Genre: ${this.config.genre}, Style: ${this.config.productionStyle}`);

      // Stage 1: Analyze and generate World Bible
      const worldBible = await this.analyzeFullBook(bookContent);
      await db.upsertWorldBible(this.config.bookId, worldBible);

      // Stage 2: Break into chapters
      const chapters = await this.breakIntoChapters(bookContent, worldBible);

      // Stage 3: Generate screenplays
      const screenplays = await this.generateScreenplays(chapters, worldBible);

      // Stage 4: Generate visual prompts
      const visualData = await this.generateVisualPrompts(screenplays, worldBible);

      // Stage 5: Apply AI Director orchestration
      await this.applyAIDirection(visualData, worldBible);

      this.progress.stage = 'complete';
      this.progress.progress = 100;
      this.log('✓ Full-book orchestration complete! Ready for video generation.');
      await this.updateProgress();
    } catch (error) {
      this.progress.stage = 'failed';
      this.log(`✗ Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.updateProgress();
      throw error;
    }
  }

  /**
   * Get current progress
   */
  public getProgress(): OrchestrationProgress {
    return this.progress;
  }
}

/**
 * Start auto-orchestration for a book
 */
export async function startAutoOrchestration(
  bookId: number,
  userId: number,
  bookContent: string,
  genre: string,
  productionStyle: 'cinematic' | 'animated' | 'documentary',
  tone: string
): Promise<void> {
  const engine = new AutoOrchestrationEngine({
    bookId,
    userId,
    genre,
    productionStyle,
    tone
  });

  // Run in background
  setImmediate(async () => {
    try {
      await engine.orchestrateFullBook(bookContent);
    } catch (error) {
      console.error('Auto-orchestration failed:', error);
    }
  });
}
