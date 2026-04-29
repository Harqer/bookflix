import { invokeLLM, type InvokeParams, type Message } from '../_core/llm';
import type { Scene, CharacterPosition, WorldBibleData, CameraTrajectory } from '../ai-director-agent';

/**
 * Blocking Engine
 * Responsibility: Spatial arrangement of characters and props relative to the camera.
 */
export class BlockingEngine {
  /**
   * Determine character positions and animations for a scene
   */
  static async determineBlocking(
    scene: Scene,
    camera: CameraTrajectory,
    bible: WorldBibleData
  ): Promise<CharacterPosition[]> {
    const prompt = `Determine character blocking for this scene:
Scene: ${JSON.stringify(scene)}
Characters: ${scene.characters.join(', ')}

Ensure blocking supports camera framing. Return ONLY valid JSON array.`;

    const params: InvokeParams = {
      messages: [{ role: 'user', content: prompt }] as Message[],
      maxTokens: 2000
    };

    try {
      const result = await invokeLLM(params);
      const text = typeof result.choices[0]?.message?.content === 'string' 
        ? result.choices[0].message.content 
        : '';
      return JSON.parse(text);
    } catch {
      return this.getFallbackBlocking(scene);
    }
  }

  private static getFallbackBlocking(scene: Scene): CharacterPosition[] {
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
