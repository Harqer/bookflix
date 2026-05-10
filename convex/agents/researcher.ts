import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { logger } from "../lib/observability";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 🔍 Researcher Agent (Llama 3.1 70B)
 * Purpose: Pulls scholarly and technical "Ground Truth" for the studio.
 * Rationale: Ensures world-building and technical logic are research-backed.
 */
export const performResearch = internalAction({
  args: { query: v.string(), domain: v.string() },
  handler: async (ctx, args) => {
    await logger.info(`🔍 Researcher: Fact-checking [${args.domain}] for query: ${args.query}`, "research-pass");
    
    const research = await runNvidiaChat(
      [{
        role: "user",
        content: `You are the Sovereign Researcher. 
        Task: Provide proven, scholarly facts regarding the following query: ${args.query} in the domain of ${args.domain}.
        Focus on technical standards, historical accuracy, and physical laws.
        Return ONLY the research facts in a structured summary.`
      }],
      { 
        responseFormat: "text" 
      }
    );

    return { research };
  },
});
