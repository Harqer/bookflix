import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";
import { DeepgramClient } from "@deepgram/sdk";
import { uploadToStorage } from "../lib/storage";

/**
 * 🎙️ Deepgram Transcription Orchestrator
 * Purpose: Generates high-fidelity cinematic captions using Deepgram Aura.
 * Output: VTT file uploaded to Sovereign Storage.
 */
export const generateCaptions = internalAction({
  args: {
    sceneId: v.id("videoScenes"),
    audioUrl: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("🎙️ Deepgram: Generating cinematic captions...", traceId);
    
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramKey) {
      await logger.error("❌ Deepgram: API key missing.", traceId);
      throw new Error("DEEPGRAM_API_KEY not found in environment.");
    }

    const deepgram = new DeepgramClient({ apiKey: deepgramKey });

    try {
      // 1. Dispatch Transcription Job
      const result: any = await deepgram.listen.v1.media.transcribeUrl(
        { 
          url: args.audioUrl,
          model: "nova-2",
          smart_format: true,
          utterances: true,
          punctuate: true,
        }
      );

      // 2. Format as WebVTT
      let vttContent = "WEBVTT\n\n";
      const utterances = result.results?.utterances || [];
      
      for (const utterance of utterances) {
        const start = formatVttTime(utterance.start);
        const end = formatVttTime(utterance.end);
        vttContent += `${start} --> ${end}\n${utterance.transcript}\n\n`;
      }

      // 3. Upload to Sovereign Storage
      const fileName = `captions_${args.sceneId}.vtt`;
      const captionUrl = await uploadToStorage(
        Buffer.from(vttContent),
        fileName,
        "text/vtt",
        "captions"
      );

      // 4. Update Scene Metadata
      await ctx.runMutation(internalAny.studio.updateSceneMetadataInternal, {
        sceneId: args.sceneId,
        startTime: 0,
        endTime: result.metadata?.duration || 0,
        captionUrl: captionUrl,
      });

      await logger.info(`✅ Deepgram: Captions live at ${captionUrl}`, traceId);
      return { status: "complete", captionUrl, duration: result.metadata?.duration || 0 };

    } catch (err) {
      await logger.error("❌ Deepgram: Transcription Failed", traceId, { error: String(err) });
      throw err;
    }
  },
});

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
