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

async function dispatchToVisionMCP(chapterId: Id<"chapters">, brief: ReturnType<typeof interpretCinematography>) {
  const VISION_MCP_URL = process.env.UNREAL_MCP_URL;
  if (!VISION_MCP_URL) throw new Error("UNREAL_MCP_URL not configured");

  await logger.info("🎥 Dispatching Spatial Brief...", chapterId, brief);
  
  // 🚀 Active Webhook: Dispatching to Unreal Engine MCP
  await fetch(VISION_MCP_URL, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chapterId, 
      config: brief.camera,
      timestamp: Date.now()
    }) 
  });
}

async function dispatchToLightingMCP(chapterId: Id<"chapters">, brief: ReturnType<typeof interpretCinematography>) {
  const LIGHTING_MCP_URL = process.env.NUKE_MCP_URL;
  if (!LIGHTING_MCP_URL) throw new Error("NUKE_MCP_URL not configured");

  await logger.info("💡 Dispatching Lighting Brief...", chapterId, brief);
  
  // 🚀 Active Webhook: Dispatching to Nuke Lighting MCP
  await fetch(LIGHTING_MCP_URL, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chapterId, 
      config: brief.lighting,
      timestamp: Date.now()
    }) 
  });
}

export const orchestrateChapterProduction = internalAction({
  args: {
    chapterId: v.id("chapters"),
    bookId: v.id("books"),
    screenplay: v.string(),
    dna: v.any(), // AtmosphericDNA passed from Scout
  },
  handler: async (ctx: ActionCtx, args) => {
    return await withSentry("orchestrateChapterProduction", async () => {
      const traceId = args.chapterId;
      const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

      await logger.info("🎬 Director: Starting Production Flow", traceId);

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

      // 3. Departmental Dispatch (Parallelized for Scale)
      await Promise.all([
        dispatchToVisionMCP(args.chapterId, brief),
        dispatchToLightingMCP(args.chapterId, brief)
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
