import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 🛰️ Sovereign Director Agent (Master Key Edition)
 * Purpose: Narrative-to-Technical Manifest Conductor.
 * Rigor: Barua (Semiotic Depth), Cowan (Authorial Co-Authorship), Stine (Cybernetic Motion).
 */
export const orchestrateChapterProduction = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    screenplay: v.string(),
    dna: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.chapterId;
    await logger.info("🛰️ Director: Synthesizing 'Timeless' Master Brief...", traceId);

    const systemPrompt = `You are a Sovereign Cinematic Director. 
    Your mission is to perform a 'Dissection of Meaning' (Logos gives Likeness).
    
    DIRECTORIAL KEYS:
    - SEMIOTIC RIGOR: Use lens choice and light-density as 'Couriers of Truth.' 
    - ARTISTIC VULNERABILITY: Adhere to 'Mficha uchi hazai'—bare the soul of the scene. Allow underexposure or raw texture if it serves the narrative essence.
    - STAGING IN DEPTH: Mandate 'Profondeur de champ.' Use multiple planes of action to create drama without montage.
    - CYBERNETIC MOTION: Treat the camera as a 'Light Lathe' (An Iron Hand carving light).
    
    ### SCREENPLAY: ${args.screenplay}
    ### ATMOSPHERIC DNA: ${JSON.stringify(args.dna)}
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "thematicEssence": "string",
      "narrativeIntent": "A one-sentence summary of the directorial goal for this scene.",
      "stagingStrategy": "multi_plane_depth",
      "lightingPhilosophy": "soft_bounce_naturalism",
      "vulnerabilityLevel": "raw_truth",
      "technicalDirectives": {
         "opticalCharacter": "uncoated_refraction",
         "motionLogic": "isomorphic_grounding",
         "movementTechnique": "three_stage_track"
      }
    }`;

    // 🛰️ Calling Sovereign AI Service for Technical Scoping
    const brief = await runNvidiaChat(
      [{ role: "user", content: "GENERATE MASTER PRODUCTION BRIEF" }],
      { 
        traceId, 
        systemPrompt,
        responseFormat: "json_object"
      }
    );

    await logger.info("✅ Director: Master 'Timeless' Brief Synthesized.", traceId);
    return brief;
  },
});
