/**
 * GenDoP Integration Module
 * 
 * Generates artistic camera trajectories using GenDoP-inspired techniques.
 * GenDoP is an auto-regressive Transformer model trained on 29K real-world film shots.
 * 
 * In production, this would call the actual GenDoP model via API.
 * For MVP, we implement trajectory generation using cinematographic principles.
 */

import type { Scene, DirectorialVision } from './ai-director-agent';

export interface CameraTrajectoryParams {
  sceneDescription: string;
  narrativeContext: string;
  genre: string;
  directorialIntent: string;
  constraints: {
    maxSpeed: number;
    minDistance: number;
    maxDistance: number;
    allowedMovements: string[];
  };
}

export interface CameraTrajectory {
  positions: Array<{ x: number; y: number; z: number }>;
  rotations: Array<{ x: number; y: number; z: number; w: number }>;
  focalLengths: number[];
  focusDistance: number;
  aperture: number;
  frameRate: number;
  totalFrames: number;
  movementType: string;
  movementDescription: string;
}

/**
 * GenDoP-inspired camera trajectory generator
 * Implements cinematographic principles for different genres
 */
export class GenDoPIntegration {
  /**
   * Generate camera trajectory for a scene
   */
  static async generateTrajectory(
    params: CameraTrajectoryParams,
    scene: Scene,
    vision: DirectorialVision
  ): Promise<CameraTrajectory> {
    const genre = params.genre.toLowerCase();
    const movementType = this.selectMovementType(genre, params.constraints.allowedMovements);

    // Determine trajectory duration (5-15 seconds depending on scene)
    const durationSeconds = this.calculateDuration(scene, vision);
    const frameCount = durationSeconds * 24; // 24 fps

    // Generate positions based on movement type
    const positions = this.generatePositions(
      movementType,
      frameCount,
      params.constraints,
      scene
    );

    // Generate rotations based on movement type
    const rotations = this.generateRotations(movementType, frameCount, vision);

    // Generate focal lengths (zoom) based on emotional arc
    const focalLengths = this.generateFocalLengths(
      movementType,
      frameCount,
      vision,
      params.constraints
    );

    return {
      positions,
      rotations,
      focalLengths,
      focusDistance: this.calculateFocusDistance(movementType, params.constraints),
      aperture: this.calculateAperture(genre, vision),
      frameRate: 24,
      totalFrames: frameCount,
      movementType,
      movementDescription: this.getMovementDescription(movementType)
    };
  }

  /**
   * Select camera movement type based on genre and allowed movements
   */
  private static selectMovementType(
    genre: string,
    allowedMovements: string[]
  ): string {
    const genreMovements: Record<string, string[]> = {
      drama: ['slow-dolly', 'subtle-orbit', 'pan'],
      action: ['fast-dolly', 'handheld', 'orbit'],
      horror: ['jerky-dolly', 'handheld-shake', 'orbit'],
      comedy: ['quick-dolly', 'orbit', 'pan'],
      romance: ['slow-dolly', 'subtle-orbit', 'pan'],
      thriller: ['tracking', 'orbit', 'handheld'],
      'sci-fi': ['sweeping-dolly', 'orbit', 'crane']
    };

    const preferred = genreMovements[genre] || genreMovements.drama;
    const available = preferred.filter(m => allowedMovements.includes(m));

    return available.length > 0 ? available[0] : 'pan';
  }

  /**
   * Calculate shot duration based on scene and emotional context
   */
  private static calculateDuration(scene: Scene, vision: DirectorialVision): number {
    // Key moments get longer shots (10-15 seconds)
    if (vision.keyVisualMoments && vision.keyVisualMoments.length > 0) {
      return 12;
    }

    // Dialogue-heavy scenes get medium shots (8-10 seconds)
    if (scene.keyActions.some(a => a.toLowerCase().includes('dialogue'))) {
      return 9;
    }

    // Action scenes get shorter, punchier shots (5-7 seconds)
    if (scene.emotionalTone === 'tense' || scene.emotionalTone === 'action') {
      return 6;
    }

    // Default to medium length
    return 8;
  }

