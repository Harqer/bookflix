import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 📚 LibreScholar Authoring Agent (The Master Brain)
 * Purpose: Expands simple user seeds into multi-chapter narrative universes.
 */
export const expandSeedToUniverse = internalAction({
  args: {
    seed: v.string(),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const traceId = args.bookId;
    await logger.info("📚 LibreScholar: Authoring Universe from Seed...", traceId);

    const systemPrompt = `You are the LibreScholar Master Author. 
    Expand the user's narrative seed into a multi-dimensional cinematic universe.
    
    AESTHETIC MANDATE:
    - Eschew "Cinematic" clichés and generic "Atmospheric" labels. 
    - Synthesize a unique, groundbreaking visual and narrative DNA for this specific seed.
    - Define a custom "Authorial DNA" that acts as the thematic foundation for the entire production.
    
    REQUIRED OUTPUT (JSON ONLY):
    {
      "summary": "Unique narrative overview",
      "theme": "Groundbreaking psychological/social anchor",
      "mood": "Specific, non-generic emotional atmosphere",
      "texture": "Unique visual DNA (e.g., Oxidized Velvet, Fractured Glass)",
      "era": "Custom temporal setting",
      "authorialDNA": "Thematic essence grounded in unique cinematic theory",
      "chapters": [{ "title": "string", "summary": "string" }]
    }`;

    const universe = await runNvidiaChat(
      [{ role: "user", content: args.seed }],
      { 
        traceId, 
        systemPrompt,
        responseFormat: "json_object"
      }
    );

    await logger.info("✅ LibreScholar: Universe Authored Successfully", traceId);
    return universe;
  },
});
