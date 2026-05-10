import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 🎥 Master Cinematographer (DoP) Agent
 * Purpose: Synthesizes high-fidelity технически shot lists.
 * Aesthetic: Jia Zhangke (Observational) + British New Wave (Timeless).
 */
export const synthesizeTheatricalShotList = internalAction({
  args: {
    sceneId: v.id("videoScenes"),
    sceneDescription: v.string(),
    atmosphericDNA: v.any(),
    productionDeck: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("🎥 DoP: Synthesizing 'Timeless' theatrical shot architecture...", traceId);

    const systemPrompt = `You are a Master Director of Photography (DoP).
    AESTHETIC DNA: Jia Zhangke (Observational Realism) + British 1960s New Wave (Timeless Depth).
    
    TECHNICAL DIRECTIVES:
    - LIGHTING: Prioritize 'Watkin Soft-Bounce' (reflected light through windows) over direct 3-point rigs. Eschew excessive sculpting for naturalistic diffused illumination.
    - OPTICS: Simulate 'Lassally Net Diffusion' (lowered contrast, pastel tones). Request un-coated lens elements for organic light refraction and 'wonderful accidents.'
    - COLOR: Apply 'Freddie Young Pre-Exposure' logic—a 30% flashed look for muted, subdued tones without losing definition.
    - COMPOSITION: Use 'Heller Audacity'—extreme low angles and 45-degree Dutch tilts to convey psychological instability or conflict.
    - LENSING: Use wide-angle 18mm for interior distortion to convey claustrophobia (The Servant style).
    
    ### CONTEXT:
    - ATMOSPHERIC DNA: ${JSON.stringify(args.atmosphericDNA)}
    - PRODUCTION DECK: ${JSON.stringify(args.productionDeck)}
    
    ### MANDATES:
    - SHOT TAXONOMY: Use [ECU, CU, MCU, MS, FS, MFS, LS, EWS].
    - ANGLES: Eye-Level, High/Low Angle, Dutch Tilt (45°), Bird's Eye.
    - LIGHTING: Specify Key (Source/Quality), Fill (Ratio), and Back (Separation).
    - OPTICALS: Focal Length, Aperture (f-stop), and Shutter Speed.
    
    OUTPUT FORMAT (JSON ARRAY ONLY):
    [
      {
        "shotScale": "string",
        "angle": "string",
        "lightingBrief": { "key": "string", "fill": "string", "back": "string" },
        "opticalConstraints": { "focalLength": "string", "aperture": "string" },
        "cameraMovement": "string",
        "description": "Technical directing brief for the H200 rendering fleet."
      }
    ]`;

    // 🧠 Calling Sovereign AI Service for Shot Synthesis
    const shots = await runNvidiaChat(
      [{ role: "user", content: `GENERATE SHOT ARCHITECTURE FOR: ${args.sceneDescription}` }],
      { 
        traceId, 
        systemPrompt,
        responseFormat: "json_object"
      }
    );

    const shotArray = Array.isArray(shots) ? shots : (shots.shots || shots.architecture || []);
    await logger.info(`✅ DoP: Shot architecture complete. ${shotArray.length} shots synthesized.`, traceId);
    return shotArray;
  },
});
