import { invokeLLM, type InvokeParams, type InvokeResult, type Message } from './_core/llm';
import GenDoPIntegration, { type CameraTrajectoryParams } from './gendop-integration';
import FilmAgentCollaboration from './filmagent-collaboration';

type WorldBibleData = {
  characters: Array<{ id: string; name: string; appearance: string; personality: string; arc: string }>;
  locations: Array<{ id: string; name: string; description: string; mood: string }>;
  timeline: Array<{ id: string; event: string; date: string; significance: string }>;
  themes: Array<{ id: string; name: string; description: string }>;
};

interface GenreProfile {
  genre: string;
  cameraStyle: string;
  cameraMaxSpeed: number;
  cameraMinDistance: number;
  cameraMaxDistance: number;
  allowedMovements: string[];
  conventions: Record<string, string>;
}

interface CameraTrajectory {
  positions: Array<{ x: number; y: number; z: number }>;
  rotations: Array<{ x: number; y: number; z: number; w: number }>;
  focalLengths: number[];
  focusDistance: number;
  aperture: number;
  frameRate: number;
  totalFrames: number;
}

interface CharacterPosition {
  characterId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  animation: string;
  startFrame: number;
  endFrame: number;
}

interface LightingSetup {
  keyLight: {
    position: { x: number; y: number; z: number };
    color: string;
    intensity: number;
    temperature: number;
  };
  shCoefficients: {
    red: number[];
    green: number[];
    blue: number[];
  };
  rationale: string;
}

interface DirectorDecision {
  sceneId: string;
  shotDescription: string;
  cameraTrajectory: CameraTrajectory;
  characterBlocking: CharacterPosition[];
  lighting: LightingSetup;
  cinematicRationale: string;
}

interface DirectorAgentConfig {
  genre: string;
  narrativeContext: string;
  bookContent: string;
  visualBible: WorldBibleData;
  targetDuration: number;
}

interface NarrativeAnalysis {
  actStructure: Array<{
    act: number;
    description: string;
    keyMoments: string[];
  }>;
  emotionalArc: Array<{
    phase: string;
    intensity: number;
    description: string;
  }>;
  keyVisualMoments: string[];
  characterInteractions: Array<{
    characters: string[];
    type: string;
    description: string;
  }>;
  pacingRecommendations: string;
}

interface Scene {
  id: string;
  number: number;
  location: string;
  characters: string[];
  keyActions: string[];
  emotionalTone: string;
  visualOpportunities: string[];
}

interface DirectorialVision {
  emotionalTone: string;
  mood: string;
  visualStyle: {
    colorPalette: string[];
    lightingMood: string;
    lightingSpecs: {
      keyTemperatureK: number;
      shadowSoftness: number;
      rationale: string;
    };
  };
  optics: {
    focalLengthMm: number;
    aperture: string;
    rationale: string;
  };
  cameraApproach: string;
  keyVisualMoments: string[];
  pacingAndRhythm: string;
  motionUnitary: string;
  cinematicPrinciples: string[];
}

const GENRE_PROFILES: Record<string, GenreProfile> = {
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

import { VisionEngine } from './director/vision-engine';
import { CameraEngine } from './director/camera-engine';
import { BlockingEngine } from './director/blocking-engine';
import { LightingEngine } from './director/lighting-engine';

export class AIDirectorAgent {
  private genreProfile: GenreProfile;
  private config: DirectorAgentConfig;

  private static SYSTEM_PROMPT = `You are the Master Director (Claude 3.5 Sonnet). 
Your expertise spans the history of cinema, photography, and art. 
You are NOT a software operator; you are the Visionary.

DEEP KNOWLEDGE BASE:
- CINEMATOGRAPHY: Rule of Thirds, Golden Ratio, Dutch Angles, Tracking Shots.
- LIGHTING: Inverse-Square Law, Chiaroscuro, Rembrandt, 3-Point Setup, Kelvin (2000K-10000K).
- OPTICS: 14-35mm (Wide), 50mm (Natural), 85-200mm (Intimate/Compressed). 
- PHYSICS: You understand that every motion is a Unitary Evolution in 4D space-time.

YOUR JOB:
1. Extract the emotional and physical essence from the screenplay.
2. Define the 'Cinematic Intent' for the Specialist Agents (Blender-LLM, Cosmos Predict).
3. Ensure all decisions are physically grounded and narratively consistent.
`;

  constructor(config: DirectorAgentConfig) {
    this.config = config;
    this.genreProfile = GENRE_PROFILES[config.genre.toLowerCase()] || GENRE_PROFILES.drama;
  }

  /**
   * Orchestrate entire film production for a chapter
   */
  async orchestrateChapter(
    chapterId: string,
    chapterContent: string,
    visualBible: WorldBibleData
  ): Promise<DirectorDecision[]> {
    try {
      // Step 1: Analyze chapter narrative (Atomic Engine)
      const narrativeAnalysis = await VisionEngine.analyzeNarrative(chapterContent);

      // Step 2: Break chapter into scenes (Compositional logic)
      const scenes = await this.breakIntoScenes(narrativeAnalysis, chapterContent);

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
    } catch (error) {
      console.error('Error in orchestrateChapter:', error);
      throw error;
    }
  }

  /**
   * Break chapter into individual scenes (Delegated to Vision context)
   */
  private async breakIntoScenes(
    narrativeAnalysis: NarrativeAnalysis,
    chapterContent: string
  ): Promise<Scene[]> {
    const prompt = `Break this chapter into individual scenes based on location/time.
Narrative Analysis: ${JSON.stringify(narrativeAnalysis)}
Excerpt: ${chapterContent.substring(0, 3000)}
Return ONLY valid JSON array.`;

    const params: InvokeParams = {
      messages: [{ role: 'user', content: prompt }] as Message[],
      maxTokens: 3000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      return JSON.parse(text);
    } catch {
      return [{ id: 'scene-1', number: 1, location: 'Unknown', characters: [], keyActions: ['Action'], emotionalTone: 'dramatic', visualOpportunities: [] }];
    }
  }

  /**
   * Orchestrate directorial decisions for a single scene by composing specialized engines
   */
  private async makeDirectorialDecision(
    scene: Scene,
    visualBible: WorldBibleData,
    narrativeAnalysis: NarrativeAnalysis
  ): Promise<DirectorDecision> {
    try {
      // 1. Creative Vision (Atomic Engine)
      const directorialVision = await VisionEngine.determineDirectorialVision(
        scene,
        this.genreProfile.genre,
        this.genreProfile.conventions
      );

      // 2. Camera Physics (Atomic Engine)
      const cameraTrajectory = await CameraEngine.generateTrajectory(
        scene,
        directorialVision,
        this.genreProfile
      );

      // 3. Spatial Blocking (Atomic Engine)
      const characterBlocking = await BlockingEngine.determineBlocking(
        scene,
        cameraTrajectory,
        visualBible
      );

      // 4. Lighting Strategy (Atomic Engine)
      const lighting = await LightingEngine.generateSetup(scene, directorialVision);

      return {
        sceneId: scene.id,
        shotDescription: `${scene.location}: ${scene.keyActions.join(', ')}`,
        cameraTrajectory,
        characterBlocking,
        lighting,
        cinematicRationale: directorialVision.cinematicPrinciples.join('; ')
      };
    } catch (error) {
      console.error(`Error making directorial decision for scene ${scene.id}:`, error);
      throw error;
    }
  }
}

export type {
  DirectorAgentConfig,
  DirectorDecision,
  NarrativeAnalysis,
  Scene,
  DirectorialVision,
  CameraTrajectory,
  CharacterPosition,
  LightingSetup
};
