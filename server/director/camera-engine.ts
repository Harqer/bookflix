import GenDoPIntegration, { type CameraTrajectoryParams } from '../gendop-integration';
import type { Scene, DirectorialVision, CameraTrajectory, GenreProfile } from '../ai-director-agent';

/**
 * Camera Engine
 * Responsibility: Translating creative intent into physical camera trajectories and physics.
 */
export class CameraEngine {
  /**
   * Calculate camera movement based on genre profiles and directorial intent
   */
  static async generateTrajectory(
    scene: Scene,
    vision: DirectorialVision,
    profile: GenreProfile
  ): Promise<CameraTrajectory> {
    const params: CameraTrajectoryParams = {
      sceneDescription: scene.location,
      narrativeContext: vision.mood,
      genre: profile.genre,
      directorialIntent: vision.cameraApproach,
      constraints: {
        maxSpeed: profile.cameraMaxSpeed,
        minDistance: profile.cameraMinDistance,
        maxDistance: profile.cameraMaxDistance,
        allowedMovements: profile.allowedMovements
      }
    };

    return GenDoPIntegration.generateTrajectory(params, scene, vision);
  }
}
