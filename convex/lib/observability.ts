/**
 * 🛡️ Enterprise Observability (2026 Stream Edition)
 * Leveraging Convex Native Log Streaming.
 * Simply use console methods; Convex handles the transport to Axiom/Sentry.
 */

export const logger = {
  /**
   * 📡 Axiom-Native Structured Logging
   * 2026 Strategy: JSON-stringified console logs for zero-latency streaming.
   */
  info: (message: string, traceId: string, data?: any) => {
    console.info(JSON.stringify({ level: "INFO", message, traceId, ...data }));
  },

  error: (error: any, traceId: string, context?: any) => {
    console.error(JSON.stringify({
      level: "ERROR",
      traceId,
      message: error.message || String(error),
      stack: error.stack,
      ...context,
    }));
  },

  audit: (message: string, traceId: string, data?: any) => {
    console.warn(JSON.stringify({ level: "AUDIT", message, traceId, ...data }));
  }
};
