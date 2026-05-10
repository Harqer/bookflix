import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 🦙 Llama Scripter (NVIDIA NIM)
 * Purpose: Technical script generation (Python/C++) for Maya/Unreal automation.
 */
export const generateTechnicalScript = internalAction({
  args: {
    intent: v.string(),
    platform: v.string(), // "maya", "unreal"
    sceneId: v.id("videoScenes"),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info(`🦙 Llama Scripter: Generating ${args.platform} automation for intent: ${args.intent}`, traceId);

    const systemPrompt = `You are a Sovereign Chapter Production Architect. 
    For the provided Chapter Intent, generate a multi-track JSON PRODUCTION DECK.
    
    DECK STRUCTURE:
    - vfx_track: [{ frame, effect, intensity, usd_anchor }]
    - audio_track: { 
        theme: "string", 
        sfx_cues: ["string"], 
        symphonic_mood: "string", 
        voice_id: "string (ElevenLabs ID or null. DO NOT hallucinate. Leave null if not explicitly known.)", 
        voice_description: "string (e.g., Deep, gravelly male, 50s)" 
      }
    - camera_track: [{ frame, x, y, z, focal_length, aperture, movement_type }]
    - pacing_logic: { fps: number, rhythm_target: string, emotional_weight: number, total_duration: number }
    - environment_state: { lighting_setup: string, time_of_day: string, weather_usd_params: object }

    Return ONLY the raw JSON object. No conversational text.`;

    const script = await runNvidiaChat(
      [{ role: "user", content: args.intent }],
      { 
        traceId, 
        systemPrompt,
        responseFormat: "json_object"
      }
    );

    await logger.info(`✅ Llama Scripter: ${args.platform} script generated`, traceId);
    return { script };
  },
});
