# BookCinema: AI Director Agent for Autonomous Cinematography

## Overview

This document details the implementation of an **AI Director Agent** that autonomously orchestrates cinematography, camera control, scene composition, and visual storytelling for BookCinema. The agent operates without user intervention, making intelligent creative decisions based on narrative context, genre, and established cinematographic principles.

The AI Director Agent combines three production-grade frameworks:
1. **FILMAGENT** — Multi-agent collaboration (Director, Screenwriter, Actor, Cinematographer)
2. **GenDoP** — Auto-regressive camera trajectory generation inspired by Directors of Photography
3. **Mind-of-Director** — Multi-modal agent-driven film previsualization with collaborative decision-making

---

## Part 1: FILMAGENT Framework Architecture

### Overview

FILMAGENT is an LLM-based multi-agent collaborative framework that simulates a complete film production team. It automates the entire filmmaking pipeline through iterative feedback and revision cycles.

### Agent Roles

| Agent | Responsibility | Expertise | Output |
|-------|-----------------|-----------|--------|
| **Director** | Creative vision & narrative flow | Story structure, pacing, emotional beats | Scene breakdown, shot list, directorial notes |
| **Screenwriter** | Dialogue & character actions | Dialogue writing, scene description | Detailed screenplay with action lines |
| **Cinematographer** | Camera setup & visual composition | Framing, lens choice, camera movement | Camera specifications, movement descriptions |
| **Actor** | Character blocking & performance | Movement, positioning, interaction | Actor positions, motion paths, performance notes |

### Workflow Pipeline

```
1. Idea Development
   ├─ Director: Transforms brainstormed ideas into structured story outlines
   ├─ Feedback loop: Agents critique and refine outline
   └─ Output: Structured story with acts, scenes, beats

2. Scriptwriting
   ├─ Screenwriter: Elaborates dialogue and character actions
   ├─ Director: Reviews for narrative coherence
   ├─ Actor: Validates character consistency
   └─ Output: Detailed screenplay with action lines

3. Cinematography Planning
   ├─ Cinematographer: Determines camera setups for each shot
   ├─ Director: Validates alignment with creative vision
   ├─ Screenwriter: Ensures visual storytelling supports narrative
   └─ Output: Camera specifications, movement descriptions, lighting notes

4. Scene Composition
   ├─ Actor: Determines character blocking and positioning
   ├─ Cinematographer: Adjusts camera to accommodate blocking
   ├─ Director: Validates overall composition
   └─ Output: Actor positions, camera paths, final shot list
```

### Collaboration Strategies

**Critique-Correct-Verify (CCV):**
- Agent 1 proposes solution
- Agent 2 critiques and suggests improvements
- Agent 1 corrects based on feedback
- Agent 3 verifies final output

**Debate-Judge (DJ):**
- Agent 1 proposes approach A
- Agent 2 proposes approach B
- Judge agent evaluates both
- Winner approach is refined

---

## Part 2: GenDoP — Director of Photography Camera Control

### Overview

GenDoP is an auto-regressive Transformer model trained on 29K real-world film shots with free-moving camera trajectories. It generates artistic, expressive camera movements based on text guidance and scene context.

### Key Capabilities

1. **Artistic Camera Trajectories** — Generates cinematically compelling camera paths
2. **Context-Aware Movement** — Adapts camera motion to scene content and narrative
3. **Fine-Grained Control** — Supports detailed trajectory adjustments
4. **Motion Stability** — Ensures smooth, physically plausible camera paths

### Camera Trajectory Generation

```typescript
interface CameraTrajectory {
  // Position over time (3D coordinates)
  positions: Vector3[];
  
  // Rotation over time (Euler angles or quaternions)
  rotations: Quaternion[];
  
  // Focal length over time (zoom)
  focalLengths: number[];
  
  // Depth of field parameters
  focusDistance: number;
  aperture: number;
  
  // Timeline
  frameRate: number;
  totalFrames: number;
}

interface GenDoPInput {
  // Scene description
  sceneDescription: string;
  
  // Narrative context
  narrativeContext: string;
  
  // Genre
  genre: 'drama' | 'action' | 'horror' | 'comedy' | 'romance' | 'thriller' | 'sci-fi';
  
  // Scene RGBD (optional)
  rgbdImage: Buffer;
  depthMap: Buffer;
  
  // Directorial intent
  directorialIntent: string;
  
  // Camera constraints
  constraints: {
    maxSpeed: number;
    minDistance: number;
    maxDistance: number;
    allowedMovements: string[]; // 'pan', 'tilt', 'dolly', 'orbit', etc.
  };
}

async function generateCameraTrajectory(input: GenDoPInput): Promise<CameraTrajectory> {
  // Use GenDoP to generate trajectory
  const trajectory = await genDoPModel.generate(input);
  return trajectory;
}
```

