# BookCinema Long-Form Video Fine-Tuning Strategy

> Maintaining visual and narrative consistency across 30+ chapters (90+ minutes of video) requires specialized fine-tuning techniques that extend beyond standard text-to-video models.

---

## 1. The Challenge: Long-Form Coherence

Standard video generation models (Runway, Minimax, Kling) are trained on isolated 5–10 second clips. BookCinema requires **90+ minutes of coherent video** where:

- **Characters** maintain consistent appearance across all scenes
- **Locations** remain visually stable across multiple chapters
- **Lighting and color grading** follow a consistent aesthetic
- **Narrative pacing** adapts to emotional weight (action scenes are faster, intimate scenes are slower)
- **Continuity** is maintained across chapter boundaries

This document outlines the production-grade fine-tuning strategies to achieve this.

---

## 2. Core Fine-Tuning Strategies

### 2.1 Keyframe Conditioning (Recommended Starting Point)

**Strategy:** Generate a set of coherent keyframes first, then use an Image-to-Video (I2V) model to synthesize motion between them.

**Why it works:** Keyframes act as visual anchors, preventing character/setting drift. The I2V model only needs to generate smooth transitions, not maintain long-term consistency.

**Implementation in BookCinema:**

```
Agent 4 (Visual Director) → Generate keyframes + visual prompts
                              ↓
                        Keyframe Conditioning
                              ↓
Agent 5 (Video Producer) → I2V model (Runway I2V, Minimax I2V)
                              ↓
                        Smooth motion synthesis
                              ↓
                        Final video clips
```

**Keyframe Generation Prompt Template:**

```
You are a storyboard artist for a feature film.
Generate 3-5 keyframes for this scene:

SCENE: [Slugline]
ACTION: [Scene description]
WORLD BIBLE: [Character appearances, location details]

For each keyframe, provide:
1. Frame number (1-5)
2. Detailed visual description (camera angle, lighting, composition)
3. Character positions and expressions
4. Props and set dressing
5. Color palette and mood

Format as JSON array of keyframe objects.
```

**Keyframe Storage Schema:**

```typescript
interface KeyframeData {
  sceneId: number;
  frameNumber: number;
  visualDescription: string;
  characterPositions: Record<string, { position: string; expression: string }>;
  props: string[];
  colorPalette: string[];
  generatedImageUrl?: string;
  timestamp: number;
}
```

### 2.2 Asynchronous Noise Strategy (For Seamless Transitions)

**Strategy:** Use joint denoising across multiple video clips with staggered noise levels, allowing earlier frames to condition later frames.

**Why it works:** By treating frames from adjacent scenes as "conditions," the model generates smooth transitions without visible cuts or character teleportation.

**Implementation:**

```
Scene N (Frames 1-60)
    ↓ (noise level: 0.8)
    ├─ Denoise jointly with Scene N+1
    ↓
Scene N+1 (Frames 1-60)
    ↓ (noise level: 0.5 — lower because conditioned on Scene N)
    ├─ Last 5 frames of Scene N act as "anchors"
    ↓
Scene N+2 (Frames 1-60)
    ↓ (noise level: 0.3 — even lower)
    └─ Last 5 frames of Scene N+1 act as "anchors"
```

**Configuration:**

```typescript
interface AsyncNoiseConfig {
  baseNoiseLevel: number; // 0.8 for first scene
  noiseDecayPerScene: number; // 0.15 (drops by 15% per scene)
  anchorFrameCount: number; // 5 frames from previous scene
  maxConsecutiveScenes: number; // Process 3 scenes at a time
}
```

### 2.3 Differentiable Reward Flow (DRF) — VLM-Based Critic

**Strategy:** Use a frozen Vision-Language Model (VLM) as a critic during fine-tuning, providing temporally localized feedback on character/setting consistency.

