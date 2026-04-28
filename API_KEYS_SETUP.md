# BookCinema API Keys & Backend Setup Guide

This document provides links to register for all required API keys and backend services for BookCinema production deployment.

## AI & LLM Services

### 1. Qwen2.5-1M (Text Processing & Orchestration)
- **Provider**: Alibaba Cloud (Qwen)
- **Registration**: https://dashscope.console.aliyun.com/
- **Documentation**: https://help.aliyun.com/en/dashscope/latest/api-details
- **Purpose**: Full-book context processing (1M token window), World Bible generation, screenplay creation
- **Environment Variable**: `QWEN_API_KEY`
- **Pricing**: Pay-as-you-go (~$0.0001 per 1K tokens)

### 2. Gemini 3.1 Pro (Fallback LLM)
- **Provider**: Google Cloud AI
- **Registration**: https://ai.google.dev/
- **Documentation**: https://ai.google.dev/docs
- **Purpose**: Fallback when Qwen context exceeds limits (2M token window)
- **Environment Variable**: `GEMINI_API_KEY`
- **Pricing**: Free tier available, then pay-as-you-go

### 3. GPT-4V (Vision & Consistency Scoring)
- **Provider**: OpenAI
- **Registration**: https://platform.openai.com/account/api-keys
- **Documentation**: https://platform.openai.com/docs/guides/vision
- **Purpose**: Character consistency validation, visual quality scoring
- **Environment Variable**: `OPENAI_API_KEY`
- **Pricing**: ~$0.01 per image (1024x1024)

## Video Generation Services

### 4. HunyuanVideo-1.5 (Primary Video Generation)
- **Provider**: Tencent
- **Registration**: https://huggingface.co/tencent/HunyuanVideo-1.5
- **Documentation**: https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5
- **Purpose**: Generate video clips from visual prompts (8.3B params, 14GB VRAM)
- **Environment Variable**: `HUNYUAN_API_KEY` or self-hosted via Diffusers
- **Pricing**: Self-hosted (free) or API (~$0.10/minute)

### 5. Runway Gen-3 (Alternative Video Generation)
- **Provider**: Runway
- **Registration**: https://app.runwayml.com/
- **Documentation**: https://docs.runwayml.com/
- **Purpose**: High-quality video generation, motion control
- **Environment Variable**: `RUNWAY_API_KEY`
- **Pricing**: ~$0.05/second of video

### 6. Minimax Video (Alternative Video Generation)
- **Provider**: Minimax
- **Registration**: https://www.minimaxi.com/
- **Documentation**: https://platform.minimaxi.com/docs
- **Purpose**: Fast video generation, good for batch processing
- **Environment Variable**: `MINIMAX_API_KEY`
- **Pricing**: ~$0.02/minute

## Database & Storage

### 7. PlanetScale (MySQL Database)
- **Provider**: PlanetScale
- **Registration**: https://app.planetscale.com/
- **Documentation**: https://planetscale.com/docs
- **Purpose**: Scalable MySQL database for books, chapters, jobs
- **Environment Variable**: `DATABASE_URL`
- **Pricing**: Free tier (5GB), then pay-as-you-go

### 8. Cloudflare R2 (Object Storage)
- **Provider**: Cloudflare
- **Registration**: https://dash.cloudflare.com/
- **Documentation**: https://developers.cloudflare.com/r2/
- **Purpose**: Store generated video clips, keyframes, assets
- **Environment Variables**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- **Pricing**: $0.015/GB stored, $0.015/GB egress

### 9. AWS S3 (Alternative Storage)
- **Provider**: Amazon Web Services
- **Registration**: https://aws.amazon.com/s3/
- **Documentation**: https://docs.aws.amazon.com/s3/
- **Purpose**: Alternative to R2 for video/asset storage
- **Environment Variables**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- **Pricing**: $0.023/GB stored, $0.09/GB egress

## Vector Database & RAG

### 10. Chroma (Vector Database)
- **Provider**: Chroma
- **Registration**: https://www.trychroma.com/
- **Documentation**: https://docs.trychroma.com/
- **Purpose**: Store book embeddings for semantic search (ViMax RAG layer)
- **Environment Variable**: `CHROMA_API_KEY`
- **Pricing**: Free self-hosted or managed service

### 11. Weaviate (Alternative Vector DB)
- **Provider**: Weaviate
- **Registration**: https://console.weaviate.cloud/
- **Documentation**: https://weaviate.io/developers/weaviate
- **Purpose**: Alternative vector database for RAG
- **Environment Variable**: `WEAVIATE_API_KEY`
- **Pricing**: Free tier available

## Task Queue & Caching

