import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";
import { findBestVoice } from "../lib/elevenlabs";

/**
 * 👤 Character Generation Agent
 * Purpose: Synthesizes high-fidelity character descriptions and visual seeds.
 */
export const generateCharacterDNA = internalAction({
  args: {
    bookId: v.id("books"),
    characterName: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.bookId;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY || "";

    await logger.info(`👤 Character: Performing AI Archetype Synthesis for ${args.characterName}...`, traceId);

    // 🚀 LIVE CHARACTER SYNTHESIS: Grounded in 'Timeless' Research
    const dna = await runNvidiaChat(
      [{
        role: "user",
        content: `NAME: ${args.characterName}\nDESCRIPTION: ${args.description}`
      }],
      {
        traceId,
        systemPrompt: `You are a Master Character Designer specializing in 'Timeless' Cinema. 
        Research Reference: melinamorry.com, dejareviewer.com, Cowan Film Societies. 
        
        MISSION: Synthesize a multidimensional character DNA using 11 PROVEN STRATEGIES:
        1. LIKEABILITY: Infuse small acts of kindness or traits that endear them instantly.
        2. RELATABILITY: Tap into universal emotions (love, loss, ambition).
        3. DRIVING PURPOSE: Define a clear, compelling goal/motivation.
        4. ACTIVE AGENCY: Ensure they make decisions, take risks, and face consequences.
        5. GROWTH CHALLENGES: Architect obstacles that force evolution and create tension.
        6. HUMAN FLAWS: Embrace imperfections (arrogance, insecurity) to add authenticity.
        7. DISTINCTIVENESS: Assign unique quirks, hobbies, or visual "pop" details.
        8. 3D PERSONA: Develop a rich backstory and internal conflicts.
        9. TRANSFORMATION: Plot a meaningful change/learning arc by the story's end.
        10. CONSISTENCY: Ensure growth feels natural and true to their core essence.
        11. REAL-WORLD COMPLEXITY: Infuse human-like nuances observed from real life.
        
        OUTPUT FORMAT (JSON ONLY): 
        { 
          "archetype": "...", 
          "likeabilityFactor": "...",
          "relatability": { "universalEmotions": "...", "flaws": "...", "strengths": "..." },
          "motivation": { "drivingGoal": "...", "activePurpose": "..." },
          "arcPotential": "Detailed transformation arc from start to finish.",
          "complexity": { "multidimensionalTraits": "...", "internalConflicts": "...", "backstory": "..." },
          "distinctiveFeatures": { "quirks": "...", "visualAnchor": "...", "uniqueness": "..." },
          "consistencyNote": "Core essence that remains stable.",
          "latentSeed": 12345, 
          "voiceArchetype": {
            "gender": "male" | "female" | "non-binary",
            "age": "child" | "young" | "middle-aged" | "old",
            "accent": "...",
            "tone": "...",
            "stability": 0.5,
            "similarity_boost": 0.75
          }
        }`,
        responseFormat: "json_object"
      }
    ) as any;

    // 🎙️ SOVEREIGN VOICE PROVISIONING
    if (elevenLabsKey && dna.voiceArchetype) {
      const voiceId = await findBestVoice(elevenLabsKey, dna.voiceArchetype);
      if (voiceId) {
        dna.voiceId = voiceId;
        await logger.info(`🎙️ Character: Voice matched [${voiceId}] for ${args.characterName}`, traceId);
      } else {
        await logger.warn(`⚠️ Character: No semantic voice match found for ${args.characterName}. Using account default.`, traceId);
      }
    }

    await ctx.runMutation(internalAny.studio.updateCharacterInternal, {
      bookId: args.bookId,
      name: args.characterName,
      dna,
    });

    await logger.info(`✅ Character: DNA synthesized for ${args.characterName}. Seed: ${dna.latentSeed}`, traceId);
    return dna;
  },
});
