import { invokeLLM } from "../_core/llm";
import type { Message } from "../_core/llm";
import * as db from "../db";

export function log(jobId: string, agent: string, level: "info" | "success" | "warning" | "error", message: string) {
  db.appendJobLog(jobId, { 
    timestamp: new Date().toISOString(), 
    agent, 
    level, 
    message 
  }).catch(console.error);
  console.log(`[${agent}] ${level.toUpperCase()}: ${message}`);
}

export function extractText(result: any): string {
  const content = result.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => ("text" in c ? c.text : "")).join("");
  }
  return "";
}
