import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
const internalAny = internal as any;
import { logger } from "../lib/observability";

/**
 * 🌍 WorldLabs Bridge (Spatial Intelligence)
 * Purpose: Integration with WorldLabs for 3D world reconstruction from text.
 */
export const reconstructSpatialWorld = internalAction({
  args: {
    sceneId: v.id("videoScenes"),
    description: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const traceId = args.sceneId;
    await logger.info("🌍 WorldLabs: Reconstructing spatial environment...", traceId);

    const apiKey = process.env.WORLDLABS_API_KEY;
    if (!apiKey) throw new Error("WORLDLABS_API_KEY missing.");

    const response = await fetch("https://api.worldlabs.ai/v1/reconstruct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: args.description,
        format: "usd",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WorldLabs Reconstruction Failed: ${error}`);
    }

    return await response.json();
  },
});