  /**
   * Generate camera positions over time
   */
  private static generatePositions(
    movementType: string,
    frameCount: number,
    constraints: CameraTrajectoryParams['constraints'],
    scene: Scene
  ): Array<{ x: number; y: number; z: number }> {
    const positions: Array<{ x: number; y: number; z: number }> = [];
    const { minDistance, maxDistance } = constraints;

    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      let pos: { x: number; y: number; z: number };

      switch (movementType) {
        // Dolly-in: move forward toward subject
        case 'slow-dolly':
        case 'fast-dolly':
        case 'sweeping-dolly':
          pos = {
            x: 0,
            y: 1.5 + Math.sin(t * Math.PI) * 0.3,
            z: maxDistance - t * (maxDistance - minDistance)
          };
          break;

        // Orbit: circular movement around subject
        case 'orbit':
          const radius = minDistance + (maxDistance - minDistance) * 0.5;
          pos = {
            x: Math.cos(t * Math.PI * 2) * radius,
            y: 1.5,
            z: Math.sin(t * Math.PI * 2) * radius
          };
          break;

        // Tracking: sideways movement
        case 'tracking':
          pos = {
            x: t * (maxDistance - minDistance) - (maxDistance - minDistance) * 0.5,
            y: 1.5,
            z: (minDistance + maxDistance) * 0.5
          };
          break;

        // Handheld: jittery, organic movement
        case 'handheld':
        case 'handheld-shake':
          const jitter = Math.random() * 0.2 - 0.1;
          pos = {
            x: jitter,
            y: 1.5 + jitter * 0.5,
            z: maxDistance - t * (maxDistance - minDistance) + jitter
          };
          break;

        // Pan: horizontal rotation (minimal position change)
        case 'pan':
        case 'tilt':
          pos = {
            x: 0,
            y: 1.5,
            z: (minDistance + maxDistance) * 0.5
          };
          break;

        // Crane: vertical movement
        case 'crane':
          pos = {
            x: 0,
            y: 1.5 + t * 2,
            z: maxDistance - t * (maxDistance - minDistance) * 0.5
          };
          break;

        // Subtle orbit: slow circular movement
        case 'subtle-orbit':
          const subtleRadius = (minDistance + maxDistance) * 0.5;
          pos = {
            x: Math.cos(t * Math.PI) * subtleRadius * 0.3,
            y: 1.5,
            z: maxDistance - t * (maxDistance - minDistance) * 0.3
          };
          break;

        // Jerky dolly: unpredictable movement
        case 'jerky-dolly':
          const jerkiness = Math.sin(t * Math.PI * 4) * 0.3;
          pos = {
            x: jerkiness,
            y: 1.5 + jerkiness * 0.2,
            z: maxDistance - t * (maxDistance - minDistance) + jerkiness
          };
          break;

        // Quick dolly: fast movement
        case 'quick-dolly':
          pos = {
            x: 0,
            y: 1.5,
            z: maxDistance - Math.pow(t, 1.5) * (maxDistance - minDistance)
          };
          break;

        default:
          pos = {
            x: 0,
            y: 1.5,
            z: (minDistance + maxDistance) * 0.5
          };
      }

      positions.push(pos);
    }