### 12. Redis (Caching & Job Queue)
- **Provider**: Redis Cloud
- **Registration**: https://redis.com/try-free/
- **Documentation**: https://redis.io/docs/
- **Purpose**: Cache World Bibles, character embeddings, job queue (BullMQ)
- **Environment Variable**: `REDIS_URL`
- **Pricing**: Free tier (30MB), then pay-as-you-go

### 13. BullMQ (Job Queue)
- **Provider**: Open source (self-hosted with Redis)
- **Documentation**: https://docs.bullmq.io/
- **Purpose**: Queue and process video generation jobs in parallel
- **Environment Variable**: `REDIS_URL` (uses same Redis instance)
- **Pricing**: Free (open source)

## Deployment & Infrastructure

### 14. Railway (Backend Deployment)
- **Provider**: Railway
- **Registration**: https://railway.app/
- **Documentation**: https://docs.railway.app/
- **Purpose**: Deploy Node.js backend with auto-scaling
- **Environment Variable**: `RAILWAY_TOKEN`
- **Pricing**: Free tier (500 hours/month), then pay-as-you-go

### 15. Fly.io (Alternative Backend Deployment)
- **Provider**: Fly.io
- **Registration**: https://fly.io/
- **Documentation**: https://fly.io/docs/
- **Purpose**: Deploy backend globally with edge computing
- **Environment Variable**: `FLY_API_TOKEN`
- **Pricing**: Free tier available, then pay-as-you-go

### 16. Vercel (Frontend Deployment)
- **Provider**: Vercel
- **Registration**: https://vercel.com/
- **Documentation**: https://vercel.com/docs
- **Purpose**: Deploy web preview of BookCinema
- **Environment Variable**: `VERCEL_TOKEN`
- **Pricing**: Free tier available

## Authentication & Security

### 17. OAuth Providers (Optional)
- **Google OAuth**: https://console.cloud.google.com/
- **GitHub OAuth**: https://github.com/settings/developers
- **Purpose**: User authentication
- **Environment Variables**: `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`

## Setup Instructions

### Step 1: Create `.env.local` file
```bash
# LLM Services
QWEN_API_KEY=your_qwen_key_here
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here

# Video Generation
HUNYUAN_API_KEY=your_hunyuan_key_here
RUNWAY_API_KEY=your_runway_key_here
MINIMAX_API_KEY=your_minimax_key_here

# Database
DATABASE_URL=mysql://user:password@host/database

# Storage
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key

# Vector DB
CHROMA_API_KEY=your_chroma_key_here

# Caching
REDIS_URL=redis://user:password@host:port

# Deployment
RAILWAY_TOKEN=your_railway_token
FLY_API_TOKEN=your_fly_token
VERCEL_TOKEN=your_vercel_token
```

### Step 2: Update Backend Configuration
Edit `server/_core/index.ts` to initialize all API clients:
```typescript
import { initQwenClient } from './llm-clients/qwen';
import { initGeminiClient } from './llm-clients/gemini';
import { initOpenAIClient } from './llm-clients/openai';
import { initHunyuanClient } from './video-clients/hunyuan';
import { initRedisClient } from './cache/redis';
import { initChromaClient } from './rag/chroma';

// Initialize all clients
await initQwenClient(process.env.QWEN_API_KEY);
await initGeminiClient(process.env.GEMINI_API_KEY);
await initOpenAIClient(process.env.OPENAI_API_KEY);
await initHunyuanClient(process.env.HUNYUAN_API_KEY);
await initRedisClient(process.env.REDIS_URL);
await initChromaClient(process.env.CHROMA_API_KEY);
```

### Step 3: Deploy to Railway/Fly.io
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

## Cost Estimation (Per 300-Page Book)

| Service | Usage | Cost |
|---------|-------|------|
| Qwen2.5-1M | 1M tokens | $0.10 |
| GPT-4V | 5 consistency checks | $0.05 |
| HunyuanVideo | 1000 clips @ 5sec | $1.67 |
| Storage (R2) | 50GB video | $0.75 |
| Database | 1000 rows | $0.01 |
| Redis | 1GB cache | $0.10 |
| **Total** | | **~$2.68** |

## Production Checklist

- [ ] Register for all API keys
- [ ] Create `.env.local` with all keys
- [ ] Test each API client independently
- [ ] Set up Redis for caching
- [ ] Configure PlanetScale database
- [ ] Set up R2 or S3 storage
- [ ] Deploy backend to Railway/Fly.io
- [ ] Configure WebSocket server for real-time updates
- [ ] Set up monitoring and error logging
- [ ] Load test with 300-page book
- [ ] Deploy to production

## Support & Documentation

- **BookCinema Docs**: See `ARCHITECTURE.md` and `FULL_BOOK_ORCHESTRATION.md`
- **Qwen Docs**: https://help.aliyun.com/en/dashscope/
- **HunyuanVideo Docs**: https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5
- **Railway Docs**: https://docs.railway.app/