### Genre-Specific Camera Profiles

Each genre has distinct cinematographic conventions:

| Genre | Camera Style | Movement | Framing | Depth of Field |
|-------|-------------|----------|---------|----------------|
| **Drama** | Intimate, character-focused | Slow, deliberate | Close-ups, medium shots | Shallow (subject isolation) |
| **Action** | Dynamic, energetic | Fast, aggressive | Wide, establishing | Deep (context visibility) |
| **Horror** | Unsettling, voyeuristic | Jerky, unpredictable | Low angles, shadows | Variable (tension building) |
| **Comedy** | Light, playful | Quick cuts, reaction shots | Medium, group shots | Medium (ensemble visibility) |
| **Romance** | Soft, intimate | Smooth, flowing | Close-ups, two-shots | Shallow (subject focus) |
| **Thriller** | Tense, observational | Tracking, orbiting | Medium, tension-building | Medium (balance) |
| **Sci-Fi** | Grand, expansive | Sweeping, establishing | Wide, environmental | Deep (world-building) |

---

## Part 3: Mind-of-Director — Collaborative Film Previsualization

### Overview

Mind-of-Director orchestrates multiple specialized agents to produce film previsualization sequences. It models the collaborative decision-making process of a film production team.

### Four Cooperative Modules

#### 1. Script Development
- Agents draft and refine screenplay iteratively
- Director ensures narrative coherence
- Screenwriter validates dialogue and action
- Output: Polished screenplay with scene descriptions

#### 2. Virtual Scene Design
- Transforms text into semantically aligned 3D environments
- Generates spatial layouts from scene descriptions
- Ensures visual consistency across scenes
- Output: 3D scene graphs with object placement

#### 3. Character Behaviour Control
- Determines character blocking and motion
- Validates actor positioning for camera framing
- Ensures character interactions are cinematically clear
- Output: Actor positions, motion paths, performance notes

#### 4. Camera Planning
- Optimizes framing, movement, and composition
- Generates cinematically valid camera trajectories
- Validates camera paths for physical plausibility
- Output: Camera specifications, movement descriptions, lighting notes

### Real-Time Visual Editing System

Built into game engine (Unity/Unreal):
- Interactive inspection of previz sequences
- Synchronized timeline adjustment across scenes, behaviors, and cameras
- Real-time feedback and iteration
- Export to video or animation sequences

---

## Part 4: Implementation Architecture

### Core AI Director Agent

