import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { runFullPipeline } from "./orchestration";
import { AIDirectorAgent } from "./ai-director-agent";

import { orchestrateV4 } from "./orchestration-v4";
import { ShotGridClient } from "./shotgrid-client";

const shotgrid = new ShotGridClient({
  baseUrl: process.env.SHOTGRID_URL || "https://bookcinema.shotgrid.autodesk.com",
  scriptName: process.env.SHOTGRID_SCRIPT_NAME || "bookcinema_orchestrator",
  scriptKey: process.env.SHOTGRID_SCRIPT_KEY || "mock_key",
});

export const appRouter = router({

  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ─── Books ───────────────────────────────────────────────────────────────────

  books: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUserBooks(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const book = await db.getBookById(input.id);
        if (!book || book.userId !== ctx.user.id) throw new Error("Book not found");
        const chapterList = await db.getChaptersByBookId(input.id);
        const worldBible = await db.getWorldBible(input.id);
        return { book, chapters: chapterList, worldBible };
      }),

    submit: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        author: z.string().max(255).default("Unknown"),
        genre: z.string().max(100).default("Drama"),
        rawText: z.string().min(100, "Book text must be at least 100 characters"),
        productionStyle: z.enum(["cinematic", "animated", "documentary"]).default("cinematic"),
        tone: z.string().max(100).default("dramatic"),
      }))
      .mutation(async ({ ctx, input }) => {
        const wordCount = input.rawText.split(/\s+/).length;
        const bookId = await db.createBook({
          userId: ctx.user.id,
          title: input.title,
          author: input.author,
          genre: input.genre,
          rawText: input.rawText,
          wordCount,
          productionStyle: input.productionStyle,
          tone: input.tone,
          status: "analyzing",
        });
        const jobId = await db.createJob({
          bookId,
          userId: ctx.user.id,
          currentStage: "book_analysis",
          overallProgress: 0,
          logs: [] as any,
          isActive: true,
          isCancelled: false,
          startedAt: new Date(),
        });
        setImmediate(() => {
          orchestrateV4(jobId, bookId, ctx.user.id, shotgrid).catch((err) => {
            console.error(`[Pipeline V4] Failed for book ${bookId}:`, err);
          });
        });

        return { bookId, jobId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteBook(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Chapters ─────────────────────────────────────────────────────────────────

  chapters: router({
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const chapter = await db.getChapterById(input.id);
        if (!chapter) throw new Error("Chapter not found");
        const book = await db.getBookById(chapter.bookId);
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        const scenes = await db.getScenesByChapterId(input.id);
        return { chapter, scenes };
      }),

    getByBook: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .query(async ({ ctx, input }) => {
        const book = await db.getBookById(input.bookId);
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        return db.getChaptersByBookId(input.bookId);
      }),
  }),

  // ─── World Bible ──────────────────────────────────────────────────────────────

  worldBible: router({
    getByBookId: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .query(async ({ ctx, input }) => {
        const book = await db.getBookById(input.bookId);
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        return db.getWorldBible(input.bookId);
      }),
  }),

  // ─── AI Director ─────────────────────────────────────────────────────────────

  aiDirector: router({
    orchestrateChapter: protectedProcedure
      .input(z.object({
        chapterId: z.number(),
        genre: z.string().default("drama"),
        productionStyle: z.enum(["cinematic", "animated", "documentary"]).default("cinematic"),
      }))
      .mutation(async ({ ctx, input }) => {
        const chapter = await db.getChapterById(input.chapterId);
        if (!chapter) throw new Error("Chapter not found");
        
        const book = await db.getBookById(chapter.bookId);
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        
        const worldBible = await db.getWorldBible(book.id);
        
        // Initialize AI Director Agent
        const director = new AIDirectorAgent({
          genre: input.genre,
          narrativeContext: book.tone || 'dramatic',
          bookContent: book.rawText,
          visualBible: (worldBible || { characters: [], locations: [], timeline: [], themes: [] }) as any,
          targetDuration: 120
        });
        
        // Orchestrate chapter into scenes with full cinematography
        const directorDecisions = await director.orchestrateChapter(
          `chapter-${input.chapterId}`,
          chapter.rawContent,
          (worldBible || { characters: [], locations: [], timeline: [], themes: [] }) as any
        );
        
        return {
          chapterId: input.chapterId,
          sceneCount: directorDecisions.length,
          decisions: directorDecisions,
          timestamp: new Date(),
        };
      }),
  }),

  // ─── Processing ──────────────────────────────────────────────────────────────

  processing: router({
    getStatus: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .query(async ({ ctx, input }) => {
        const book = await db.getBookById(input.bookId);
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        const job = await db.getActiveJobForBook(input.bookId);
        return { book, job };
      }),

    cancel: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const job = await db.getJobById(input.jobId);
        if (!job || job.userId !== ctx.user.id) throw new Error("Access denied");
        await db.cancelJob(input.jobId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
