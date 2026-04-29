import { invokeLLM, type InvokeParams, type InvokeResult, type Message } from '../_core/llm';
import type { NarrativeAnalysis, DirectorialVision, Scene } from '../ai-director-agent';

/**
 * Vision Engine
 * Responsibility: Translating text/narrative into creative cinematic direction.
 */
export class VisionEngine {
  /**
   * Analyze narrative structure and emotional beats
   */
  static async analyzeNarrative(chapterContent: string): Promise<NarrativeAnalysis> {
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
      messages: [{ role: 'user', content: prompt }] as Message[],
      maxTokens: 2000
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' 
      ? result.choices[0].message.content 
      : '';

    try {
      return JSON.parse(text);
    } catch {
      return this.getFallbackNarrative();
    }
  }

  /**
   * Determine creative vision for a specific scene
   */
  static async determineDirectorialVision(
    scene: Scene,
    genre: string,
    conventions: any
  ): Promise<DirectorialVision> {
    const prompt = `As the Master Director, define the 4D Cinematic Intent for this scene.

SCENE: ${JSON.stringify(scene)}
GENRE: ${genre}

REQUIRED OUTPUT FORMAT (JSON):
{
  "emotionalTone": "string",
  "mood": "string",
  "visualStyle": {
    "colorPalette": ["#hex"],
    "lightingMood": "string",
    "lightingSpecs": {
      "keyTemperatureK": number,
      "shadowSoftness": 0-1,
      "rationale": "Chiaroscuro/Rembrandt/etc"
    }
  },
  "optics": {
    "focalLengthMm": number,
    "aperture": "f/number",
    "rationale": "why this lens?"
  },
  "cameraApproach": "string",
  "motionUnitary": "Describe the 4D unitary evolution path",
  "cinematicPrinciples": ["Rule of thirds", "Golden ratio", etc]
}

Return ONLY valid JSON.`;

    const params: InvokeParams = {
      messages: [{ role: 'user', content: prompt }] as Message[],
      maxTokens: 1500
    };

    const result: InvokeResult = await invokeLLM(params);
    const text = typeof result.choices[0]?.message?.content === 'string' 
      ? result.choices[0].message.content 
      : '';

    try {
      return JSON.parse(text);
    } catch {
      return this.getFallbackVision(scene, genre);
    }
  }

  private static getFallbackNarrative(): NarrativeAnalysis {
    return {
      actStructure: [{ act: 1, description: 'Setup', keyMoments: ['Introduction'] }],
      emotionalArc: [{ phase: 'Exposition', intensity: 5, description: 'Neutral' }],
      keyVisualMoments: [],
      characterInteractions: [],
      pacingRecommendations: 'Standard'
    };
  }

  private static getFallbackVision(scene: Scene, genre: string): DirectorialVision {
    return {
      emotionalTone: scene.emotionalTone,
      mood: 'dramatic',
      visualStyle: {
        colorPalette: ['#2C1810', '#D2B48C'],
        lightingMood: 'naturalistic',
        lightingSpecs: {
          keyTemperatureK: 5600,
          shadowSoftness: 0.5,
          rationale: 'Naturalistic'
        }
      },
      optics: {
        focalLengthMm: 35,
        aperture: 'f/2.8',
        rationale: 'Standard wide'
      },
      cameraApproach: genre,
      keyVisualMoments: scene.visualOpportunities,
      pacingAndRhythm: 'steady',
      motionUnitary: 'Steady linear movement',
      cinematicPrinciples: ['Rule of thirds']
    };
  }
}