    return positions;
  }

  /**
   * Generate camera rotations (look-at angles) over time
   */
  private static generateRotations(
    movementType: string,
    frameCount: number,
    vision: DirectorialVision
  ): Array<{ x: number; y: number; z: number; w: number }> {
    const rotations: Array<{ x: number; y: number; z: number; w: number }> = [];

    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      let rotation: { x: number; y: number; z: number; w: number };

      switch (movementType) {
        // Orbit: look toward center
        case 'orbit':
          const orbitAngle = t * Math.PI * 2;
          rotation = this.eulerToQuaternion(0, orbitAngle, 0);
          break;

        // Pan: horizontal rotation
        case 'pan':
          const panAngle = Math.sin(t * Math.PI) * 0.3;
          rotation = this.eulerToQuaternion(0, panAngle, 0);
          break;

        // Tilt: vertical rotation
        case 'tilt':
          const tiltAngle = Math.sin(t * Math.PI) * 0.2;
          rotation = this.eulerToQuaternion(tiltAngle, 0, 0);
          break;

        // Handheld: random jittery rotation
        case 'handheld':
        case 'handheld-shake':
          const jitterX = (Math.random() - 0.5) * 0.1;
          const jitterY = (Math.random() - 0.5) * 0.1;
          rotation = this.eulerToQuaternion(jitterX, jitterY, 0);
          break;

        // Subtle orbit: slow look-around
        case 'subtle-orbit':
          const subtleAngle = Math.sin(t * Math.PI) * 0.15;
          rotation = this.eulerToQuaternion(0, subtleAngle, 0);
          break;

        // Jerky dolly: sudden rotations
        case 'jerky-dolly':
          const jerkyAngle = Math.sin(t * Math.PI * 4) * 0.2;
          rotation = this.eulerToQuaternion(0, jerkyAngle, 0);
          break;

        // Default: minimal rotation
        default:
          rotation = { x: 0, y: 0, z: 0, w: 1 };
      }

      rotations.push(rotation);
    }

    return rotations;
  }

  /**
   * Generate focal lengths (zoom) over time
   */
  private static generateFocalLengths(
    movementType: string,
    frameCount: number,
    vision: DirectorialVision,
    constraints: CameraTrajectoryParams['constraints']
  ): number[] {
    const focalLengths: number[] = [];
    const baseFL = 35; // Standard focal length

    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      let fl: number;

      switch (movementType) {
        // Dolly-in: zoom in slightly
        case 'slow-dolly':
        case 'fast-dolly':
          fl = baseFL + t * 10;
          break;

        // Sweeping dolly: dramatic zoom
        case 'sweeping-dolly':
          fl = baseFL + Math.pow(t, 1.2) * 15;
          break;

        // Orbit: maintain focal length
        case 'orbit':
        case 'subtle-orbit':
          fl = baseFL;
          break;

        // Tracking: slight zoom variation
        case 'tracking':
          fl = baseFL + Math.sin(t * Math.PI) * 5;
          break;

        // Handheld: variable focal length
        case 'handheld':
        case 'handheld-shake':
          fl = baseFL + (Math.random() - 0.5) * 8;
          break;

        // Crane: maintain focal length
        case 'crane':
          fl = baseFL;
          break;

        // Pan/Tilt: maintain focal length
        case 'pan':
        case 'tilt':
          fl = baseFL;
          break;

        // Jerky dolly: sudden zoom changes
        case 'jerky-dolly':
          fl = baseFL + Math.sin(t * Math.PI * 4) * 8;
          break;

        // Quick dolly: rapid zoom
        case 'quick-dolly':
          fl = baseFL + Math.pow(t, 2) * 12;
          break;

        default:
          fl = baseFL;
      }

      focalLengths.push(Math.max(24, Math.min(200, fl))); // Clamp to realistic range
    }

    return focalLengths;
  }

  /**
   * Calculate focus distance based on movement type
   */
  private static calculateFocusDistance(
    movementType: string,
    constraints: CameraTrajectoryParams['constraints']
  ): number {
    const { minDistance, maxDistance } = constraints;

    switch (movementType) {
      // Close focus for intimate shots
      case 'slow-dolly':
      case 'subtle-orbit':
        return minDistance + (maxDistance - minDistance) * 0.3;

      // Medium focus for balanced shots
      case 'orbit':
      case 'tracking':
      case 'pan':
        return (minDistance + maxDistance) * 0.5;

      // Far focus for wide shots
      case 'sweeping-dolly':
      case 'crane':
      case 'fast-dolly':
        return maxDistance * 0.8;

      // Variable focus for handheld
      case 'handheld':
      case 'handheld-shake':
        return (minDistance + maxDistance) * 0.5;

      default:
        return (minDistance + maxDistance) * 0.5;
    }
  }

  /**
   * Calculate aperture (depth of field) based on genre and vision
   */
  private static calculateAperture(genre: string, vision: DirectorialVision): number {
    switch (genre) {
      // Shallow DOF for intimate drama
      case 'drama':
      case 'romance':
        return 2.0;

      // Medium DOF for balanced shots
      case 'comedy':
      case 'thriller':
        return 4.0;

      // Deep DOF for environmental shots
      case 'action':
      case 'sci-fi':
        return 5.6;

      // Variable DOF for horror
      case 'horror':
        return 2.8;

      default:
        return 4.0;
    }
  }

  /**
   * Convert Euler angles to quaternion
   */
  private static eulerToQuaternion(
    x: number,
    y: number,
    z: number
  ): { x: number; y: number; z: number; w: number } {
    // Simplified Euler to quaternion conversion
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cp = Math.cos(x * 0.5);
    const sp = Math.sin(x * 0.5);
    const cr = Math.cos(z * 0.5);
    const sr = Math.sin(z * 0.5);

    return {
      w: cr * cp * cy + sr * sp * sy,
      x: sr * cp * cy - cr * sp * sy,
      y: cr * sp * cy + sr * cp * sy,
      z: cr * cp * sy - sr * sp * cy
    };
  }

  /**
   * Get human-readable description of movement type
   */
  private static getMovementDescription(movementType: string): string {
    const descriptions: Record<string, string> = {
      'slow-dolly': 'Slow dolly-in with subtle height variation',
      'fast-dolly': 'Fast dolly-in for dynamic energy',
      'sweeping-dolly': 'Sweeping dolly with dramatic zoom',
      'orbit': 'Circular orbit around subject',
      'subtle-orbit': 'Subtle orbit with dolly-in',
      'tracking': 'Sideways tracking shot',
      'handheld': 'Handheld camera with organic jitter',
      'handheld-shake': 'Handheld with pronounced shake for tension',
      'pan': 'Horizontal pan across scene',
      'tilt': 'Vertical tilt movement',
      'crane': 'Vertical crane movement upward',
      'jerky-dolly': 'Jerky dolly with unpredictable movement',
      'quick-dolly': 'Quick dolly for punchy energy'
    };

    return descriptions[movementType] || 'Standard camera movement';
  }
}

export default GenDoPIntegration;
