"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * 🛰️ Sovereign Master Orchestrator (Full Firing Cycle)
 * Purpose: End-to-end conductor for a single scene production.
 * Quality Standard: 'Timeless Sovereign' (Grounded in British New Wave & 4K Mastery).
 */
export const orchestrateFullFiringCycle = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
    directorBrief: v.any(),
  },
  handler: async (ctx, args): Promise<void> => {
    const traceId = args.sceneId;
    const book = await ctx.runQuery(internal.studio.getBookInternal, { bookId: args.bookId });
    const productionMode = book?.productionMode || "movie";
    const targetDuration = productionMode === "movie" ? 3600 : 600; 

    await logger.info(`🛰️ Master: Starting Firing Cycle [${productionMode.toUpperCase()}]`, traceId);

    try {
      // 🚀 PHASE 1: Chapter Production Architecture (Smart Script)
      await logger.info("🏗️ Phase 1: Generating Technical Script...", traceId);
      const productionDeck = await ctx.runAction(internal.agents.llama_scripter.generateTechnicalScript, {
        intent: args.directorBrief.narrativeIntent || args.directorBrief.thematicEssence || "High-fidelity cinematic scene generation.",
        platform: "unreal",
        sceneId: args.sceneId,
      });

      // 🚀 PHASE 2: Kinematic Performance Sync (Cloud DiffuMan Fallback)
      const sceneDuration = productionDeck.script?.pacing_logic?.total_duration || 10;
      await logger.info(`🦴 Phase 2: Synchronizing Performance (${sceneDuration}s)...`, traceId);
      const motion = await ctx.runAction(internal.agents.kimodo_orchestrator.generateCharacterMotion, {
        sceneId: args.sceneId,
        prompt: args.directorBrief.narrativeIntent || args.directorBrief.thematicEssence || "Dynamic cinematic performance.",
        duration: sceneDuration, // Dynamic duration
        productionDeck: productionDeck.script,
      });

      // 🚀 PHASE 3: Visual DNA & Sovereign Consistency
      await logger.info("🎞️ Phase 3: Calibrating Visual Consistency...", traceId);
      await ctx.runAction(internal.agents.vimax_orchestrator.orchestrateLongformProduction, {
        bookId: args.bookId,
        chapterId: args.chapterId,
        targetDuration: sceneDuration,
        atmosphericDNA: args.directorBrief.dna || {},
        directorBrief: args.directorBrief,
        productionDeck: productionDeck.script,
      });

      // 🚀 PHASE 4: Master DoP Cinematography ('Timeless' British DNA)
      await logger.info("🎥 Phase 4: Planning 'Timeless' Cinematography...", traceId);
      const cinematography = await ctx.runAction(internal.agents.cinematographer.synthesizeTheatricalShotList, {
        sceneId: args.sceneId,
        sceneDescription: args.directorBrief.narrativeIntent || args.directorBrief.thematicEssence || "High-fidelity cinematic framing.",
        productionDeck: productionDeck.script,
        atmosphericDNA: args.directorBrief.dna || {},
      });

      // 🚀 PHASE 5: Symphonic Sync (Sovereign Cinematic Theory)
      await logger.info("🔊 Phase 5: Synchronizing Symphonic Audio...", traceId);
      await ctx.runAction(internal.agents.audio_director.orchestrateSymphonicAudio, {
        bookId: args.bookId,
        sceneId: args.sceneId,
        directorBrief: { 
          ...args.directorBrief, 
          genre: args.directorBrief.thematicEssence || "Cinematic",
          intensity: "high",
          mood: "atmospheric",
          targetDuration: sceneDuration 
        },
        productionDeck: productionDeck.script,
        text: args.directorBrief.narrativeIntent || args.directorBrief.thematicEssence || "Cinematic audio synthesis.",
      });

      // 🚀 PHASE 6: Theatrical Dispatch & Universal Quality Guardrail
      await logger.info("🛰️ Phase 6: Executing Theatrical Dispatch...", traceId);
      await ctx.runAction(internal.agents.nvidia_nim_bridge.dispatchFiringCycle, {
        bookId: args.bookId,
        chapterId: args.chapterId,
        sceneId: args.sceneId,
        payload: {
          qualityStandard: "timeless_sovereign", // 🛡️ Enforcing high-rigor fallback
          directorBrief: { 
            ...args.directorBrief, 
            targetDuration: sceneDuration,
            productionDeck: productionDeck.script,
            cinematography: cinematography, // 🎥 'Timeless' specs
          },
          automationScripts: productionDeck.script,
          motionAssets: motion,
          stages: ["unreal", "arnold", "nuke"],
        }
      });

      await logger.info("✅ Master: Full 6-Phase Scene Firing Cycle Dispatched", traceId);

    } catch (err) {
      await logger.error("❌ Master: Firing Cycle Failed", traceId, { error: String(err) });
      throw err;
    }
  },
});
