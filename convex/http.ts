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
    // 🛡️ 2026 Security: Validate that this comes from a trusted NVIDIA cluster
    // (Implementation of signature check would go here)

    const body = await request.json() as { jobId: any; storageId?: string; status?: string };
    const { jobId, storageId, status } = body;

    // 🌊 Atomic State Update
    await ctx.runMutation(internal.studio.updateJobStatusInternal, {
      jobId,
      status: status || "complete",
      progress: 100,
    });

    return new Response(null, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
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
