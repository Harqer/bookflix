# BookCinema Full-Book Orchestration Pipeline

> **The Complete Book-to-Movie Production System**: From full-book context in a single LLM pass to 1,000+ video prompts, batch-processed through HunyuanVideo on GPU clusters, and seamlessly assembled into a feature-length film.

---

## 1. Revised Orchestration Logic

The BookCinema pipeline has been redesigned to handle **complete books in a single context window**, eliminating chapter-by-chapter fragmentation and enabling true narrative consistency.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FULL BOOK ORCHESTRATION                             │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: CHUNKING
  Raw Book Text (80k-150k words) → Llama 4 Scout (10M token context)
  ✓ Entire book processed in single pass
  ✓ Full narrative context available to LLM
  ✓ No information loss from chapter fragmentation

Step 2: VISUAL BIBLE GENERATION
  Llama 4 Scout analyzes entire book and generates:
  ├─ Character profiles (appearance, personality, relationships, arcs)
  ├─ Location descriptions (visual style, mood, lighting)
  ├─ Timeline and narrative structure
  ├─ Thematic elements and tone
  └─ Scene breakdown (1,000+ scenes for 2-hour film)

Step 3: PROMPT GENERATION
  Visual Bible + Scene Breakdown → 1,000+ detailed video prompts
  ├─ Each prompt: 200-400 tokens (detailed camera, lighting, action)
  ├─ Prompts maintain character/location consistency
  ├─ Prompts follow visual Bible specifications
  └─ Prompts optimized for HunyuanVideo/LongCat-Video

Step 4: BATCH PROCESSING
  1,000+ prompts → GPU Cluster (Unsloth/Axolotl orchestration)
  ├─ Batch size: 8-16 prompts per GPU
  ├─ Model: HunyuanVideo-1.5 (8.3B params, 14GB VRAM)
  ├─ Output: 1,000+ 6-second video clips (720p, 30fps)
  └─ Processing time: 4-8 hours on 8-GPU cluster

Step 5: CONSISTENCY LOOPS & ASSEMBLY
  Video Clips → Consistency Engine → FFmpeg Assembly
  ├─ I2I consistency: Ensure character appearance across clips
  ├─ Color grading: Unified color palette per chapter
  ├─ Audio sync: Dialogue + background score
  └─ Final output: 2-hour feature film (1080p, 24fps)
```

---

## 2. Llama 4 Scout: The Full-Context LLM

**Why Llama 4 Scout?**

| Metric | Llama 4 Scout | Gemini 3.1 Pro | GPT-4o |
|--------|--------------|----------------|--------|
| Context Window | 10M tokens | 2M tokens | 128k tokens |
| Open-weight | ✓ Yes | ✗ No | ✗ No |
| Cost per book | ~$0.30 | ~$2.00 | ~$5.00 |
| Fine-tuning | ✓ Yes | ✗ No | ✗ No |
| Multi-GPU support | ✓ Yes | ✗ Cloud-only | ✗ Cloud-only |

**Model Specifications:**

- **Parameters:** 17B (Scout) / 405B (Maverick)
- **Architecture:** Mixture-of-Experts (MoE) with 16 experts
- **Context Window:** 10M tokens (50× larger than GPT-4o)
- **Inference Speed:** 100-200 tokens/sec on single H100
- **VRAM Requirements:** 32GB (Scout, quantized), 160GB (Maverick, full precision)
- **Training Data:** 15T tokens (March 2025 cutoff)

**Recommended Deployment:**

```bash
# Option A: Local deployment (single H100)
pip install transformers torch bitsandbytes
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-4-Scout-17B-16E",
    device_map="auto",
    load_in_8bit=True  # Reduces VRAM to 16GB
)

# Option B: Cloud API (Together AI)
import together
response = together.Complete.create(
    model="meta-llama/Llama-4-Scout-17B-16E",
    prompt=full_book_text,
    max_tokens=8000,
    temperature=0.7
)
```

---

## 3. Visual Bible Generation Prompt

**System Prompt for Llama 4 Scout:**

```
You are a master screenwriter and visual director analyzing a complete novel.
Your task is to generate a comprehensive "Visual Bible" that will guide AI video generation.

NOVEL TEXT:
[FULL BOOK TEXT - 10M tokens available]

