"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { logger } from "../lib/observability";
import { protectAction } from "../arcjet";
import { runNvidiaChat } from "../lib/ai_service";

/**
 * 📚 Book Analyst Agent (Gemini 1.5 Pro Edition)
 * Purpose: Deep Narrative Comprehension & Scene Extraction.
 * Logic: Breaks a book into chapters and extracts atmospheric DNA.
 */
export const analyzeBook = internalAction({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const traceId = args.bookId;
    await logger.info("📚 Analyst: Starting Book Analysis...", traceId);

    // 1. Fetch raw text
    const rawText = await ctx.runQuery(internal.studio.getRawTextInternal, { bookId: args.bookId });
    if (!rawText) throw new Error("Book content missing.");

    // 🚀 Signal Progress: Analyzing
    await ctx.runMutation(internal.studio.updateBookStatusInternal, {
      bookId: args.bookId,
      status: "analyzing",
    });

    // 🛡️ ARCJET: Prompt Injection Detection
    // For internal actions, we use the bookId as the fingerprint if subject is unavailable.
    const identity = await ctx.auth.getUserIdentity();
    await protectAction(identity?.subject || args.bookId, undefined, rawText.substring(0, 1000));

    const book = await ctx.runQuery(internal.studio.getBookInternal, { bookId: args.bookId });
    if (!book || !rawText) throw new Error("Book content or metadata missing.");

    // 📚 LIBRESCHOLAR: Multi-Agent Expansion Swarm
    await logger.info("📚 Analyst: Delegating to LibreScholar Authoring Swarm...", traceId);

    const expandedUniverse = await ctx.runAction(internal.agents.librescholar_author.expandSeedToUniverse, {
      seed: rawText.substring(0, 15000), // 🚀 Optimization: Analyzing seed for DNA
      bookId: args.bookId,
    });

    await ctx.runMutation(internal.studio.updateBookDNAInternal, {
      bookId: args.bookId,
      dna: {
        theme: expandedUniverse.theme,
        mood: expandedUniverse.mood,
        texture: expandedUniverse.texture,
        era: expandedUniverse.era,
        authorialDNA: expandedUniverse.authorialDNA,
      },
    });
    
    await ctx.runMutation(internal.studio.updateBookSummaryInternal, {
      bookId: args.bookId,
      summary: expandedUniverse.summary || "Manuscript authored by LibreScholar Swarm.",
    });

    await logger.info("✅ Analyst: LibreScholar Universe Expansion Complete.", traceId);
    
    await ctx.runMutation(internal.studio.updateBookStatusInternal, {
      bookId: args.bookId,
      status: "scripting",
    });

    // 3. Recursive Chapter Segmentation
    const productionMode = book.productionMode || "movie";
    const chapterCount = productionMode === "series" ? 3 : 1; // 🚀 POC: Generate 3 episodes for TV, 1 for Movie

    await logger.info(`📚 Analyst: Scaling production for [${productionMode.toUpperCase()}] mode (${chapterCount} parts)`, traceId);

    const chapterIds = [];
    for (let i = 1; i <= chapterCount; i++) {
      const chapterId = await ctx.runMutation(internal.studio.createChapterInternal, {
        bookId: args.bookId,
        chapterNumber: i,
        title: productionMode === "series" ? `Episode ${i}: The Shift` : "Feature: The Awakening",
        summary: `Narrative arc part ${i} for ${productionMode}.`,
        status: "pending",
      });
      chapterIds.push(chapterId);
    }

    // 4. Trigger Production for ALL Chapters
    await Promise.all(chapterIds.map(async (chapterId) => {
      console.log("📚 Analyst: Triggering NIF Controller for Part:", chapterId);
      await ctx.runAction(internal.agents.nif_controller.orchestrateChapterProduction, {
        bookId: args.bookId,
        chapterId,
      });
    }));

    await logger.info("✅ Analyst: All production units dispatched.", traceId);
  },
});

export const analyzeChapter = internalAction({
  args: {
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
  },
  handler: async (ctx, args) => {
    const traceId = args.chapterId;
    await logger.info("📚 Analyst: Starting Chapter Screenplay Generation...", traceId);

    // 🧠 REAL SCREENPLAY GENERATION: Transforming chapter summary into cinematic script
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey) throw new Error("NVIDIA_API_KEY missing.");

    // 🧠 SOVEREIGN SCREENPLAY SYNTHESIS: Multi-Agent Fallback Logic
    await logger.info("📚 Analyst: Directing Screenplay Synthesis...", traceId);

    const book = await ctx.runQuery(internal.studio.getBookInternal, { bookId: args.bookId });
    const chapter = await ctx.runQuery(internal.studio.getChapterInternal, { chapterId: args.chapterId });
    if (!book || !chapter) throw new Error("Metadata missing for screenplay synthesis.");

    const systemPrompt = `You are a Master Screenwriter and Production Architect.
    AESTHETIC DNA: Jia Zhangke (Observational Realism) + British New Wave (Timeless Depth).
    
    TECHNICAL DIRECTIVES:
    - Write for the H200 rendering fleet. Include lighting, composition, and lens specs in sluglines.
    - DIALOGUE: Minimalist, subtext-heavy.
    - VISUALS: Focus on the intersection of architecture and human psychology.
    
    ATMOSPHERIC DNA: ${JSON.stringify(book.atmosphericDNA || {})}
    
    OUTPUT FORMAT: Standard cinematic screenplay with sluglines (EXT. ALLEY - NIGHT). Return raw text.`;

    const screenplay = await runNvidiaChat(
      [{ role: "user", content: `GENERATE MASTER SCREENPLAY FOR CHAPTER: ${chapter.title}. SUMMARY: ${chapter.summary}` }],
      { 
        traceId, 
        systemPrompt,
        responseFormat: "text" 
      }
    );
    
    // 2. Scene Segmentation (Live Extraction)
    const scenes = screenplay.split(/(?=EXT\.|INT\.)/g);
    
    for (let i = 0; i < scenes.length; i++) {
      const sceneText = scenes[i].trim();
      if (!sceneText) continue;

      await ctx.runMutation(internal.studio.createSceneInternal, {
        chapterId: args.chapterId,
        sceneNumber: i + 1,
        slugline: sceneText.split("\n")[0],
        description: sceneText.substring(0, 500),
        screenplayChunk: sceneText,
      });
    }

    await ctx.runMutation(internal.studio.updateChapterInternal, {
      chapterId: args.chapterId,
      status: "scripting_complete",
    });

    return screenplay;
  },
});