```typescript
// server/ai-director-agent.ts

import { LLMClient } from '@/lib/llm';
import { GenDoPModel } from '@/lib/gendop';
import { FilmAgentOrchestrator } from '@/lib/filmagent';

interface DirectorAgentConfig {
  genre: string;
  narrativeContext: string;
  bookContent: string;
  visualBible: WorldBibleData;
  targetDuration: number; // minutes
}

interface DirectorDecision {
  sceneId: string;
  shotDescription: string;
  cameraTrajectory: CameraTrajectory;
  characterBlocking: CharacterPosition[];
  lighting: LightingSetup;
  cinematicRationale: string;
}

class AIDirectorAgent {
  private llm: LLMClient;
  private genDop: GenDoPModel;
  private filmAgent: FilmAgentOrchestrator;
  private genreProfile: GenreProfile;

  constructor(config: DirectorAgentConfig) {
    this.llm = new LLMClient();
    this.genDop = new GenDoPModel();
    this.filmAgent = new FilmAgentOrchestrator();
    this.genreProfile = this.loadGenreProfile(config.genre);
  }

  /**
   * Orchestrate entire film production for a chapter
   */
  async orchestrateChapter(
    chapterId: string,
    chapterContent: string,
    visualBible: WorldBibleData
  ): Promise<DirectorDecision[]> {
    
    // Step 1: Analyze chapter narrative
    const narrativeAnalysis = await this.analyzeNarrative(chapterContent);
    
    // Step 2: Break chapter into scenes
    const scenes = await this.breakIntoScenes(narrativeAnalysis);
    
    // Step 3: For each scene, make directorial decisions
    const decisions: DirectorDecision[] = [];
    
    for (const scene of scenes) {
      const decision = await this.makeDirectorialDecision(
        scene,
        visualBible,
        narrativeAnalysis
      );
      decisions.push(decision);
    }
    
    return decisions;
  }

  /**
   * Analyze narrative structure and emotional beats
   */
  private async analyzeNarrative(chapterContent: string) {
    const prompt = `
      Analyze this chapter for narrative structure, emotional beats, and key moments:
      
      ${chapterContent}
      
      Provide:
      1. Three-act structure breakdown
      2. Emotional arc (tension, climax, resolution)
      3. Key visual moments
      4. Character interactions
      5. Pacing recommendations
    `;

    const analysis = await this.llm.invoke({
      prompt,
      model: 'qwen2.5-1m',
      temperature: 0.7,
      maxTokens: 2000
    });

    return JSON.parse(analysis.text);
  }

  /**
   * Break chapter into individual scenes
   */
  private async breakIntoScenes(narrativeAnalysis: any) {
    const prompt = `
      Based on this narrative analysis, break the chapter into individual scenes.
      Each scene should be a distinct location/time with specific characters and actions.
      
      Analysis: ${JSON.stringify(narrativeAnalysis)}
      
      For each scene, provide:
      - Scene number
      - Location
      - Characters present
      - Key actions
      - Emotional tone
      - Visual opportunities
      
      Return as JSON array of scenes.
    `;

    const result = await this.llm.invoke({
      prompt,
      model: 'qwen2.5-1m',
      temperature: 0.7,
      maxTokens: 3000
    });

    return JSON.parse(result.text);
  }

  /**
   * Make directorial decision for a single scene
   */
  private async makeDirectorialDecision(
    scene: any,
    visualBible: WorldBibleData,
    narrativeAnalysis: any
  ): Promise<DirectorDecision> {
    
    // Step 1: Director determines creative vision
    const directorialVision = await this.determineDirectorialVision(
      scene,
      narrativeAnalysis
    );

    // Step 2: Cinematographer generates camera trajectory
    const cameraTrajectory = await this.generateCameraTrajectory(
      scene,
      directorialVision,
      visualBible
    );

    // Step 3: Actor determines character blocking
    const characterBlocking = await this.determineCharacterBlocking(
      scene,
      cameraTrajectory,
      visualBible
    );

    // Step 4: Validate and refine through collaboration
    const refined = await this.validateThroughCollaboration(
      scene,
      directorialVision,
      cameraTrajectory,
      characterBlocking
    );

    return {
      sceneId: scene.id,
      shotDescription: refined.shotDescription,
      cameraTrajectory: refined.cameraTrajectory,
      characterBlocking: refined.characterBlocking,
      lighting: refined.lighting,
      cinematicRationale: refined.rationale
    };
  }

  /**
   * Director determines creative vision for scene
   */
  private async determineDirectorialVision(scene: any, narrativeAnalysis: any) {
    const prompt = `
      As a film director, determine the creative vision for this scene:
      
      Scene: ${JSON.stringify(scene)}
      Narrative Context: ${JSON.stringify(narrativeAnalysis)}
      Genre: ${this.genreProfile.genre}
      Genre Conventions: ${JSON.stringify(this.genreProfile.conventions)}
      
      Provide:
      1. Emotional tone and mood
      2. Visual style (color palette, lighting mood)
      3. Camera approach (intimate, observational, dynamic, etc.)
      4. Key visual moments to emphasize
      5. Pacing and rhythm
      6. Cinematic principles to apply
      
      Return as JSON.
    `;

    const vision = await this.llm.invoke({
      prompt,
      model: 'qwen2.5-1m',
      temperature: 0.8,
      maxTokens: 1500
    });

    return JSON.parse(vision.text);
  }

  /**
   * Generate camera trajectory using GenDoP
   */
  private async generateCameraTrajectory(
    scene: any,
    directorialVision: any,
    visualBible: WorldBibleData
  ): Promise<CameraTrajectory> {
    
    const genDoPInput: GenDoPInput = {
      sceneDescription: scene.description,
      narrativeContext: `${scene.emotionalTone}, ${directorialVision.mood}`,
      genre: this.genreProfile.genre as any,
      directorialIntent: directorialVision.cameraApproach,
      constraints: {
        maxSpeed: this.genreProfile.cameraMaxSpeed,
        minDistance: this.genreProfile.cameraMinDistance,
        maxDistance: this.genreProfile.cameraMaxDistance,
        allowedMovements: this.genreProfile.allowedMovements
      }
    };

    const trajectory = await this.genDop.generate(genDoPInput);
    return trajectory;
  }

  /**
   * Determine character blocking for scene
   */
  private async determineCharacterBlocking(
    scene: any,
    cameraTrajectory: CameraTrajectory,
    visualBible: WorldBibleData
  ): Promise<CharacterPosition[]> {
    
    const prompt = `
      Determine character blocking for this scene:
      
      Scene: ${JSON.stringify(scene)}
      Camera Trajectory: ${JSON.stringify(cameraTrajectory)}
      Characters: ${JSON.stringify(visualBible.characters.filter(c => scene.characters.includes(c.id)))}
      
      For each character, provide:
      - Initial position (x, y, z)
      - Movement path over time
      - Interaction with other characters
      - Visibility in frame (ensure characters are visible to camera)
      - Performance notes (standing, sitting, moving, etc.)
      
      Ensure blocking is cinematically clear and supports camera framing.
      Return as JSON array of character positions.
    `;

    const blocking = await this.llm.invoke({
      prompt,
      model: 'qwen2.5-1m',
      temperature: 0.7,
      maxTokens: 2000
    });

    return JSON.parse(blocking.text);
  }

  /**
   * Validate through multi-agent collaboration
   */
  private async validateThroughCollaboration(
    scene: any,
    directorialVision: any,
    cameraTrajectory: CameraTrajectory,
    characterBlocking: CharacterPosition[]
  ): Promise<any> {
    
    // Use FILMAGENT debate-judge strategy
    const decisions = {
      director: directorialVision,
      camera: cameraTrajectory,
      blocking: characterBlocking
    };

    // Critique-Correct-Verify loop
    const critique = await this.filmAgent.critique(decisions);
    const corrected = await this.filmAgent.correct(decisions, critique);
    const verified = await this.filmAgent.verify(corrected);

    return verified;
  }

  /**
   * Load genre-specific cinematographic profile
   */
  private loadGenreProfile(genre: string): GenreProfile {
    const profiles: Record<string, GenreProfile> = {
      drama: {
        genre: 'drama',
        cameraStyle: 'intimate',
        cameraMaxSpeed: 0.3,
        cameraMinDistance: 1.5,
        cameraMaxDistance: 5,
        allowedMovements: ['pan', 'tilt', 'slow-dolly', 'subtle-orbit'],
        conventions: {
          depthOfField: 'shallow',
          framing: 'close-ups and medium shots',
          movement: 'slow and deliberate',
          lighting: 'naturalistic'
        }
      },
      action: {
        genre: 'action',
        cameraStyle: 'dynamic',
        cameraMaxSpeed: 0.8,
        cameraMinDistance: 0.5,
        cameraMaxDistance: 15,
        allowedMovements: ['pan', 'tilt', 'fast-dolly', 'orbit', 'handheld'],
        conventions: {
          depthOfField: 'deep',
          framing: 'wide and establishing',
          movement: 'fast and aggressive',
          lighting: 'high-contrast'
        }
      },
      horror: {
        genre: 'horror',
        cameraStyle: 'unsettling',
        cameraMaxSpeed: 0.5,
        cameraMinDistance: 1,
        cameraMaxDistance: 10,
        allowedMovements: ['pan', 'tilt', 'jerky-dolly', 'orbit', 'handheld-shake'],
        conventions: {
          depthOfField: 'variable',
          framing: 'low angles and shadows',
          movement: 'jerky and unpredictable',
          lighting: 'dark and moody'
        }
      },
      comedy: {
        genre: 'comedy',
        cameraStyle: 'playful',
        cameraMaxSpeed: 0.6,
        cameraMinDistance: 1,
        cameraMaxDistance: 8,
        allowedMovements: ['pan', 'tilt', 'quick-dolly', 'orbit'],
        conventions: {
          depthOfField: 'medium',
          framing: 'medium and group shots',
          movement: 'quick cuts and reactions',
          lighting: 'bright and clear'
        }
      },
      romance: {
        genre: 'romance',
        cameraStyle: 'soft',
        cameraMaxSpeed: 0.2,
        cameraMinDistance: 1.5,
        cameraMaxDistance: 6,
        allowedMovements: ['pan', 'tilt', 'slow-dolly', 'subtle-orbit'],
        conventions: {
          depthOfField: 'shallow',
          framing: 'close-ups and two-shots',
          movement: 'smooth and flowing',
          lighting: 'warm and romantic'
        }
      },
      thriller: {
        genre: 'thriller',
        cameraStyle: 'tense',
        cameraMaxSpeed: 0.5,
        cameraMinDistance: 1,
        cameraMaxDistance: 12,
        allowedMovements: ['pan', 'tilt', 'tracking', 'orbit', 'handheld'],
        conventions: {
          depthOfField: 'medium',
          framing: 'medium shots with tension',
          movement: 'tracking and orbiting',
          lighting: 'high-contrast and moody'
        }
      },
      'sci-fi': {
        genre: 'sci-fi',
        cameraStyle: 'grand',
        cameraMaxSpeed: 0.7,
        cameraMinDistance: 2,
        cameraMaxDistance: 20,
        allowedMovements: ['pan', 'tilt', 'sweeping-dolly', 'orbit', 'crane'],
        conventions: {
          depthOfField: 'deep',
          framing: 'wide and environmental',
          movement: 'sweeping and establishing',
          lighting: 'futuristic and bold'
        }
      }
    };

    return profiles[genre] || profiles.drama;
  }
}

interface GenreProfile {
  genre: string;
  cameraStyle: string;
  cameraMaxSpeed: number;
  cameraMinDistance: number;
  cameraMaxDistance: number;
  allowedMovements: string[];
  conventions: Record<string, string>;
}

interface CharacterPosition {
  characterId: string;
  position: Vector3;
  rotation: Quaternion;
  animation: string;
  startFrame: number;
  endFrame: number;
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface LightingSetup {
  keyLight: Light;
  fillLight: Light;
  backLight: Light;
  ambientLight: Light;
}

interface Light {
  position: Vector3;
  color: string;
  intensity: number;
  temperature: number;
}

export { AIDirectorAgent, DirectorAgentConfig, DirectorDecision };
```

