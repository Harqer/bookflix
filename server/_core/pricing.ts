/**
 * 🪙 2026 Studio Credit & Token Model (Veo/Runway Style)
 * Everything is unlocked. Cost is determined by complexity.
 */

export const CREDIT_COSTS = {
  BASE_4D_EVOLUTION: 1,      // 1 credit per second
  COMFYUI_FINISHER: 2,       // +2 credits per second
  HOUDINI_SIM: 5,           // +5 credits per second
  MAYA_ANIMATION: 3,         // +3 credits per second
  UNREAL_VP_RENDER: 4,       // +4 credits per second
  
  // Resolution Multipliers
  RESOLUTION_1080P: 1,
  RESOLUTION_4K: 2,
  RESOLUTION_8K: 5
};

/**
 * Task: Calculate Total Job Cost (Atomic)
 */
export function calculateTotalCost(durationSeconds: number, features: string[], resolution: string): number {
  let costPerSecond = CREDIT_COSTS.BASE_4D_EVOLUTION;
  
  if (features.includes('comfyui')) costPerSecond += CREDIT_COSTS.COMFYUI_FINISHER;
  if (features.includes('houdini')) costPerSecond += CREDIT_COSTS.HOUDINI_SIM;
  if (features.includes('maya')) costPerSecond += CREDIT_COSTS.MAYA_ANIMATION;
  if (features.includes('unreal')) costPerSecond += CREDIT_COSTS.UNREAL_VP_RENDER;
  
  let resolutionMultiplier = 1;
  if (resolution === '4K') resolutionMultiplier = CREDIT_COSTS.RESOLUTION_4K;
  if (resolution === '8K') resolutionMultiplier = CREDIT_COSTS.RESOLUTION_8K;
  
  return Math.ceil(durationSeconds * costPerSecond * resolutionMultiplier);
}