GENERATE A VISUAL BIBLE WITH:

1. CHARACTER PROFILES (JSON array)
   For each character:
   - fullName, aliases
   - appearance: detailed physical description (height, build, distinctive features)
   - clothing: typical outfits and style
   - personality: key traits and mannerisms
   - relationships: connections to other characters
   - arc: character development across the story
   - firstAppearance: chapter/scene
   - visualPrompt: 100-word description optimized for AI image generation

2. LOCATION PROFILES (JSON array)
   For each location:
   - name, type (INT/EXT)
   - description: detailed visual description
   - era: time period aesthetic
   - mood: emotional atmosphere
   - colorPalette: dominant colors (hex codes)
   - lighting: typical lighting conditions
   - visualPrompt: 100-word description for AI image generation

3. SCENE BREAKDOWN (JSON array, 1,000+ scenes)
   For each scene:
   - sceneNumber: 1-1000+
   - chapter: which chapter this scene belongs to
   - slugline: "INT. ROOM - DAY" format
   - duration: estimated screen time (seconds)
   - characters: list of characters in scene
   - locations: primary location
   - keyAction: 1-2 sentence summary
   - visualPrompt: 300-400 word detailed prompt for video generation
   - pacing: "slow" / "moderate" / "fast"
   - emotionalTone: "tense" / "romantic" / "comedic" / "tragic" etc.

4. NARRATIVE STRUCTURE
   - thematicElements: recurring themes
   - overallTone: dominant emotional register
   - colorGradingPalette: unified color scheme for entire film
   - cameraStyle: preferred camera movements and angles
   - filmGenre: "drama" / "action" / "thriller" etc.

OUTPUT FORMAT: Valid JSON with all fields populated.
```

---

## 4. HunyuanVideo-1.5: The Production Engine

**Model Overview:**

HunyuanVideo-1.5 is Tencent's latest open-source video generation model, specifically designed for production-grade long-form video synthesis.

| Feature | HunyuanVideo-1.5 | LongCat-Video | Wan2.1 |
|---------|------------------|---------------|--------|
| Parameters | 8.3B | 13.6B | 14B |
| T2V Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Long-form (minutes) | ✓ (via continuation) | ✓ (native) | ✓ (via continuation) |
| I2V Support | ✓ Yes | ✓ Yes | ✓ Yes |
| VRAM (720p) | 14GB | 16GB | 16GB |
| Inference Speed | 75 sec (RTX 4090) | 120 sec | 90 sec |
| Open-source | ✓ Yes | ✓ Yes | ✓ Yes |
| Distilled Models | ✓ Yes (8-12 steps) | ✓ Yes | ✗ No |

**Key Technical Features:**

1. **Selective and Sliding Tile Attention (SSTA):** Reduces computational overhead for long sequences by 1.87×
2. **3D Causal VAE:** 16× spatial compression, 4× temporal compression
3. **Bilingual Support:** English + Chinese prompts
4. **Video Super-Resolution:** Built-in upscaling to 1080p
5. **Distilled Models:** 8-step and 12-step variants for 75% faster inference

**Recommended Configuration for BookCinema:**

```python
from diffusers import HunyuanVideoPipeline
import torch

# Load model with optimizations
pipeline = HunyuanVideoPipeline.from_pretrained(
    "tencent/HunyuanVideo-1.5-480P-T2V",
    torch_dtype=torch.float16,
    enable_attention_slicing=True,
    enable_vae_tiling=True,
)

# Move to GPU with memory optimization
pipeline = pipeline.to("cuda")

# Generate video from prompt
video_frames = pipeline(
    prompt="[DETAILED VISUAL PROMPT FROM VISUAL BIBLE]",
    negative_prompt="blurry, low quality, distorted",
    height=720,
    width=1280,
    num_frames=144,  # 6 seconds @ 24fps
    num_inference_steps=50,  # Use 12 for distilled model
    guidance_scale=7.5,
    generator=torch.Generator(device="cuda").manual_seed(42),
).frames[0]

