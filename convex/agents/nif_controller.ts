import { v } from "convex/values";
import { internalAction, mutation, query } from "../_generated/server";
import { api, internal } from "../_generated/api";

/**
 * 🎡 NIF Sovereign Controller
 * Orchestrates the "Firing Cycle" of the Personal Mojo LLM.
 */

/**
 * 🛰️ Cloud Dispatcher: Handles communication with the remote H200 cluster
 */
async function dispatchToMojo(phase: string, bookId: string) {
  const FLYWHEEL_URL = process.env.MOJO_FLYWHEEL_URL;
  if (!FLYWHEEL_URL) throw new Error("MOJO_FLYWHEEL_URL not configured in production.");

  const response = await fetch(FLYWHEEL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      phase, 
      bookId,
      manifold_dim: 5,
      timestamp: Date.now()
    })
  });

  if (!response.ok) throw new Error(`Mojo Flywheel Error: ${response.statusText}`);
  return await response.json();
}

/**
 * 🎡 NIF Sovereign Controller: Orchestrates the "Firing Cycle"
 * Applying 'Invisible' Atomic principles for composability.
 */
export const triggerFlywheel = internalAction({
  args: {
    bookId: v.id("books"),
    phase: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Context Acquisition
    const book = await ctx.runQuery(api.studio.getBook, { id: args.bookId });
    if (!book) throw new Error("Book not found");

    const preferredLlm = book.preferredLlm || "cloud";
    console.log(`🚀 Routing Production Phase: ${args.phase} [Mode: ${preferredLlm}]`);

    // 2. Multi-Cloud Routing
    if (preferredLlm === "personal") {
      try {
        return await dispatchToMojo(args.phase, args.bookId);
      } catch (err) {
        console.error("❌ Mojo Cloud Dispatch Failed", err);
        throw err;
      }
    }

    console.log(`☁️ Cloud Standard: ${args.phase} handled by primary pipeline.`);
    return { status: "queued", provider: "cloud_standard" };
  },
});

export const updateLlmPreference = mutation({
  args: {
    bookId: v.id("books"),
    preferredLlm: v.union(v.literal("cloud"), v.literal("personal")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookId, { preferredLlm: args.preferredLlm });
  },
});
