import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 📝 Outliner Agent
 * Purpose: Breaks down chapters into cinematic scenes with structural coherence.
 */
export const planChapterOutline = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    text: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.chapterId;
    await logger.info("📝 Outliner: Planning chapter structure...", traceId);

    // 🧠 Structural Analysis: Ingesting actual chapter text via NVIDIA NIM
    const scenes = await runNvidiaChat(
      [{
        role: "user",
        content: args.text
      }],
      {
        traceId,
        systemPrompt: `You are a Master Film Editor and Narrative Outliner. Break down the provided chapter text into a list of cinematic scenes. Each scene must have a high-impact title and a detailed visual/narrative description. OUTPUT FORMAT (JSON ARRAY ONLY): [{ "title": "Scene Title", "description": "Visual and narrative summary" }]`,
        responseFormat: "json_object"
      }
    );

    await logger.info(`✅ Outliner: Chapter analyzed into ${scenes.length} real scenes.`, traceId);
    return scenes;
  },
});
