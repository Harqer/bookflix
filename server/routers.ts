import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { 
  getUserBooks, 
  getBookById, 
  createBook, 
  createJob, 
  deleteBook, 
  getChaptersByBookId, 
  getChapterById, 
  getScenesByChapterId, 
  getActiveJobForBook, 
  getJobById, 
  cancelJob,
  upsertWorldBible,
  getWorldBible
} from "./db";
import { runFullPipeline } from "./pipeline/linear-pipeline";
import { AIDirectorAgent } from "./ai-director-agent";
import { runEnterprisePipeline } from "./pipeline/enterprise-pipeline";
import { ShotGridClient } from "./shotgrid-client";

const shotgrid = new ShotGridClient({
  baseUrl: process.env.SHOTGRID_URL || "https://bookcinema.shotgrid.autodesk.com",
  scriptName: process.env.SHOTGRID_SCRIPT_NAME || "bookcinema_orchestrator",
  scriptKey: process.env.SHOTGRID_SCRIPT_KEY || "mock_key",
});

export const appRouter = router({

  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Books ───────────────────────────────────────────────────────────────────

  books: router({
    list: protectedProcedure.query(({ ctx }) => {
      return getUserBooks(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const book = await getBookById(input.id, ctx.orgId || "default");
        if (!book || book.userId !== ctx.user.id) throw new Error("Book not found");
        const chapterList = await getChaptersByBookId(input.id);
        const worldBible = await getWorldBible(input.id);
        return { book, chapters: chapterList, worldBible };
      }),

    submit: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        author: z.string().max(255).default("Unknown"),
        genre: z.string().max(100).default("Drama"),
        rawText: z.string().min(100),
        productionStyle: z.enum(["cinematic", "animated", "documentary"]).default("cinematic"),
        tone: z.string().max(100).default("dramatic"),
      }))
      .mutation(async ({ ctx, input }) => {
        const wordCount = input.rawText.split(/\s+/).length;
        const bookId = await createBook({
          userId: ctx.user.id,
          organizationId: ctx.orgId || "default",
          title: input.title,
          author: input.author,
          genre: input.genre,
          rawText: input.rawText,
          wordCount,
          productionStyle: input.productionStyle,
          status: "analyzing",
        }, ctx.orgId || "default");
        const jobId = await createJob({
          bookId,
          userId: ctx.user.id,
          currentStage: "book_analysis",
          overallProgress: 0,
          isActive: true,
          isCancelled: false,
          startedAt: new Date(),
        });

        // Trigger Enterprise Pipeline
        setImmediate(() => {
          runEnterprisePipeline(jobId, bookId, ctx.user.id, ctx.orgId || "default", shotgrid).catch((err) => {
            console.error(`[Enterprise Pipeline] Failed:`, err);
          });
        });

        return { bookId, jobId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await deleteBook(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Chapters ─────────────────────────────────────────────────────────────────

  chapters: router({
    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const chapter = await getChapterById(input.id);
        if (!chapter) throw new Error("Chapter not found");
        const book = await getBookById(chapter.bookId, ctx.orgId || "default");
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        const scenes = await getScenesByChapterId(input.id);
        return { chapter, scenes };
      }),

    getByBook: protectedProcedure
      .input(z.object({ bookId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.orgId || "default");
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        return getChaptersByBookId(input.bookId);
      }),
  }),

  // ─── World Bible ──────────────────────────────────────────────────────────────

  worldBible: router({
    getByBookId: protectedProcedure
      .input(z.object({ bookId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.orgId || "default");
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        return getWorldBible(input.bookId);
      }),
  }),

  // ─── AI Director ─────────────────────────────────────────────────────────────

  aiDirector: router({
    orchestrateChapter: protectedProcedure
      .input(z.object({
        chapterId: z.string().uuid(),
        genre: z.string().default("drama"),
      }))
      .mutation(async ({ ctx, input }) => {
        const chapter = await getChapterById(input.chapterId);
        if (!chapter) throw new Error("Chapter not found");
        
        const book = await getBookById(chapter.bookId, ctx.orgId || "default");
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        
        const worldBible = await getWorldBible(book.id);
        
        const director = new AIDirectorAgent({
          genre: input.genre,
          narrativeContext: book.tone || 'dramatic',
          bookContent: book.rawText,
          visualBible: (worldBible || { characters: [], locations: [], timeline: [], themes: [] }) as any,
          targetDuration: 120
        });
        
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
      .input(z.object({ bookId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.orgId || "default");
        if (!book || book.userId !== ctx.user.id) throw new Error("Access denied");
        const job = await getActiveJobForBook(input.bookId);
        return { book, job };
      }),

    cancel: protectedProcedure
      .input(z.object({ jobId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const job = await getJobById(input.jobId);
        if (!job || job.userId !== ctx.user.id) throw new Error("Access denied");
        await cancelJob(input.jobId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
