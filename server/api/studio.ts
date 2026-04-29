import { Router } from "express";
import { z } from "zod";
import { createStudioGraph } from "../pipeline/agentic-pipeline";
import { RateLimiter } from "../_core/rate-limiter";

/**
 * Studio API Molecule (Invisible Atomic Design)
 * Follows FastAPI patterns for validation and dependency injection.
 */
const studioRouter = Router();

// 1. Task: Input Validation Schema (Atomic)
const ProductionRequest = z.object({
  bookId: z.string().uuid(),
  userId: z.string(),
  orgId: z.string(),
  researchTopics: z.array(z.string()).default(["narrative", "visual_style"]),
});

/**
 * Endpoint: Initiate Autonomous Production
 * Implements FastAPI-style async execution and rate limiting.
 */
studioRouter.post("/produce", async (req, res) => {
  try {
    // Validation (Atomic)
    const payload = ProductionRequest.parse(req.body);

    // Dependency Check: Rate Limiting (Atomic)
    const { allowed } = await RateLimiter.checkLimit(payload.orgId, "cinematic_production");
    if (!allowed) return res.status(429).json({ error: "Production quota exceeded" });

    // 2026 Monetization: Credit Deduction (Atomic)
    const { calculateTotalCost } = await import("../_core/pricing");
    const { deductCredits, getUserById } = await import("../db");
    const user = await getUserById(payload.userId);
    
    // Estimate cost based on 30s block + requested features
    const estimatedDuration = 30; 
    const jobCost = calculateTotalCost(estimatedDuration, payload.researchTopics, "1080p");

    if (!user || user.credits < jobCost) {
      return res.status(402).json({ 
        error: "Insufficient Render Credits",
        required: jobCost,
        current: user?.credits || 0
      });
    }

    await deductCredits(payload.userId, jobCost);

    // Orchestration (Molecular Composition)
    const graph = await createStudioGraph();
    const threadId = `prod_${payload.bookId}_${Date.now()}`;
    
    // Background Task: Fire and forget (FastAPI Pattern)
    graph.invoke({
      ...payload,
      attempts: 0,
      isHallucinating: false,
      screenplay: ""
    }, { configurable: { thread_id: threadId } });

    return res.status(202).json({ 
      message: "Production initiated",
      threadId,
      statusUrl: `/api/studio/status/${threadId}`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ detail: error.issues });
    }
    return res.status(500).json({ error: String(error) });
  }
});

export default studioRouter;