---

## Part 5: Integration with BookCinema Pipeline

### Updated Orchestration Flow

```
Book Content (1M tokens via Qwen2.5-1M)
    ↓
[AI Director Agent]
    ├─ Narrative Analysis
    ├─ Scene Breakdown
    ├─ Directorial Vision (per scene)
    ├─ Camera Trajectory Generation (GenDoP)
    ├─ Character Blocking
    ├─ Multi-Agent Validation (FILMAGENT)
    └─ Output: Directorial Decisions
    ↓
[Visual Director Agent (Agent 4)]
    ├─ Generate keyframe prompts
    ├─ Apply camera parameters
    ├─ Add lighting specifications
    └─ Output: 1000+ visual prompts
    ↓
[Video Producer Agent (Agent 5)]
    ├─ Batch process via LongVideoCat-LLM
    ├─ Apply temporal consistency checks
    ├─ Assemble into 1000+ frame sequences
    └─ Output: Cinematic Video clips
    ↓
[Video Editor]
    ├─ Assemble clips with transitions
    ├─ Add audio/music
    ├─ Color grade
    └─ Output: Final 2-hour film
```

### tRPC Router Integration

```typescript
// server/routers.ts - Add to books router

export const booksRouter = router({
  // ... existing routes ...

  orchestrateWithAIDirector: protectedProcedure
    .input(z.object({
      bookId: z.string(),
      genre: z.enum(['drama', 'action', 'horror', 'comedy', 'romance', 'thriller', 'sci-fi']),
      targetDuration: z.number().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { bookId, genre, targetDuration = 120 } = input;

      // Fetch book and visual bible
      const book = await ctx.db.query.books.findFirst({
        where: eq(books.id, bookId)
      });

      const visualBible = await ctx.db.query.worldBibles.findFirst({
        where: eq(worldBibles.bookId, bookId)
      });

      if (!book || !visualBible) throw new Error('Book or visual bible not found');

      // Initialize AI Director Agent
      const director = new AIDirectorAgent({
        genre,
        narrativeContext: book.title,
        bookContent: book.content,
        visualBible: JSON.parse(visualBible.data),
        targetDuration
      });

      // Orchestrate film production
      const chapters = await ctx.db.query.chapters.findMany({
        where: eq(chapters.bookId, bookId)
      });

      const allDecisions: DirectorDecision[] = [];

      for (const chapter of chapters) {
        const decisions = await director.orchestrateChapter(
          chapter.id,
          chapter.content,
          JSON.parse(visualBible.data)
        );
        allDecisions.push(...decisions);
      }

      // Store directorial decisions
      for (const decision of allDecisions) {
        await ctx.db.insert(videoScenes).values({
          chapterId: decision.sceneId,
          sceneIndex: 0,
          description: decision.shotDescription,
          cameraParams: JSON.stringify(decision.cameraTrajectory),
          characterBlocking: JSON.stringify(decision.characterBlocking),
          lighting: JSON.stringify(decision.lighting),
          cinematicRationale: decision.cinematicRationale,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return {
        success: true,
        totalScenes: allDecisions.length,
        genre,
        estimatedDuration: targetDuration
      };
    })
});
```

