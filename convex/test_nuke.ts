import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * 🧪 Nuke Mastery Test Action
 * Purpose: Manual trigger for the Nuke-MCP Audit-Fix & Delivery pipeline.
 */
export const testNukeMastering = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    sceneId: v.id("videoScenes"),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log("🧪 Test: Starting Nuke Mastering Verification...");
    
    const masteringBrief = "Cinematic War Epic, Gritty, High Intensity, 35mm Anamorphic Lens.";
    
    const result = await ctx.runAction(internal.agents.nuke_orchestrator.orchestrateNukeMastering, {
      bookId: args.bookId,
      chapterId: args.chapterId,
      sceneId: args.sceneId,
      masteringBrief,
      config: {
        genre: "War Epic",
        mood: "Gritty"
      }
    });
    
    console.log("🧪 Test: Nuke Mastering Complete!", result);
    return result;
  },
});
