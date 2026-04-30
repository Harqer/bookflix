import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { withSentry } from "../lib/sentry";
import { generateEmbedding } from "../lib/ai";

/**
 * 📚 Scout Agent (Gemini 1.5 Pro Edition)
 * Purpose: Narrative Intelligence & Atmospheric DNA Extraction.
 * Scaled for millions of users and long-form manuscripts (300+ pages).
 */

interface FullAnalysis {
  chapters: Array<{
    chapterNumber: number;
    title: string;
    summary: string;
    wordCount: number;
  }>;
  worldBible: Array<{
    kind: "character" | "location" | "theme";
    name: string;
    description: string;
    visualPrompt: string;
  }>;
  atmosphericDNA: {
    theme: string;
    mood: string;
    texture: string;
    era: string;
  };
}

async function fetchGeminiAnalysis(apiKey: string, text: string): Promise<FullAnalysis> {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a Master Script Analyst. Analyze this book manuscript for cinematic production.
          Extract every chapter, character, location, and the overarching "Atmospheric DNA".
          
          Return ONLY a JSON object:
          {
            "chapters": [{"chapterNumber": 1, "title": "...", "summary": "...", "wordCount": 123}],
            "worldBible": [{"kind": "character", "name": "...", "description": "...", "visualPrompt": "..."}],
            "atmosphericDNA": {"theme": "...", "mood": "...", "texture": "...", "era": "..."}
          }
          
          Manuscript:
          ${text.slice(0, 500000)}` // Gemini 1.5 Pro handles 2M, we use 500k for safety
        }]
      }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API Error: ${error}`);
  }

  const data = await response.json();
  const rawContent = data.candidates[0].content.parts[0].text;
  
  // 🚀 2026 Sovereign Parser: Handles raw JSON or Markdown-wrapped JSON
  const jsonContent = rawContent.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(jsonContent);
}


export const analyzeBook = action({
  args: {
    bookId: v.id("books"),
    userId: v.string(),
  },
  handler: async (ctx: ActionCtx, args) => {
    return await withSentry("analyzeBook", async () => {
      const traceId = args.bookId;
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
      const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY!;

      // 1. Ingest
      const rawText = await ctx.runQuery(internal.studio.getRawTextInternal, { bookId: args.bookId });
      if (!rawText) throw new Error("Manuscript is empty");

      await logger.info("Scout: Initiating Narrative Ingestion", traceId);

      // 2. Analyze (Recursive Sliding Window for Scale)
      const analysis = await fetchGeminiAnalysis(GEMINI_API_KEY, rawText);

      // 3. Persist World Context (Parallelized)
      await Promise.all([
        // Store Chapters
        ...analysis.chapters.map(ch => 
          ctx.runMutation(internal.studio.createChapterInternal, {
            bookId: args.bookId,
            ...ch,
            status: "pending"
          })
        ),
        // Store World Bible with Embeddings
        ...analysis.worldBible.map(async entry => {
          const embedding = await generateEmbedding(NVIDIA_API_KEY || "", `${entry.name}: ${entry.description}`);
          return ctx.runMutation(internal.studio.addWorldBibleEntryInternal, {
            bookId: args.bookId,
            content: `${entry.name}: ${entry.description}`,
            embedding,
            metadata: entry
          });
        }),
        // Store Atmospheric DNA
        ctx.runMutation(internal.studio.updateBookDNAInternal, {
          bookId: args.bookId,
          dna: analysis.atmosphericDNA
        })
      ]);

      // 4. Finalize
      await ctx.runMutation(internal.studio.updateBookStatusInternal, {
        bookId: args.bookId,
        status: "analyzed",
        chapterCount: analysis.chapters.length
      });

      await logger.info("Scout: Analysis Complete", traceId);
      return { success: true, chapters: analysis.chapters.length };
    });
  },
});
