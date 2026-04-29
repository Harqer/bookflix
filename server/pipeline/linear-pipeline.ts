import { LightingEngine } from "./director/lighting-engine";
import { VisionEngine } from "./director/vision-engine";

/**
 * 🎞️ Master Cinematic Pipeline (The Linear Sequence)
 * Orchestrates the flow from Manuscript -> Analysis -> Lighting -> Vision -> Render
 */

export class CinematicPipeline {
  private lighting: LightingEngine;
  private vision: VisionEngine;

  constructor() {
    this.lighting = new LightingEngine();
    this.vision = new VisionEngine();
  }

  async processChapter(chapterTitle: string, screenplay: string, tone: string, bookId: string) {
    try {
      console.log(`🎬 Pipeline: Processing Chapter - ${chapterTitle}`);
      
      // 1. Vision: Synthesize the Set and Camera
      // 🚀 2026 Strategy: Integration with NIF-Personal LLM if enabled
      const layout = await this.vision.synthesizeSpatialLayout(screenplay);
      if (!layout) throw new Error(`Vision synthesis failed for ${chapterTitle}`);

      // 2. Lighting: Apply high-fidelity ray-tracing
      const lightingMap = await this.lighting.calculateSceneLighting(screenplay, tone);
      if (!lightingMap) throw new Error(`Lighting calculation failed for ${chapterTitle}`);

      // 3. Final Orchestration
      console.log(`✅ Pipeline Complete: ${chapterTitle} is ready for Cloud Rendering.`);
      
      return {
        layout,
        lightingMap,
        status: "ready_to_render",
        timestamp: Date.now(),
        bookId
      };
    } catch (err) {
      console.error(`❌ Pipeline Crash on ${chapterTitle}:`, err);
      return {
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown Error",
        chapterTitle
      };
    }
  }
}
