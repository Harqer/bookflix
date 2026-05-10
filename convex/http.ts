import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { submitFeedback } from "./lib/langsmith";
import { logger } from "./lib/observability";

/**
 * 🚀 Enterprise HTTP API (Global Scale)
 * Entry point for secure book submissions and remote render callbacks.
 */

export const submitBook = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return new Response("Unauthorized", { status: 401 });

    // 🛡️ ARCJET: Global Protection with Real Client Context
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const clientContext = {
      ip: request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown",
      headers,
    };

    const decision = await ctx.runAction(internal.actions.arcjet_security.verifyRequest, {
      clerkId: identity.subject,
      clientContext,
      prompt: body.rawText,
    });

    if (!decision.allowed) {
      return new Response("Access Denied: Security policy violation.", { status: 403 });
    }

    // ✅ AUTHORIZED: Triggering Production Cycle
    const result = await ctx.runMutation(internal.studio.submitBookInternal, {
      userId: identity.subject,
      title: body.title,
      author: body.author,
      genre: body.genre,
      rawText: body.rawText,
      productionStyle: body.productionStyle,
      tone: body.tone,
    });

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    await logger.error(err, "http-submission-failure");
    return new Response(err.message, { status: 403 });
  }
});

export const nvidiaCallback = httpAction(async (ctx, request) => {
  // 🛡️ Edge Security: Verify incoming token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.substring(7);
  
  if (token !== process.env.CLOUDFLARE_API_TOKEN) {
    return new Response("Edge Security Failure", { status: 403 });
  }

  const { jobId, status, resultUrl, progress } = await request.json();

  // 1. Update Job Status
  await ctx.runMutation(internal.studio.updateJobStatusInternal, {
    jobId,
    status: status === "success" ? "completed" : "failed",
    progress: progress ?? 100,
  });

  if (status !== "success") return new Response("OK");

  // 2. Sequential Pipeline State Machine
  const job = await ctx.runQuery(internal.studio.getJobInternal, { jobId });
  if (!job) return new Response("OK");

  switch (job.type) {
    case "cosmos":
      await ctx.runAction(internal.agents.comfy_refiner.orchestrateVisualRefinement, {
        bookId: job.bookId,
        chapterId: job.chapterId!,
        sceneId: job.sceneId!,
        baseVisualUrl: resultUrl,
      });
      break;

    case "comfyui_refinement":
      const verification = await ctx.runAction(internal.agents.critic.verifyCinematicIntegrity, {
        sceneId: job.sceneId!,
        renderUrl: resultUrl,
      });

      await submitFeedback(jobId, verification.score, verification.status);

      if (verification.score > 0.85) {
        await ctx.runAction(internal.agents.feature_assembler.assembleChapterFeature, {
          bookId: job.bookId,
          chapterId: job.chapterId!,
        });
      }

      await ctx.runAction(internal.agents.maya_animator.orchestrateMayaAnimation, {
        bookId: job.bookId,
        chapterId: job.chapterId!,
        sceneId: job.sceneId!,
        usdManifest: job.config.usd,
      });
      break;

    case "maya_animation":
      await ctx.runAction(internal.agents.finisher.finalizeProduction, {
        bookId: job.bookId,
        chapterId: job.chapterId!,
      });
      break;

    case "unreal_render":
      await logger.info("🎮 Unreal: Render Callback Received. Handing off to Nuke...", jobId);
      
      // 🚀 Dispatch to Finisher for Final Mastering
      await ctx.runAction(internal.agents.finisher.finalizeProduction, {
        bookId: job.bookId,
        chapterId: job.chapterId!,
      });

      // Once Nuke finishes (handled by another callback), it will trigger finalizeProduction
      break;

    case "nuke_mastering":
      await logger.info("⚛️ Nuke: Mastering Complete. Finalizing Production.", jobId);
      await ctx.runAction(internal.agents.finisher.finalizeProduction, {
        bookId: job.bookId,
        chapterId: job.chapterId!,
      });
      break;
  }

  return new Response("OK");
});

const router = httpRouter();

router.route({
  path: "/submit",
  method: "POST",
  handler: submitBook,
});

router.route({
  path: "/nvidia-callback",
  method: "POST",
  handler: nvidiaCallback,
});

export default router;
