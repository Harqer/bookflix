import { invokeLLM, type InvokeParams, type Message } from '../_core/llm';
import type { Scene, DirectorialVision, LightingSetup } from '../ai-director-agent';

/**
 * Lighting Engine
 * Responsibility: Generating technical lighting setups (Key, Fill, Back, Ambient).
 */
export class LightingEngine {
  /**
   * Calculate lighting parameters based on visual mood
   */
  static async generateSetup(
    scene: Scene,
    vision: DirectorialVision
  ): Promise<LightingSetup> {
    const prompt = `As a Lighting Technical Director, generate the 3rd-order Spherical Harmonics (SH) coefficients and 3-point light setup for this scene.

SCENE: ${scene.location}
VISION: ${JSON.stringify(vision.visualStyle)}

SH REQUIREMENTS:
- Provide 27 coefficients (9 per RGB channel) for global illumination.
- Coefficients must reflect the 'lightingMood' and 'lightingSpecs' (Temperature, Softness).

RETURN JSON FORMAT:
{
  "keyLight": { "position": {"x":0,"y":0,"z":0}, "color": "hex", "intensity": 0-1, "temperature": 2000-10000 },
  "shCoefficients": {
    "red": [9 floats],
    "green": [9 floats],
    "blue": [9 floats]
  },
  "rationale": "technical reason for this SH distribution"
}

Return ONLY valid JSON.`;

    const params: InvokeParams = {
      messages: [{ role: 'user', content: prompt }] as Message[],
      maxTokens: 1000
    };

    try {
      const result = await invokeLLM(params);
      const text = typeof result.choices[0]?.message?.content === 'string' 
        ? result.choices[0].message.content 
        : '';
      return JSON.parse(text);
    } catch {
      return this.getFallbackLighting();
    }
  }

  private static getFallbackLighting(): LightingSetup {
    return {
      keyLight: { position: { x: 3, y: 2, z: 1 }, color: '#FFFFFF', intensity: 0.8, temperature: 5600 },
      shCoefficients: {
        red: [0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        green: [0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        blue: [0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
      },
      rationale: 'Neutral fallback lighting'
    };
  }
}
