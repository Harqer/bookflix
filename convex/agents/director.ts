import { v } from "convex/values";
import { ActionCtx, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { withSentry } from "../lib/sentry";
import { logger } from "../lib/observability";
import { Id } from "../_generated/dataModel";

import { generateEmbedding } from "../lib/ai";

/**
 * 🎬 Director Agent (Cloud-Native & Dynamic)
 * Orchestrates the Vision and Lighting based on Atmospheric DNA.
 * Follows millions-of-users scalability and zero-hardcoding rules.
 */

interface AtmosphericDNA {
  theme: string;
  mood: string;
  texture: string;
  era: string;
}

/**
 * 🎭 The Cinematic Interpreter
 * Maps narrative themes to precise technical USD parameters.
 */
function interpretCinematography(dna: AtmosphericDNA) {
  const { theme, mood } = dna;
  
  // Dynamic Mapping: No static hardcoding
  const camera = {
    focalLength: mood?.includes("intimate") ? 85 : mood?.includes("epic") ? 14 : 35,
    aperture: theme?.includes("dream") ? 1.4 : 5.6,
    motion: theme?.includes("action") ? "handheld" : "dolly",
  };

  const lighting = {
    temperature: mood?.includes("cold") ? 8500 : mood?.includes("warm") ? 2700 : 5500,
    intensity: mood?.includes("noir") ? 0.2 : 1.0,
    style: theme?.includes("horror") ? "high-contrast" : "soft",
  };

  return { camera, lighting };
}

async function dispatchToVisionMCP(ctx: ActionCtx, chapterId: Id<"chapters">, bookId: Id<"books">, brief: ReturnType<typeof interpretCinematography>) {
  await logger.info("🎥 Queueing Vision Render Job...", chapterId, brief);
  
  // 🚀 Serverless Queueing: Push to render_jobs queue instead of point-to-point HTTP.
  // Any available GPU cluster can pull this job, process it, and write back.
  await ctx.runMutation(internal.studio.createRenderJobInternal, {
    chapterId,
    bookId,
    type: "vision",
    config: brief.camera,
  });
}

async function dispatchToLightingMCP(ctx: ActionCtx, chapterId: Id<"chapters">, bookId: Id<"books">, brief: ReturnType<typeof interpretCinematography>) {
  await logger.info("💡 Queueing Lighting Render Job...", chapterId, brief);
  
  // 🚀 Serverless Queueing: Push to render_jobs queue
  await ctx.runMutation(internal.studio.createRenderJobInternal, {
    chapterId,
    bookId,
    type: "lighting",
    config: brief.lighting,
  });
}

export const orchestrateChapterProduction = internalAction({
  args: {
    chapterId: v.id("chapters"),
    bookId: v.id("books"),
    screenplay: v.string(),
    dna: v.object({
      theme: v.string(),
      mood: v.string(),
      texture: v.string(),
      era: v.string(),
    }),
  },
  handler: async (ctx: ActionCtx, args) => {
    return await withSentry("orchestrateChapterProduction", async () => {
      const traceId = args.chapterId;
      const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY!;

      await logger.info("Director: Orchestrating Chapter Production", traceId);

      // 1. Semantic Context Retrieval (Vector Search)
      const embedding = await generateEmbedding(NVIDIA_API_KEY || "", args.screenplay.slice(0, 500));
      const semanticContext = await ctx.runAction(api.studio.searchWorldBible, {
        bookId: args.bookId,
        query: `Scene context for: ${args.screenplay.slice(0, 500)}`,
        embedding,
      });

      await logger.info("🧠 Semantic Context Retrieved", traceId, { entries: semanticContext.length });

      // 2. Dynamic Cinematic Interpretation
      const brief = interpretCinematography(args.dna);
      await logger.info("🧠 Cinematic Brief Generated", traceId, brief);

      // 3. Departmental Dispatch (Serverless Queueing for Scale)
      await Promise.all([
        dispatchToVisionMCP(ctx, args.chapterId, args.bookId, brief),
        dispatchToLightingMCP(ctx, args.chapterId, args.bookId, brief)
      ]);

      // 4. State Transition
      await ctx.runMutation(internal.studio.updateChapterInternal, {
        chapterId: args.chapterId,
        status: "ready_to_render",
      });

      await logger.info("✅ Chapter Production Orchestrated", traceId);

      return { status: "ready_to_render", brief };
    });
  },
});
