/**
 * 🛠️ LangSmith Continuous Learning Bridge
 * Provides automated tracing and feedback loop management for the video pipeline.
 * LangSmith Automations will route these traces to datasets for continuous model improvement.
 */

export async function tracedFetch(url: string, options: any, traceMetadata: any = {}) {
  const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY;
  const PROJECT_NAME = process.env.LANGSMITH_PROJECT || "bookflix-production";

  if (!LANGSMITH_API_KEY) {
    return fetch(url, options);
  }

  // Inject LangSmith Tracing Headers
  const headers = {
    ...options.headers,
    "X-Langsmith-Api-Key": LANGSMITH_API_KEY,
    "X-Langsmith-Project": PROJECT_NAME,
    "X-Langsmith-Metadata": JSON.stringify(traceMetadata),
  };

  return fetch(url, { ...options, headers });
}

export async function submitFeedback(runId: string, score: number, comment?: string) {
  const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY;
  if (!LANGSMITH_API_KEY) return;

  const url = `https://api.smith.langchain.com/feedback`;
  
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Langsmith-Api-Key": LANGSMITH_API_KEY,
    },
    body: JSON.stringify({
      run_id: runId,
      key: "user_feedback",
      score: score, // 0.0 to 1.0
      comment: comment,
    }),
  });
}