# Export to video file
export_to_video(video_frames, "scene_001.mp4", fps=24)
```

---

## 5. LongCat-Video: Native Long-Form Alternative

**When to use LongCat-Video:**

LongCat-Video (13.6B parameters) is specifically designed for **minutes-long video generation** without color drifting or quality degradation. It's the recommended choice for **multi-scene chapters** where consistency across clips is critical.

**Key Advantages:**

- **Video-Continuation task:** Natively trained to extend videos without quality loss
- **Unified architecture:** Single model for T2V, I2V, and video continuation
- **Block Sparse Attention:** Efficient processing of long sequences
- **Multi-reward RLHF:** Trained with reinforcement learning from human feedback

**Orchestration with LongCat-Video:**

```
Scene 1 (6 sec) → LongCat-Video T2V
    ↓
Scene 2 (6 sec) → LongCat-Video Video-Continuation (using Scene 1 as context)
    ↓
Scene 3 (6 sec) → LongCat-Video Video-Continuation (using Scene 1-2 as context)
    ↓
Chapter 1 (30 scenes = 3 minutes) → Seamless long-form video
```

---

## 6. Batch Processing with Unsloth & Axolotl

**Why Unsloth/Axolotl for batch processing?**

Unsloth provides hand-optimized CUDA kernels that reduce VRAM usage by 40-60% and increase throughput by 2-3×. Axolotl provides distributed training orchestration across multiple GPUs.

**GPU Cluster Setup:**

```yaml
# BookCinema GPU Cluster Configuration
cluster:
  gpus: 8x NVIDIA H100 (80GB VRAM each)
  total_vram: 640GB
  interconnect: NVLink (900GB/s)
  
batch_processing:
  prompts_per_gpu: 8
  total_concurrent_prompts: 64
  model: HunyuanVideo-1.5-480P-T2V
  batch_size: 8
  inference_steps: 12 (distilled model)
  output_resolution: 720p
  output_fps: 24
  
throughput:
  time_per_prompt: 75 seconds (distilled)
  time_per_batch: 75 seconds (parallel)
  prompts_per_hour: 480 (per GPU)
  total_throughput: 3,840 prompts/hour (8 GPUs)
  
for_90_minute_film:
  total_prompts: 1,080 (90 min × 60 sec ÷ 5 sec per prompt)
  processing_time: 17 minutes (at full cluster capacity)
  cost: ~$8.50 (at $0.30/GPU-hour on cloud)
```

**Orchestration Script (Pseudocode):**

```python
import torch
from diffusers import HunyuanVideoPipeline
from torch.utils.data import DataLoader
import distributed as dist

# Initialize distributed training
dist.init_process_group(backend="nccl")
rank = dist.get_rank()
world_size = dist.get_world_size()

# Load model on each GPU
model = HunyuanVideoPipeline.from_pretrained(
    "tencent/HunyuanVideo-1.5-480P-T2V",
    torch_dtype=torch.float16,
).to(f"cuda:{rank}")

# Load prompts (1,000+ scenes)
prompts = load_visual_bible_prompts("visual_bible.json")

# Distribute prompts across GPUs
prompt_batches = distribute_prompts(prompts, world_size, batch_size=8)
local_batches = prompt_batches[rank]

# Process batches
for batch_idx, batch in enumerate(local_batches):
    print(f"GPU {rank}: Processing batch {batch_idx}/{len(local_batches)}")
    
    for prompt in batch:
        video_frames = model(
            prompt=prompt["visualPrompt"],
            height=720,
            width=1280,
            num_frames=144,  # 6 seconds
            num_inference_steps=12,  # Distilled
        ).frames[0]
        
        # Save video
        export_to_video(
            video_frames,
            f"output/scene_{prompt['sceneNumber']:04d}.mp4",
            fps=24
        )
        
        # Log progress
        dist.barrier()  # Sync across GPUs
        if rank == 0:
            print(f"Progress: {batch_idx * world_size * 8}/{len(prompts)}")
```

---

## 7. Consistency Engine & Video Assembly

**The Consistency Engine** ensures that characters, locations, and lighting remain visually coherent across all 1,000+ clips.

### 7.1 Character Consistency Loop

```
Scene N: Character "Alice" appears
    ↓ Extract character embedding
    ↓ Store in Redis cache: "alice_scene_N"
    ↓
Scene N+1: Alice appears again
    ↓ Check Redis for previous Alice appearance
    ↓ If appearance differs > threshold:
       - Use Image-to-Image (I2I) consistency model
       - Regenerate Scene N+1 with Alice from Scene N as reference
    ↓
