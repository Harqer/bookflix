"use node";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { protectAction } from "../arcjet";

/**
 * 🛡️ Sovereign Security Bridge: Arcjet Verification
 * Purpose: Allows Convex HTTP endpoints to leverage Node-based Arcjet protection.
 */
export const verifyRequest = internalAction({
  args: {
    clerkId: v.string(),
    clientContext: v.object({
      ip: v.string(),
      headers: v.any(),
    }),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 🔒 Dispatch to Node-based Arcjet Logic
    const decision = await protectAction(args.clerkId, args.clientContext, args.prompt);
    
    return {
      allowed: decision.isAllowed(),
      reason: decision.isDenied() ? decision.reason : "AUTHORIZED",
    };
  },
});