**Why it works:** A VLM can detect subtle inconsistencies (character's hair color changed, location details shifted) that pixel-level losses miss.

**Implementation:**

```typescript
interface DRFConfig {
  vlmModel: "gpt-4-vision" | "claude-3-vision" | "gemini-pro-vision";
  consistencyMetrics: {
    characterAppearance: number; // 0-1 score
    locationDetails: number; // 0-1 score
    lightingContinuity: number; // 0-1 score
    narrativeFlow: number; // 0-1 score
  };
  feedbackFrequency: "per-scene" | "per-chapter" | "per-batch";
  rewardWeight: number; // 0.3 (30% of total loss)
}
```

**VLM Critic Prompt:**

```
You are a film continuity supervisor reviewing a generated video.

PREVIOUS SCENE: [Image of last frame from Scene N]
CURRENT SCENE: [Image of first frame from Scene N+1]
CHARACTER REFERENCE: [Character appearance from World Bible]
LOCATION REFERENCE: [Location description from World Bible]

Rate the following on a scale of 0-1:
1. Character appearance consistency (hair, clothing, position)
2. Location detail consistency (furniture, props, lighting)
3. Lighting and color grading continuity
4. Narrative flow and pacing

Return JSON with scores and specific inconsistencies detected.
```

### 2.4 Temporal Contrastive Loss (TCL)

**Strategy:** Penalize the model when the distance between a video clip and its text description grows too large over time.

**Why it works:** Prevents "drift" where the video slowly deviates from the intended narrative.

**Formula:**

```
TCL = Σ(t=1 to T) ||f(video[t]) - g(text)||² / t

where:
- f(video[t]) = video encoder output at frame t
- g(text) = text encoder output
- t = frame index (loss increases over time to penalize drift)
```

**Implementation:**

```typescript
function temporalContrastiveLoss(
  videoEmbeddings: number[][], // [T, embedding_dim]
  textEmbedding: number[], // [embedding_dim]
  temperature: number = 0.07
): number {
  let loss = 0;
  for (let t = 0; t < videoEmbeddings.length; t++) {
    const frameEmbedding = videoEmbeddings[t];
    const similarity = cosineSimilarity(frameEmbedding, textEmbedding);
    const timeWeight = 1 + (t / videoEmbeddings.length) * 0.5; // Increase penalty over time
    loss += Math.pow(1 - similarity, 2) * timeWeight;
  }
  return loss / videoEmbeddings.length;
}
```

---

## 3. Handling 100k+ Token Book Context

Standard transformers use **quadratic attention**, which becomes prohibitively expensive for 100k+ tokens. BookCinema must use specialized architectures.

### 3.1 Linear Attention & Mamba SSMs

**Option A: Linear Attention**

Linear Attention models (like Performer or Longformer) reduce attention complexity from O(n²) to O(n), making them viable for long contexts.

**Option B: Mamba (State Space Models)**

Mamba is a newer architecture that scales linearly and has demonstrated superior performance on long sequences. It's the recommended choice for 100k+ tokens.

**Comparison:**

| Model | Max Tokens | Memory | Speed | Quality |
|-------|-----------|--------|-------|---------|
| Standard Transformer | 4k–8k | O(n²) | Baseline | Baseline |
| Longformer | 4k–16k | O(n) | 2–3× faster | 95% of baseline |
| Mamba | 100k+ | O(n) | 5–10× faster | 98% of baseline |
| Gemini 3.1 Pro | 2M | Proprietary | Cloud-based | 99%+ |

### 3.2 Retrieval-Augmented Generation (RAG) for Chapter Context

**Strategy:** Index all chapters into a vector database, then retrieve only the most relevant chapters for each scene generation.

**Implementation:**

```typescript
interface RAGConfig {
  vectorDb: "pinecone" | "weaviate" | "milvus";
  embeddingModel: "text-embedding-3-large" | "bge-large-en-v1.5";
  chunkSize: number; // 1000 tokens per chunk
  retrievalTopK: number; // Retrieve top 5 most relevant chapters
  contextWindow: number; // 8000 tokens active context
}

async function retrieveChapterContext(
  sceneDescription: string,
  allChapters: Chapter[],
  config: RAGConfig
): Promise<string> {
  // Embed the scene description
  const sceneEmbedding = await embed(sceneDescription);
  
  // Query vector DB for most relevant chapters
  const relevantChapters = await vectorDb.query(sceneEmbedding, config.retrievalTopK);
  
  // Concatenate into active context window
  let context = "";
  for (const chapter of relevantChapters) {
    if (context.length + chapter.content.length < config.contextWindow) {
      context += chapter.content + "\n---\n";
    }
  }
  
  return context;
}
```

### 3.3 Ring Attention for Multi-GPU Distribution

**Strategy:** Distribute the context across multiple GPUs using Ring Attention, allowing each GPU to process a segment of the sequence.

**Why it works:** Reduces per-GPU memory from O(n) to O(n/k), where k is the number of GPUs.

**Implementation (Pseudocode):**

```python
# Ring Attention: distribute sequence across 4 GPUs
num_gpus = 4
sequence_length = 100_000
chunk_size = sequence_length // num_gpus  # 25,000 tokens per GPU

for gpu_id in range(num_gpus):
    # Each GPU processes its chunk
    chunk = sequence[gpu_id * chunk_size : (gpu_id + 1) * chunk_size]
    
    # Ring communication: pass chunk to next GPU
    chunk_from_prev = ring_recv(gpu_id - 1)
    ring_send(chunk, gpu_id + 1)
    
    # Compute attention with previous chunk
    attention_output = compute_attention(chunk, chunk_from_prev)
```

### 3.4 LongRoPE for Extended Positional Embeddings

**Strategy:** Extend the positional embeddings of existing transformer models to support longer sequences without retraining.

**Why it works:** Standard RoPE (Rotary Position Embeddings) are designed for 4k–8k tokens. LongRoPE stretches these embeddings to support 100k+ tokens with minimal performance loss.

**Implementation:**

```typescript
function longRoPE(
  position: number,
  dimension: number,
  maxPosition: number = 100_000
): number[] {
  const theta = [];
  for (let i = 0; i < dimension; i += 2) {
    const freq = 1 / Math.pow(10_000, i / dimension);
    // Stretch the frequency based on max position
    const stretchedFreq = freq * (maxPosition / 4096); // 4096 is standard max
    theta.push(Math.cos(position * stretchedFreq));
    theta.push(Math.sin(position * stretchedFreq));
  }
  return theta;
}
```

### 3.5 Ms-PoE (Multi-Scale Positional Embeddings)

**Strategy:** Adjust positional embeddings so the model treats token distance differently as context grows, mitigating "middle token decay."

**Why it works:** Transformers struggle to attend to tokens in the middle of long sequences. Ms-PoE forces the model to treat the middle region as important.

**Implementation:**

```typescript
function msPoE(
  position: number,
  dimension: number,
  contextLength: number
): number[] {
  const scales = [1, 2, 4, 8]; // Multiple scales
  const embeddings = [];
  
  for (const scale of scales) {
    const scaledPos = position / scale;
    for (let i = 0; i < dimension / scales.length; i++) {
      const freq = 1 / Math.pow(10_000, (2 * i) / dimension);
      embeddings.push(Math.cos(scaledPos * freq));
      embeddings.push(Math.sin(scaledPos * freq));
    }
  }
  
  // Boost middle tokens
  const middleBoost = Math.abs(position - contextLength / 2) < contextLength / 4 ? 1.5 : 1.0;
  return embeddings.map(e => e * middleBoost);
}
```

---

## 4. Model Selection: Gemini 3.1 Pro vs Llama 4 Scout

### Gemini 3.1 Pro (Industry Standard)

**Strengths:**
- Native 2M+ token window (20× larger than standard models)
- Near 100% "Needle" retrieval at 1.5M tokens
- Proprietary fine-tuning by Google
- Best-in-class performance on long-context tasks

**Weaknesses:**
- Closed-source (no fine-tuning control)
- Higher cost (~$10/million tokens for long context)
- Vendor lock-in

**Recommended for:** Production deployments where cost is secondary to quality.

### Llama 4 Scout (Open-Weight Leader)

**Strengths:**
- 10M token native window (5× larger than Gemini)
- Open-weight (can be fine-tuned on your own hardware)
- Lower inference cost (~$0.30/million tokens via Together AI)
- Full control over model behavior

**Weaknesses:**
- Requires GPU infrastructure for fine-tuning
- Slightly lower quality than Gemini on some benchmarks
- Larger model size (405B parameters)

**Recommended for:** Custom deployments where you want to fine-tune on your own book-to-movie data.

### Recommendation for BookCinema

**Phase 1 (MVP):** Use **Gemini 3.1 Pro** via Google Cloud API for production quality.

**Phase 2 (Scale):** Fine-tune **Llama 4 Scout** on a corpus of 1,000+ book-to-movie productions to achieve custom performance at 1/10th the cost.

---

## 5. Scene-Level Dataset Training

To fine-tune models specifically for book-to-movie, train on datasets with long, untrimmed footage:

| Dataset | Size | Format | Relevance |
|---------|------|--------|-----------|
| **MovieNet** | 1,100 movies | Full-length films with scene annotations | High — real movie structure |
| **EgoLife** | 200 hours | Long-form egocentric video | Medium — different domain |
| **LSMDC** | 128k scenes | Movie clips with descriptions | High — scene-to-description pairs |
| **YouCook2** | 2k videos | Long-form cooking videos | Low — different domain |

**Fine-tuning Pipeline:**

```
1. Download MovieNet + LSMDC
2. Extract scenes with shot boundaries
3. Create text descriptions using GPT-4V
4. Fine-tune video model on (scene, description) pairs
5. Evaluate on held-out test set
6. Deploy to BookCinema Agent 5
```

---

## 6. Implementation Roadmap for BookCinema

### Phase 1: Keyframe Conditioning (Weeks 1–2)

- [ ] Implement keyframe generation in Agent 4 (Visual Director)
- [ ] Integrate Runway I2V API in Agent 5 (Video Producer)
- [ ] Add keyframe storage to `videoScenes` table
- [ ] Test on 3-chapter sample book

### Phase 2: Advanced Consistency (Weeks 3–4)

- [ ] Implement Asynchronous Noise Strategy
- [ ] Add VLM critic (GPT-4V) for consistency scoring
- [ ] Integrate Temporal Contrastive Loss into training loop
- [ ] Test on 10-chapter book

### Phase 3: Long-Context Handling (Weeks 5–6)

- [ ] Evaluate Gemini 3.1 Pro vs Llama 4 Scout
- [ ] Implement RAG for chapter retrieval
- [ ] Add Ring Attention for multi-GPU support
- [ ] Deploy to production

### Phase 4: Custom Fine-Tuning (Weeks 7–8)

- [ ] Collect 100 book-to-movie productions
- [ ] Fine-tune Llama 4 Scout on custom dataset
- [ ] Benchmark against Gemini 3.1 Pro
- [ ] Achieve 10× cost reduction

---

## 7. Cost Estimation (With Advanced Techniques)

| Component | Cost per Book | Notes |
|-----------|---------------|-------|
| Keyframe generation (3 per scene × 25 scenes) | $0.12 | GPT-4V vision calls |
| I2V video generation (75 clips) | $3.75 | Runway I2V @ $0.05/sec |
| VLM critic (consistency scoring) | $0.18 | GPT-4V calls per chapter |
| Temporal loss computation | $0.00 | Local GPU |
| **Total per book** | **$4.05** | |
| **At 1,000 books/month** | **$4,050/month** | |

**With fine-tuned Llama 4 Scout (Phase 4):**
- Reduce I2V cost by 60% (use open-source models)
- Reduce VLM critic cost by 80% (use fine-tuned model)
- **New total: $1.20/book** (~70% cost reduction)

---

*This strategy document is a living reference for BookCinema's long-form video production capabilities. Update as new models and techniques emerge.*
