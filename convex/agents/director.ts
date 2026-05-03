import { v } from "convex/values";
import { ActionCtx, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { withSentry } from "../lib/sentry";
import { logger } from "../lib/observability";
import { Id } from "../_generated/dataModel";

import { generateEmbedding } from "../lib/ai";
import { tracedFetch } from "../lib/langsmith";

/**
 * 🎬 Director Agent (Claude 3.5 Sonnet Edition)
 * Purpose: Narrative-to-Technical USD Orchestration.
 * Scaled: Powered by Upstash Redis for sub-millisecond brief caching.
 */

interface AtmosphericDNA {
  theme: string;
  mood: string;
  texture: string;
  era: string;
}

async function fetchClaudeCinematography(apiKey: string, screenplay: string, dna: AtmosphericDNA): Promise<any> {
  const url = "https://api.anthropic.com/v1/messages";
  
  const response = await tracedFetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `You are an Elite Cinematographer. Convert this screenplay into a Technical USD Manifest.
        DNA: ${JSON.stringify(dna)}
        Screenplay: ${screenplay}
        
        Return ONLY a JSON object with:
        {
          "camera": {"focalLength": 35, "aperture": 2.8, "motion": "static"},
          "lighting": {"temperature": 5500, "intensity": 1.0, "style": "soft"},
          "usdManifest": {"stages": [...]}
        }`
      }],
    })
  }, { agent: "director_claude" });

  const data = await response.json();
  const rawText = data.content[0].text;
  return JSON.parse(rawText);
}

// --- Redis Cache Utility (Upstash) ---
async function getRedisCache(key: string) {
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
  });
  const data = await response.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function setRedisCache(key: string, value: any) {
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`;
  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    body: JSON.stringify(value)
  });
}

async function dispatchToCosmosSynthesis(ctx: ActionCtx, chapterId: Id<"chapters">, bookId: Id<"books">, brief: any) {
  await logger.info("🌌 Queueing Cosmos Physical Synthesis Job...", chapterId, brief);
  
  // 🚀 Serverless Queueing: Dispatch to NVIDIA Cosmos 2.5
  // We pass the full USD Manifest to ensure the spatial generation matches the brief.
  await ctx.runMutation(internal.studio.createRenderJobInternal, {
    chapterId,
    bookId,
    type: "cosmos",
    config: {
      camera: brief.camera,
      lighting: brief.lighting,
      usd: brief.usdManifest
    },
  });
}

async function dispatchToLightingMCP(ctx: ActionCtx, chapterId: Id<"chapters">, bookId: Id<"books">, brief: any) {
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
      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

      await logger.info("Director: Orchestrating Chapter Production", traceId);

      // 1. 🛡️ Scalability: Sub-millisecond Redis Cache
      const cacheKey = `brief:${args.chapterId}`;
      const cachedBrief = await getRedisCache(cacheKey);

      if (cachedBrief) {
        await logger.info("♻️ Redis Cache Hit: Reusing Semantic Brief", traceId);
        return { status: "ready_to_render", brief: cachedBrief };
      }

      // 2. High-Fidelity Cinematography via Claude 3.5 Sonnet
      const brief = await fetchClaudeCinematography(ANTHROPIC_API_KEY, args.screenplay, args.dna);
      
      // 3. Cache the brief for serverless orchestrators (Unreal/Maya)
      // We use the chapterId as the screenplayHash for direct lookup
      await ctx.runMutation(internal.studio.cacheBriefInternal, {
        dna: args.dna,
        screenplayHash: args.chapterId, 
        brief,
      });

      await logger.info("🎬 Director: Scene Brief Generated & Cached", traceId);

      // 4. Departmental Dispatch (Serverless Queueing)
      await Promise.all([
        dispatchToCosmosSynthesis(ctx, args.chapterId, args.bookId, brief),
        dispatchToLightingMCP(ctx, args.chapterId, args.bookId, brief)
      ]);

      // 4. Persistence & Cache Update
      await Promise.all([
        ctx.runMutation(internal.studio.updateChapterInternal, {
          chapterId: args.chapterId,
          status: "ready_to_render",
        }),
        setRedisCache(cacheKey, brief)
      ]);

      await logger.info("✅ Chapter Production Orchestrated", traceId);
      return { status: "ready_to_render", brief };
    });
  },
});