---

## Part 6: Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)
- [ ] Implement AIDirectorAgent core class
- [ ] Integrate Qwen2.5-1M for narrative analysis
- [ ] Add genre profile system
- [ ] Basic scene breakdown logic

### Phase 2: GenDoP Integration (Weeks 3-4)
- [ ] Integrate GenDoP model
- [ ] Implement camera trajectory generation
- [ ] Add genre-specific camera profiles
- [ ] Validate trajectory plausibility

### Phase 3: FILMAGENT Collaboration (Weeks 5-6)
- [ ] Implement multi-agent critique-correct-verify loop
- [ ] Add character blocking determination
- [ ] Implement debate-judge strategy
- [ ] Add validation and refinement

### Phase 4: Production Optimization (Weeks 7-8)
- [ ] Batch processing for multiple chapters
- [ ] Caching of genre profiles and decisions
- [ ] Real-time progress tracking
- [ ] Analytics and reporting

---

## Part 7: Cost Estimates

| Component | Cost per Book | Notes |
|-----------|---------------|-------|
| Qwen2.5-1M (narrative analysis) | $20 | Full book in 1M-token window |
| GenDoP (camera generation) | $50 | 100+ camera trajectories |
| FILMAGENT (multi-agent validation) | $30 | Critique-correct-verify loops |
| Character blocking & lighting | $40 | Scene composition |
| **Total AI Direction** | **$140** | Per book orchestration |

---

## Part 8: Key Advantages

1. **Autonomous Cinematography** — No user intervention needed; AI makes all creative decisions
2. **Genre-Aware** — Adapts cinematography to genre conventions and narrative context
3. **Narrative-Driven** — Camera movements support story, not just showcase visuals
4. **Collaborative** — Multi-agent validation ensures quality and coherence
5. **Scalable** — Processes full books in single context window (Qwen2.5-1M)
6. **Production-Grade** — Based on proven frameworks (FILMAGENT, GenDoP, Mind-of-Director)

---

## References

- **FILMAGENT Paper:** https://arxiv.org/abs/2501.12909
- **GenDoP Paper:** https://arxiv.org/abs/2504.07083
- **Mind-of-Director Paper:** https://arxiv.org/abs/2603.14790
- **FILMAGENT Project:** https://filmagent.github.io/
- **GenDoP Project:** https://kszpxxzmc.github.io/GenDoP/
- **Mind-of-Director Project:** https://pharlency.github.io/Mind-of-Director/
