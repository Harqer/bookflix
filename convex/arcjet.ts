"use node";
import arcjet, { shield, detectPromptInjection, fixedWindow } from "@arcjet/node";

/**
 * 🛡️ Enterprise Arcjet Protection (Global Scale)
 * Purpose: Edge-native security for millions of users.
 */
const aj = process.env.ARCJET_API_KEY ? arcjet({
  key: process.env.ARCJET_API_KEY,
  rules: [
    shield({ mode: "LIVE" }),
    detectPromptInjection({ mode: "LIVE" }),
    // Rate limit: 1 Cinematic Feature per 24 hours per unique global identity
    fixedWindow({
      mode: "LIVE",
      window: "24h",
      max: 1,
    }),
  ],
}) : null;

export default aj;

/**
 * 🔒 Global Protection Helper
 * Ingests real client context from the edge.
 */
export async function protectAction(
  clerkId: string, 
  clientContext?: { ip?: string, headers?: Record<string, string> }, 
  prompt?: string
) {
  // 1. Construct Request Context with fallback defaults
  const request: any = {
    ip: clientContext?.ip || "127.0.0.1",
    method: "POST",
    headers: clientContext?.headers || {},
    fingerprint: clerkId,
  };

  // 2. Construct Rule Properties
  const properties: any = {
    ...(prompt ? { contents: [prompt] } : {}),
  };

  // 3. Skip if Arcjet is disabled
  if (!aj) {
    console.warn("⚠️ Security: Arcjet disabled (Missing API Key). Proceeding...");
    return { isDenied: () => false };
  }

  const decision = await aj.protect(request, properties);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new Error("Enterprise Limit: Daily cinematic quota reached.");
    }
    if (decision.reason.isPromptInjection()) {
      throw new Error("Security Alert: Malicious intent detected. Action blocked.");
    }
    throw new Error("Access Denied: Security policy violation.");
  }

  return decision;
}
