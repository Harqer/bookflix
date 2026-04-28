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
  fillLight: {
    position: { x: number; y: number; z: number };
    color: string;
    intensity: number;
    temperature: number;
  };
  backLight: {
    position: { x: number; y: number; z: number };
    color: string;
    intensity: number;
    temperature: number;
  };
  ambientLight: {
    color: string;
    intensity: number;
  };
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
  };
  cameraApproach: string;
  keyVisualMoments: string[];
  pacingAndRhythm: string;
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

export class AIDirectorAgent {
  private genreProfile: GenreProfile;
  private config: DirectorAgentConfig;

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
      // Step 1: Analyze chapter narrative
      const narrativeAnalysis = await this.analyzeNarrative(chapterContent);

      // Step 2: Break chapter into scenes
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
   * Analyze narrative structure and emotional beats
   */
  private async analyzeNarrative(chapterContent: string): Promise<NarrativeAnalysis> {
    const prompt = `Analyze this chapter for narrative structure, emotional beats, and key moments:

${chapterContent.substring(0, 5000)}

Provide a JSON response with:
1. actStructure: array of acts with descriptions and key moments
2. emotionalArc: array of emotional phases with intensity (0-10) and description
3. keyVisualMoments: array of visually compelling moments
4. characterInteractions: array of character interactions with type and description
5. pacingRecommendations: string with pacing advice

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 2000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      return JSON.parse(text);
    } catch {
      // Fallback structure if parsing fails
      return {
        actStructure: [
          { act: 1, description: 'Setup', keyMoments: ['Introduction'] },
          { act: 2, description: 'Confrontation', keyMoments: ['Conflict'] },
          { act: 3, description: 'Resolution', keyMoments: ['Climax'] }
        ],
        emotionalArc: [
          { phase: 'Exposition', intensity: 5, description: 'Setting the stage' },
          { phase: 'Climax', intensity: 9, description: 'Peak tension' },
          { phase: 'Resolution', intensity: 6, description: 'Denouement' }
        ],
        keyVisualMoments: ['Key moment 1', 'Key moment 2'],
        characterInteractions: [],
        pacingRecommendations: 'Maintain steady pacing'
      };
    }
  }

  /**
   * Break chapter into individual scenes
   */
  private async breakIntoScenes(
    narrativeAnalysis: NarrativeAnalysis,
    chapterContent: string
  ): Promise<Scene[]> {
    const prompt = `Break this chapter into individual scenes. Each scene should be a distinct location/time with specific characters and actions.

Narrative Analysis: ${JSON.stringify(narrativeAnalysis)}

Chapter excerpt: ${chapterContent.substring(0, 3000)}

For each scene, provide a JSON array with:
- id: unique scene identifier
- number: scene number
- location: scene location
- characters: array of character names
- keyActions: array of key actions
- emotionalTone: emotional tone of the scene
- visualOpportunities: array of visual opportunities

Return ONLY valid JSON array, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 3000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      return JSON.parse(text);
    } catch {
      // Fallback: create a single scene
      return [
        {
          id: 'scene-1',
          number: 1,
          location: 'Unknown Location',
          characters: [],
          keyActions: ['Scene action'],
          emotionalTone: 'dramatic',
          visualOpportunities: ['Visual opportunity']
        }
      ];
    }
  }

  /**
   * Make directorial decision for a single scene
   */
  private async makeDirectorialDecision(
    scene: Scene,
    visualBible: WorldBibleData,
    narrativeAnalysis: NarrativeAnalysis
  ): Promise<DirectorDecision> {
    try {
      // Step 1: Director determines creative vision
      const directorialVision = await this.determineDirectorialVision(
        scene,
        narrativeAnalysis
      );

      // Step 2: Generate camera trajectory
      const cameraTrajectory = await this.generateCameraTrajectory(
        scene,
        directorialVision
      );

      // Step 3: Determine character blocking
      const characterBlocking = await this.determineCharacterBlocking(
        scene,
        cameraTrajectory,
        visualBible
      );

      // Step 4: Generate lighting setup
      const lighting = await this.generateLightingSetup(scene, directorialVision);

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

  /**
   * Director determines creative vision for scene
   */
  private async determineDirectorialVision(
    scene: Scene,
    narrativeAnalysis: NarrativeAnalysis
  ): Promise<DirectorialVision> {
    const prompt = `As a film director, determine the creative vision for this scene:

Scene: ${JSON.stringify(scene)}
Genre: ${this.genreProfile.genre}
Genre Conventions: ${JSON.stringify(this.genreProfile.conventions)}

Provide a JSON response with:
- emotionalTone: emotional tone
- mood: visual mood
- visualStyle: object with colorPalette (array of colors) and lightingMood
- cameraApproach: camera approach description
- keyVisualMoments: array of key visual moments to emphasize
- pacingAndRhythm: pacing description
- cinematicPrinciples: array of cinematic principles to apply

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 1500
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      return JSON.parse(text);
    } catch {
      // Fallback vision
      return {
        emotionalTone: scene.emotionalTone,
        mood: 'dramatic',
        visualStyle: {
          colorPalette: ['#8B4513', '#D2B48C', '#2C1810'],
          lightingMood: 'naturalistic'
        },
        cameraApproach: this.genreProfile.cameraStyle,
        keyVisualMoments: scene.visualOpportunities,
        pacingAndRhythm: 'steady',
        cinematicPrinciples: ['Rule of thirds', 'Leading lines']
      };
    }
  }

  /**
   * Generate camera trajectory based on scene and vision
   */
  private async generateCameraTrajectory(
    scene: Scene,
    directorialVision: DirectorialVision
  ): Promise<CameraTrajectory> {
    const genDoPParams: CameraTrajectoryParams = {
      sceneDescription: scene.location,
      narrativeContext: directorialVision.mood,
      genre: this.genreProfile.genre,
      directorialIntent: directorialVision.cameraApproach,
      constraints: {
        maxSpeed: this.genreProfile.cameraMaxSpeed,
        minDistance: this.genreProfile.cameraMinDistance,
        maxDistance: this.genreProfile.cameraMaxDistance,
        allowedMovements: this.genreProfile.allowedMovements
      }
    };

    return GenDoPIntegration.generateTrajectory(genDoPParams, scene, directorialVision);
  }

  /**
   * Determine character blocking for scene
   */
  private async determineCharacterBlocking(
    scene: Scene,
    cameraTrajectory: CameraTrajectory,
    visualBible: WorldBibleData
  ): Promise<CharacterPosition[]> {
    const prompt = `Determine character blocking for this scene:

Scene: ${JSON.stringify(scene)}
Characters in scene: ${scene.characters.join(', ')}

For each character, provide a JSON array with:
- characterId: character identifier
- position: object with x, y, z coordinates
- rotation: object with x, y, z, w quaternion values
- animation: animation name (standing, walking, sitting, etc.)
- startFrame: start frame number
- endFrame: end frame number

Ensure blocking is cinematically clear and supports camera framing.
Return ONLY valid JSON array, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 2000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      return JSON.parse(text);
    } catch {
      // Fallback blocking
      return scene.characters.map((charId, idx) => ({
        characterId: charId,
        position: { x: idx * 2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        animation: 'standing',
        startFrame: 0,
        endFrame: 120
      }));
    }
  }

  /**
   * Generate lighting setup for scene
   */
  private async generateLightingSetup(
    scene: Scene,
    directorialVision: DirectorialVision
  ): Promise<LightingSetup> {
    const prompt = `Generate a lighting setup for this scene:

Scene: ${JSON.stringify(scene)}
Directorial Vision: ${JSON.stringify(directorialVision)}
Lighting Mood: ${directorialVision.visualStyle.lightingMood}

Provide a JSON response with:
- keyLight: object with position (x, y, z), color (hex), intensity (0-1), temperature (K)
- fillLight: similar structure
- backLight: similar structure
- ambientLight: object with color (hex) and intensity (0-1)

Return ONLY valid JSON, no markdown.`;

    const params: InvokeParams = {
      messages: [
        {
          role: 'user' as const,
          content: prompt
        }
      ] as Message[],
      maxTokens: 1000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' ? result.choices[0].message.content : '';

    try {
      return JSON.parse(text);
    } catch {
      // Fallback lighting
      return {
        keyLight: {
          position: { x: 3, y: 2, z: 1 },
          color: '#FFFFFF',
          intensity: 0.8,
          temperature: 5600
        },
        fillLight: {
          position: { x: -2, y: 1, z: 1 },
          color: '#E8D4C0',
          intensity: 0.4,
          temperature: 3200
        },
        backLight: {
          position: { x: 0, y: 2, z: -3 },
          color: '#FFFFFF',
          intensity: 0.3,
          temperature: 5600
        },
        ambientLight: {
          color: '#4A4A4A',
          intensity: 0.2
        }
      };
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