Scene N+2: Alice appears
    ↓ Use latest Alice embedding as reference
    ↓ Continue forward
```

**Implementation:**

```python
import redis
from PIL import Image
import numpy as np

redis_client = redis.Redis(host='localhost', port=6379)

class CharacterConsistencyEngine:
    def __init__(self, i2i_model):
        self.i2i_model = i2i_model  # Stable Diffusion I2I
        self.character_cache = {}
    
    def extract_character_embedding(self, video_frames, character_name):
        """Extract visual embedding of character from video frames"""
        first_frame = video_frames[0]
        # Use CLIP to extract character appearance
        embedding = self.vision_encoder(first_frame)
        return embedding
    
    def check_consistency(self, character_name, new_embedding, threshold=0.85):
        """Check if new appearance matches previous"""
        cached_key = f"char:{character_name}:latest"
        cached_embedding = redis_client.get(cached_key)
        
        if cached_embedding is None:
            # First appearance
            redis_client.set(cached_key, new_embedding)
            return True, 1.0
        
        # Compare embeddings (cosine similarity)
        similarity = np.dot(new_embedding, cached_embedding) / (
            np.linalg.norm(new_embedding) * np.linalg.norm(cached_embedding)
        )
        
        if similarity < threshold:
            # Inconsistency detected
            return False, similarity
        
        # Update cache
        redis_client.set(cached_key, new_embedding)
        return True, similarity
    
    def fix_inconsistency(self, video_frames, reference_image, character_name):
        """Use I2I to regenerate video with consistent character"""
        fixed_frames = []
        for frame in video_frames:
            # Use I2I model to blend character appearance
            fixed_frame = self.i2i_model(
                image=frame,
                prompt=f"Character {character_name} with consistent appearance",
                image_guidance_scale=1.5,
            ).images[0]
            fixed_frames.append(fixed_frame)
        return fixed_frames
```

### 7.2 Color Grading Unification

```python
import cv2
import numpy as np

class ColorGradingEngine:
    def __init__(self, target_palette):
        self.target_palette = target_palette  # From Visual Bible
    
    def analyze_color_distribution(self, video_frames):
        """Analyze color histogram of video"""
        histograms = []
        for frame in video_frames:
            hist = cv2.calcHist([frame], [0, 1, 2], None, [8, 8, 8], 
                               [0, 256, 0, 256, 0, 256])
            histograms.append(hist)
        return histograms
    
    def apply_color_grading(self, video_frames, target_palette):
        """Apply unified color grading to all frames"""
        graded_frames = []
        for frame in video_frames:
            # Convert to LAB color space
            lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
            
            # Apply color correction using target palette
            # (Simplified: in production, use more sophisticated color matching)
            lab[:, :, 1:] = lab[:, :, 1:] * target_palette["saturation"]
            
            # Convert back to BGR
            graded = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            graded_frames.append(graded)
        
        return graded_frames
```

### 7.3 FFmpeg Assembly

```bash
#!/bin/bash
# Assemble 1,000+ video clips into final 2-hour film

# Step 1: Create concat demuxer file
cat > concat.txt << EOF
file 'output/scene_0001.mp4'
file 'output/scene_0002.mp4'
file 'output/scene_0003.mp4'
... (1,000+ lines)
file 'output/scene_1080.mp4'
EOF

# Step 2: Concatenate videos
ffmpeg -f concat -safe 0 -i concat.txt -c copy output/concatenated.mp4

# Step 3: Add audio (dialogue + background score)
ffmpeg -i output/concatenated.mp4 \
       -i audio/dialogue_track.wav \
       -i audio/background_score.wav \
       -filter_complex "[1]volume=0.8[a1];[2]volume=0.3[a2];[a1][a2]amix=inputs=2:duration=longest[a]" \
       -map 0:v:0 -map "[a]" \
       -c:v libx264 -preset slow -crf 18 \
       -c:a aac -b:a 192k \
       output/final_film_2h_1080p.mp4

