# BookCinema API Keys & Backend Setup Guide

This document provides links to register for all required API keys and backend services for BookCinema production deployment.

## AI & LLM Services

### 1. Qwen2.5-1M (Text Processing & Orchestration)
- **Provider**: Alibaba Cloud (Qwen)
- **Registration**: https://dashscope.console.aliyun.com/
- **Purpose**: Full-book context processing (1M token window), World Bible generation, screenplay creation
- **Environment Variable**: `QWEN_API_KEY`

### 2. Gemini 3.1 Pro (Fallback LLM)
- **Provider**: Google Cloud AI
- **Registration**: https://ai.google.dev/
- **Purpose**: Fallback when Qwen context exceeds limits (2M token window)
- **Environment Variable**: `GEMINI_API_KEY`

### 3. GPT-4V (Vision & Consistency Scoring)
- **Provider**: OpenAI
- **Registration**: https://platform.openai.com/account/api-keys
- **Purpose**: Character consistency validation, visual quality scoring
- **Environment Variable**: `OPENAI_API_KEY`

---

## Video & Audio Generation (The 11-Siphon Fleet)

### 4. HunyuanVideo-1.5 (Primary Video Generation)
- **Provider**: Tencent / Self-hosted on Modal
- **Purpose**: Generate theatrical video clips from visual prompts (8.3B params)
- **Environment Variable**: `HUNYUAN_API_KEY` (or handled via `MODAL_TOKEN` for self-hosting)

### 5. ElevenLabs (Voiceover & Dialogue)
- **Provider**: ElevenLabs
- **Registration**: https://elevenlabs.io/api
- **Purpose**: High-fidelity character voice cloning and narration
- **Environment Variable**: `ELEVENLABS_API_KEY`

### 6. Modal (GPU Cluster Orchestration)
- **Provider**: Modal Labs
- **Registration**: https://modal.com/
- **Purpose**: Orchestrating the 11-Siphon fleet (Blender, Maya, Unreal, etc.) on H100/H200 GPUs
- **Environment Variables**: `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`

---

## Database, Storage & Handover

### 7. Convex (The Brain & State Machine)
- **Provider**: Convex
- **Registration**: https://convex.dev/
- **Purpose**: Real-time state management, orchestration graph, and durable checkpoints
- **Environment Variables**: `CONVEX_DEPLOYMENT`, `CONVEX_URL`

### 8. Vercel Blob (Direct-to-Edge Asset Handover)
- **Provider**: Vercel
- **Registration**: https://vercel.com/docs/storage/vercel-blob
- **Purpose**: Synchronous handover of rendered assets from the GPU fleet to the global CDN
- **Environment Variable**: `BLOB_READ_WRITE_TOKEN`

### 9. GPU Cluster Secret (Internal Fleet Auth)
- **Purpose**: Secures the direct communication between the Convex Brain and the Modal Siphons
- **Environment Variable**: `GPU_CLUSTER_SECRET`

---

## Setup Instructions

### Step 1: Create `.env.local` file
```bash
# LLM Services
QWEN_API_KEY=your_qwen_key_here
OPENAI_API_KEY=your_openai_key_here

# Video & Audio
ELEVENLABS_API_KEY=your_elevenlabs_key_here
MODAL_TOKEN_ID=your_modal_id
MODAL_TOKEN_SECRET=your_modal_secret

# Infrastructure
CONVEX_URL=https://your-app.convex.cloud
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
GPU_CLUSTER_SECRET=your_long_random_string
```

### Step 2: Deploy the Siphon Fleet
```bash
# Deploy the Modal workers
modal deploy audio_worker.py
modal deploy comfy_worker.py
modal deploy render_worker.py
```

## Cost Estimation (Per Theatrical Scene)

| Service | Usage | Cost |
|---------|-------|------|
| Qwen2.5-1M | Narrative DNA | $0.05 |
| HunyuanVideo | 4K H100 Rendering | $0.45 |
| ElevenLabs | 4k Dialogue bits | $0.10 |
| Modal | Fleet Orchestration | $0.20 |
| Vercel Blob | 100MB Asset Storage | $0.05 |
| **Total** | | **~$0.85** |

## Production Checklist

- [ ] All 11 Siphons verified via `verify_cluster()`
- [ ] ElevenLabs Voice Map synchronized with Character DNA
- [ ] Modal weights volume (`comfy-weights-storage`) pre-warmed
- [ ] Vercel Blob token has write permissions for production regions
- [ ] `GPU_CLUSTER_SECRET` synchronized between Convex and Modal
- [ ] Zero-Gap firing cycle validated for multi-scene dispatch
