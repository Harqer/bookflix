/**
 * 🛡️ Sentry Error Reporter for Convex
 * 2026 Production Standard: Direct DSN Reporting
 */

export async function reportToSentry(error: any, context: any = {}) {
  const SENTRY_DSN = process.env.SENTRY_DSN;
  if (!SENTRY_DSN) return;

  try {
    const event = {
      message: error instanceof Error ? error.message : String(error),
      level: "error",
      extra: context,
      timestamp: Date.now() / 1000,
      platform: "javascript",
      environment: process.env.NODE_ENV || "production",
    };

    // 🚀 High-Performance Fetch to Sentry Ingest
    await fetch(SENTRY_DSN.replace(/@([^/]+)\//, "@ingest.sentry.io/api/"), {
      method: "POST",
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.error("❌ Sentry Reporting Failed", err);
  }
}

/**
 * 🛠️ Action Wrapper for Auto-Reporting
 */
export async function withSentry<T>(actionName: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    await reportToSentry(err, { action: actionName });
    throw err;
  }
}
