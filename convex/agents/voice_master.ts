"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { uploadToStorage } from "../lib/storage";
import { logger } from "../lib/observability";

/**
 * 🎙️ Voice & Caption Master (ElevenLabs)
 * Generates narrative voiceovers and perfectly timed cinematic captions.
 */
export const generateVoiceAndCaptions = internalAction({
  args: {
    sceneId: v.id("videoScenes"),
    text: v.string(),
    voiceId: v.optional(v.string()), 
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsKey) {
      await logger.error("❌ Voice: ELEVENLABS_API_KEY missing. Audio generation skipped.", traceId);
      throw new Error("ELEVENLABS_API_KEY is required for production voiceovers.");
    }

    const targetModel = args.modelId || "eleven_v3"; // Default to V3 for high fidelity
    await logger.info(`🎙️ Voice: Dispatching narration task [${targetModel}]...`, traceId);

    const audioDispatcherUrl = process.env.AUDIO_DISPATCHER_URL;
    let audioUrl: string | null = null;

    try {
      // 🚀 PHASE 1: Attempt Private Cluster (Sovereign Harmonic Fleet)
      if (!audioDispatcherUrl) throw new Error("Cluster URL not provisioned.");

      const response = await fetch(`${audioDispatcherUrl}/dispatch/audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GPU-Cluster-Secret": process.env.GPU_CLUSTER_SECRET || "",
        },
        body: JSON.stringify({
          sceneId: args.sceneId,
          type: "dialogue",
          content: args.text,
          config: {
            voiceId: args.voiceId || "pNInz6obpg8ndPuo7HZZ",
            model: targetModel
          }
        }),
      });

      if (!response.ok) throw new Error("Cluster restricted or offline.");
      
      const data = await response.json();
      audioUrl = data.audio_url;

    } catch (err) {
    // 🛡️ PHASE 2: Fallback to Direct Sovereign Dispatch (ElevenLabs API)
    await logger.info("⚠️ Voice: Cluster limited. Pivoting to Direct Sovereign Dispatch...", traceId);
    
    // 🛰️ DYNAMIC AWARENESS: Fetch current models and voices
    const getSovereignAssets = async () => {
      try {
        const [modelsRes, voicesRes] = await Promise.all([
          fetch("https://api.elevenlabs.io/v1/models", { headers: { "xi-api-key": elevenLabsKey } }),
          fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": elevenLabsKey } })
        ]);
        
        const models = modelsRes.ok ? await modelsRes.json() : [];
        const { voices } = voicesRes.ok ? await voicesRes.json() : { voices: [] };
        
        return { models, voices };
      } catch (e) {
        return { models: [], voices: [] };
      }
    };

    const { models, voices } = await getSovereignAssets();
    
    // 🎯 SMART MATCHING: Find the best voice and model
    const findBestFit = () => {
      // 1. Select Model (Prefer V3 -> Turbo 2.5 -> Multilingual V2)
      const modelPriority = ["eleven_v3", "eleven_turbo_v2_5", "eleven_multilingual_v2"];
      const bestModel = models.find(m => modelPriority.includes(m.model_id))?.model_id || "eleven_multilingual_v2";
      
      // 2. Select Voice
      let selectedVoiceId = args.voiceId;
      
      if (!selectedVoiceId || !voices.some(v => v.voice_id === selectedVoiceId)) {
        // Try to match by name or pick a high-quality default
        const fallbackVoice = voices.find(v => v.category === "professional") || voices[0];
        selectedVoiceId = fallbackVoice?.voice_id || "pNInz6obpg8ndPuo7HZZ";
        
        if (fallbackVoice) {
           logger.info(`🎯 Auto-matched voice: [${fallbackVoice.name}]`, traceId);
        }
      }
      
      return { modelId: bestModel, voiceId: selectedVoiceId };
    };

    const { modelId, voiceId } = findBestFit();

    const tryGenerate = async (vId: string, mId: string) => {
      if (!vId) throw new Error("No voice ID provided for synthesis.");
      return await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vId}`, {
        method: "POST",
        headers: {
          "xi-api-key": elevenLabsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: args.text,
          model_id: mId,
          voice_settings: { 
            stability: 0.5, 
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });
    };

    let elevenResponse = await tryGenerate(voiceId, modelId);

    if (!elevenResponse.ok) {
      const errorText = await elevenResponse.text();
      await logger.error(`🆘 Direct ElevenLabs Fallback Failed`, traceId, { status: elevenResponse.status, error: errorText });
      throw new Error(`Direct ElevenLabs Fallback Failed: ${errorText}`);
    }

    const audioBuffer = await elevenResponse.arrayBuffer();
    const fileName = `narration_${args.sceneId}.mp3`;
    audioUrl = await uploadToStorage(Buffer.from(audioBuffer), fileName, "audio/mpeg", "audio");
    }

    // 🚀 PHASE 3: Generate Captions (Deepgram Sync)
    const { captionUrl, duration } = await ctx.runAction(internalAny.agents.deepgram_orchestrator.generateCaptions, {
      sceneId: args.sceneId,
      audioUrl: audioUrl!,
    });

    await logger.info(`✅ Voice: Narration and captions complete`, traceId, { audioUrl, captionUrl });

    return { audioUrl, captionUrl, duration };
  },
});

/**
 * 🎵 Ambient Audio Master (ElevenLabs)
 * Generates Score and Foley (SFX) using the latest ElevenLabs generative APIs.
 */
export const generateAmbientAudio = internalAction({
  args: {
    sceneId: v.id("videoScenes"),
    prompt: v.string(),
    type: v.union(v.literal("score"), v.literal("foley")),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    const audioDispatcherUrl = process.env.AUDIO_DISPATCHER_URL;

    if (!audioDispatcherUrl) {
      await logger.error("❌ Ambient: Cluster URL missing.", traceId);
      throw new Error("AUDIO_DISPATCHER_URL is required for ambient synthesis.");
    }

    await logger.info(`🎵 Ambient: Dispatching ${args.type} generation...`, traceId);

    const response = await fetch(`${audioDispatcherUrl}/dispatch/audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GPU-Cluster-Secret": process.env.GPU_CLUSTER_SECRET || "",
      },
      body: JSON.stringify({
        sceneId: args.sceneId,
        type: args.type,
        content: args.prompt,
        config: {
          duration: args.duration || (args.type === "score" ? 15 : 5)
        }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      await logger.error(`❌ Ambient: Cluster dispatch failed: ${err}`, traceId);
      throw new Error(`Ambient Dispatch Failed: ${err}`);
    }

    const data = await response.json();
    await logger.info(`✅ Ambient: ${args.type} generated successfully`, traceId, { audioUrl: data.audio_url });

    return data;
  },
});

