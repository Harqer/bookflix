import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 💡 Concept Generator Agent
 * Purpose: Transforms raw book text into high-level visual and thematic concepts.
 */
export const generateVisualConcepts = internalAction({
  args: {
    bookId: v.id("books"),
    text: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.bookId;
    await logger.info("💡 Concept: Generating visual themes from DNA...", traceId);

    const concepts = await runNvidiaChat(
      [{
        role: "user",
        content: `TEXT: ${args.text.substring(0, 5000)}`
      }],
      {
        traceId,
        systemPrompt: `You are a Visual Concept Artist. Analyze the provided text and extract a list of high-level visual and thematic concepts. OUTPUT FORMAT (JSON ARRAY ONLY): [{ "theme": "string", "intensity": 0.0-1.0 }]`,
        responseFormat: "json_object"
      }
    );

    return concepts;
  },
});
