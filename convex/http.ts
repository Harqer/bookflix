import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * 📡 Convex HTTP Webhooks
 * The 2026 "Callback" architecture for NVIDIA NIMs.
 */
const http = httpRouter();

http.route({
  path: "/nvidia-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("X-Worker-Secret");
    if (signature !== process.env.EXTERNAL_WORKER_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json() as { 
      jobId: any; 
      sceneId?: any; 
      storageId?: string; 
      status?: string;
      progress?: number;
    };
    
    const { jobId, sceneId, storageId, status, progress } = body;

    // 🌊 Atomic State Update for Job
    await ctx.runMutation(internal.studio.updateJobStatusInternal, {
      jobId,
      status: status || "complete",
      progress: progress ?? 100,
    });

    // 🎬 Link Asset to Scene if provided
    if (sceneId && storageId) {
      await ctx.runMutation(internal.studio.updateSceneInternal, {
        sceneId,
        storageId: storageId as any,
        status: "complete",
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
    });
  }),
});

// Handle CORS Preflight for production clusters
http.route({
  path: "/nvidia-callback",
  method: "OPTIONS",
  handler: httpAction(async (ctx, request) => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
