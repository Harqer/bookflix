import { logger } from "./observability";

/**
 * 🧠 Sovereign AI Utility (2026 NVIDIA NIM Edition)
 * Purpose: Centralized High-Performance Narrative Vectorization.
 */

export async function generateEmbedding(apiKey: string, text: string): Promise<number[]> {
  if (!apiKey) {
    await logger.warn("⚠️ AI: No NVIDIA_API_KEY found, falling back to identity vector");
    return new Array(1024).fill(0.1); 
  }

  // 🚀 2026: NVIDIA NIM NVIDIA-Retrieval-QA-Embedding-Llama-3-8B
  const url = "https://integrate.api.nvidia.com/v1/embeddings";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: [text.slice(0, 8000)], // NIM handles long context, we use 8k for efficiency
        model: "nvidia/nv-embedqa-e5-v5",
        encoding_format: "float",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA NIM Error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;

  } catch (err) {
    await logger.error("❌ AI: Embedding Generation Failed", { error: String(err) });
    throw err;
  }
}
