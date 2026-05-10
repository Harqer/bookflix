import { logger } from "./observability";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * 🧠 SOVEREIGN AI SERVICE
 * Centralized runner for NVIDIA NIMs with automatic model fallback chains.
 * Anchored by Vercel AI SDK for ultimate cross-provider resilience.
 */

const NVIDIA_FALLBACKS = [
  "meta/llama-3.3-70b-instruct",
  "meta/llama-3.1-405b-instruct",
  "meta/llama-3.1-8b-instruct"
];

const VERCEL_FALLBACKS = [
  { provider: anthropic, model: "claude-3-7-sonnet-latest" },
  { provider: openai, model: "gpt-4o" }
];

export async function runNvidiaChat(
  messages: { role: string, content: string }[],
  options: { 
    traceId?: string, 
    responseFormat?: "json_object" | "text",
    systemPrompt?: string 
  } = {}
) {
  const { traceId, responseFormat = "json_object", systemPrompt } = options;
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  
  let lastError = null;

  // ── 🛡️ TIER 1: NVIDIA NIM (Sovereign Cluster) ──────────────────────
  if (nvidiaKey) {
    for (const model of NVIDIA_FALLBACKS) {
      try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
              ...messages
            ],
            response_format: responseFormat === "json_object" ? { type: "json_object" } : undefined
          })
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Model ${model} failed: ${err}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // Clean JSON formatting if present
        if (responseFormat === "json_object" && content.includes("```json")) {
          content = content.split("```json")[1].split("```")[0];
        }

        return responseFormat === "json_object" ? JSON.parse(content) : content;
        
      } catch (e) {
        lastError = e;
        if (traceId) await logger.warn(`⚠️ AI Service: NVIDIA [${model}] failed. Pivoting...`, traceId);
      }
    }
  }

  // ── 🛡️ TIER 2: VERCEL AI SDK (Global Fallback) ─────────────────────
  if (traceId) await logger.info("🛰️ AI Service: NVIDIA exhausted. Engaging Vercel Sovereign Fallback...", traceId);
  
  for (const { provider, model } of VERCEL_FALLBACKS) {
    try {
      const { text } = await generateText({
        model: provider(model),
        system: systemPrompt,
        prompt: messages.map(m => `${m.role}: ${m.content}`).join("\n"),
      });

      let content = text;
      if (responseFormat === "json_object" && content.includes("```json")) {
        content = content.split("```json")[1].split("```")[0];
      }

      return responseFormat === "json_object" ? JSON.parse(content) : content;

    } catch (e) {
      lastError = e;
      if (traceId) await logger.warn(`⚠️ AI Service: Vercel [${model}] failed. Pivoting...`, traceId);
    }
  }

  throw new Error(`All AI fallbacks failed. Total blackout. Last error: ${lastError}`);
}