# Step 4: Verify output
ffprobe output/final_film_2h_1080p.mp4
# Duration: 02:00:00 (2 hours)
# Resolution: 1920x1080
# Bitrate: 8,000 kbps
```

---

## 8. Production Workflow: End-to-End

```
PHASE 1: PREPARATION (2 hours)
├─ Upload book text (80-150k words)
├─ Llama 4 Scout generates Visual Bible
│  ├─ 50+ character profiles
│  ├─ 30+ location profiles
│  ├─ 1,000+ scene breakdown
│  └─ Narrative structure
└─ Validate Visual Bible (manual review)

PHASE 2: PROMPT GENERATION (1 hour)
├─ Generate 1,000+ video prompts from Visual Bible
├─ Each prompt: 300-400 tokens
├─ Optimize for HunyuanVideo-1.5
└─ Store in prompt database

PHASE 3: BATCH VIDEO GENERATION (20 minutes)
├─ Distribute 1,000+ prompts across 8-GPU cluster
├─ HunyuanVideo-1.5 generates 6-second clips
├─ 75 seconds per clip (distilled model)
├─ Parallel processing: 64 clips simultaneously
└─ Output: 1,000+ MP4 files (720p, 24fps)

PHASE 4: CONSISTENCY CHECKING (30 minutes)
├─ Character consistency engine
│  ├─ Extract character embeddings
│  ├─ Compare across scenes
│  └─ Fix inconsistencies with I2I
├─ Color grading unification
│  ├─ Analyze color distribution
│  ├─ Apply target palette
│  └─ Grade all clips
└─ Audio preparation
   ├─ Generate dialogue (ElevenLabs TTS)
   ├─ Generate background score (Suno/Udio)
   └─ Mix audio tracks

PHASE 5: FINAL ASSEMBLY (10 minutes)
├─ FFmpeg concatenation (1,000+ clips)
├─ Audio sync and mixing
├─ Color grading pass
├─ Quality verification
└─ Output: 2-hour feature film (1080p, 24fps)

TOTAL TIME: ~3.5 hours from book to finished film
```

---

## 9. Cost Breakdown (Production Scale)

| Component | Cost per Book | Notes |
|-----------|---------------|-------|
| Llama 4 Scout (full book analysis) | $0.30 | Via Together AI |
| Visual Bible generation | $0.00 | Included in LLM call |
| 1,000+ video prompts | $1,000+ | HunyuanVideo-1.5 on GPU cluster |
| GPU cluster (8× H100, 20 min) | $8.00 | At $0.30/GPU-hour on cloud |
| Character consistency (I2I) | $50.00 | Stable Diffusion I2I calls |
| Audio generation (TTS + music) | $30.00 | ElevenLabs + Suno |
| Storage (1,000 clips + final film) | $5.00 | Cloudflare R2 |
| **Total per book** | **~$1,093** | |
| **At 100 books/month** | **~$109,300** | |

**Cost Optimization Strategies:**

1. **Use distilled HunyuanVideo models:** 75% faster, same quality
2. **Fine-tune Llama 4 Scout on book-to-movie data:** Reduce LLM cost by 80%
3. **Self-host GPU cluster:** $0.10/GPU-hour vs $0.30/GPU-hour cloud
4. **Batch audio generation:** Process 100 books' dialogue in parallel

---

## 10. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BOOKCINEMA PRODUCTION SYSTEM                │
└─────────────────────────────────────────────────────────────────┘

API Layer (Node.js + tRPC)
    ├─ /api/books/submit — Accept book upload
    ├─ /api/books/:id/status — Real-time production status
    └─ /api/books/:id/download — Download final film

LLM Layer (Llama 4 Scout)
    ├─ Full-book context processing
    ├─ Visual Bible generation
    └─ Prompt engineering

Video Generation Layer (HunyuanVideo-1.5)
    ├─ 8-GPU cluster (H100)
    ├─ Batch processing (64 concurrent)
    └─ Output: 1,000+ clips

Consistency Engine
    ├─ Character embedding cache (Redis)
    ├─ Color grading (OpenCV)
    └─ I2I consistency (Stable Diffusion)

Assembly Pipeline (FFmpeg)
    ├─ Video concatenation
    ├─ Audio mixing
    └─ Final encoding (1080p H.264)

Storage (Cloudflare R2)
    ├─ Intermediate clips (1,000+)
    ├─ Final films (2-hour 1080p)
    └─ Metadata + Visual Bibles
```

---

*This document represents the production-grade orchestration system for BookCinema, enabling full-length feature films from any book in under 4 hours.*
