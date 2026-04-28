# BookCinema Production API Keys Checklist

This document lists all API keys and credentials required to run BookCinema in production. Some are already configured, others still need to be acquired.

## Status Summary

| Category | Status | Count |
|----------|--------|-------|
| ✅ Configured | Ready | 9 |
| ⏳ Required | Need to acquire | 6 |
| ⚠️ Optional | For advanced features | 3 |
| **Total** | | **18** |

---

## ✅ CONFIGURED (Already Set Up)

### 1. Supabase (Database & Auth)
- **Status**: ✅ Configured
- **URL**: https://bzsemrbjwsufesasxmgs.supabase.co
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL` ✅
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ✅
  - `SUPABASE_SERVICE_ROLE_KEY` ✅
- **Purpose**: PostgreSQL database, user authentication, real-time subscriptions
- **Documentation**: https://supabase.com/docs

### 2. OpenAI (GPT-4V Vision)
- **Status**: ✅ Configured
- **Environment Variable**: `OPENAI_API_KEY` ✅
- **Purpose**: Character consistency validation, visual quality scoring, scene analysis
- **Documentation**: https://platform.openai.com/docs/guides/vision

### 3. Cloudflare R2 (Object Storage)
- **Status**: ✅ Configured
- **Environment Variables**:
  - `CLOUDFLARE_API_TOKEN` ✅
  - `R2_ACCESS_KEY_ID` ✅
  - `R2_SECRET_ACCESS_KEY` ✅
  - `R2_ACCOUNT_ID` ✅
  - `R2_ENDPOINT` ✅
- **Purpose**: Store generated video clips, keyframes, World Bible exports
- **Documentation**: https://developers.cloudflare.com/r2/

---

## ⏳ REQUIRED (Must Acquire for Production)

### 4. Qwen2.5-1M (LLM - Full Book Processing)
- **Status**: ⏳ **REQUIRED**
- **Provider**: Alibaba Cloud (DashScope)
- **Registration**: https://dashscope.console.aliyun.com/
- **Environment Variable**: `QWEN_API_KEY`
- **Purpose**: Process entire books (1M-token context), generate World Bible, create screenplays
- **Pricing**: ~$0.0001 per 1K tokens (~$0.10 per 300-page book)
- **Setup**:
  1. Go to https://dashscope.console.aliyun.com/
  2. Create account or sign in
  3. Create API key in "API Key Management"
  4. Add to `.env.local`: `QWEN_API_KEY=your_key_here`

### 5. HunyuanVideo-1.5 (Video Generation)
- **Status**: ⏳ **REQUIRED**
- **Provider**: Tencent
- **Registration**: https://huggingface.co/tencent/HunyuanVideo-1.5
- **Environment Variable**: `HUNYUAN_API_KEY` (or self-hosted)
- **Purpose**: Generate video clips from visual prompts (1000+ clips per book)
- **Pricing**: ~$0.10/minute of video (~$1.67 per 300-page book)
- **Setup Options**:
  - **Option A (Recommended)**: Use Hugging Face Inference API
    1. Go to https://huggingface.co/settings/tokens
    2. Create read access token
    3. Add to `.env.local`: `HUGGINGFACE_API_KEY=hf_xxx`
  - **Option B**: Self-host on GPU cluster (requires 14GB VRAM)
    1. Install: `pip install diffusers torch transformers`
    2. Configure in `server/orchestration-v2.ts`

### 6. Redis (Caching & Job Queue)
- **Status**: ⏳ **REQUIRED**
- **Provider**: Redis Cloud or self-hosted
- **Registration**: https://redis.com/try-free/
- **Environment Variable**: `REDIS_URL`
- **Purpose**: Cache character embeddings, job queue (BullMQ), real-time updates
- **Pricing**: Free tier (30MB) or ~$15/month for production
- **Setup**:
  1. Go to https://redis.com/try-free/
  2. Create free database
  3. Copy connection string
  4. Add to `.env.local`: `REDIS_URL=redis://user:password@host:port`

### 7. Gemini 3.1 Pro (Fallback LLM)
- **Status**: ⏳ **REQUIRED** (as fallback)
- **Provider**: Google Cloud AI
- **Registration**: https://ai.google.dev/
- **Environment Variable**: `GEMINI_API_KEY`
- **Purpose**: Fallback when Qwen context exceeds limits (2M-token window)
- **Pricing**: Free tier available, then ~$0.075 per 1M tokens
- **Setup**:
  1. Go to https://ai.google.dev/
  2. Click "Get API Key"
  3. Create new API key
  4. Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

### 8. Runway Gen-3 (Alternative Video Generation)
- **Status**: ⏳ **REQUIRED** (as alternative to HunyuanVideo)
- **Provider**: Runway
- **Registration**: https://app.runwayml.com/
- **Environment Variable**: `RUNWAY_API_KEY`
- **Purpose**: High-quality video generation, motion control (alternative to HunyuanVideo)
- **Pricing**: ~$0.05/second of video
- **Setup**:
  1. Go to https://app.runwayml.com/
  2. Sign up and create account
  3. Go to API settings
  4. Generate API key
  5. Add to `.env.local`: `RUNWAY_API_KEY=your_key_here`

### 9. Deployment Platform (Railway or Fly.io)
- **Status**: ⏳ **REQUIRED** (for production deployment)
- **Options**:
  - **Railway**: https://railway.app/
  - **Fly.io**: https://fly.io/
- **Environment Variables**: `RAILWAY_TOKEN` or `FLY_API_TOKEN`
- **Purpose**: Deploy backend server with auto-scaling
- **Pricing**: Free tier or ~$5-20/month for production
- **Setup**:
  1. Choose platform (Railway recommended for simplicity)
  2. Go to https://railway.app/
  3. Sign up with GitHub
  4. Create new project
  5. Connect BookCinema GitHub repo
  6. Add environment variables
  7. Deploy

---

## ⚠️ OPTIONAL (For Advanced Features)

### 10. Minimax Video (Alternative Video Generation)
- **Status**: ⚠️ Optional
- **Provider**: Minimax
- **Registration**: https://www.minimaxi.com/
- **Environment Variable**: `MINIMAX_API_KEY`
- **Purpose**: Fast video generation, good for batch processing
- **Pricing**: ~$0.02/minute
- **Setup**: Similar to Runway, register and get API key

### 11. Chroma (Vector Database for RAG)
- **Status**: ⚠️ Optional
- **Provider**: Chroma
- **Registration**: https://www.trychroma.com/
- **Environment Variable**: `CHROMA_API_KEY`
- **Purpose**: Store book embeddings for semantic search (ViMax RAG layer)
- **Pricing**: Free self-hosted or managed service
- **Setup**: Self-hosted or use managed Chroma service

### 12. Weaviate (Alternative Vector DB)
- **Status**: ⚠️ Optional
- **Provider**: Weaviate
- **Registration**: https://console.weaviate.cloud/
- **Environment Variable**: `WEAVIATE_API_KEY`
- **Purpose**: Alternative vector database for RAG
- **Pricing**: Free tier available
- **Setup**: Create account and configure

---

## Environment Variables Template

Create `.env.local` with all required variables:

```bash
# ✅ CONFIGURED
NEXT_PUBLIC_SUPABASE_URL=https://bzsemrbjwsufesasxmgs.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_UFarWg0361B8EH7155EVPg_89XbJjCm
SUPABASE_SERVICE_ROLE_KEY=sb_secret_AfbsrM8GWw0Se4sfszlTCw_cdkKEcCI
OPENAI_API_KEY=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
CLOUDFLARE_API_TOKEN=cfat_y7QX0M3qEB04q7Q1h8QNBRO0aFvNOyetJLIMFX2xc6778e9e
R2_ACCESS_KEY_ID=a6235b1919e3bc26356447b395ee0ff8
R2_SECRET_ACCESS_KEY=2ffaecc7d58c1f720fb5aaaac5e2528f0cf1eb7681cd78619c4f2b1be46b5a27
R2_ACCOUNT_ID=b2a5ee203295f97276dfe509ebcbb931
R2_ENDPOINT=https://b2a5ee203295f97276dfe509ebcbb931.r2.cloudflarestorage.com

# ⏳ REQUIRED - ADD THESE
QWEN_API_KEY=your_qwen_key_here
HUNYUAN_API_KEY=your_hunyuan_key_here
HUGGINGFACE_API_KEY=hf_your_token_here
REDIS_URL=redis://user:password@host:port
GEMINI_API_KEY=your_gemini_key_here
RUNWAY_API_KEY=your_runway_key_here
RAILWAY_TOKEN=your_railway_token_here

# ⚠️ OPTIONAL
MINIMAX_API_KEY=your_minimax_key_here
CHROMA_API_KEY=your_chroma_key_here
WEAVIATE_API_KEY=your_weaviate_key_here
```

---

## Setup Priority

### Phase 1 (MVP - Minimum Viable Product)
**Estimated time**: 2-3 hours

1. ✅ Supabase (configured)
2. ✅ OpenAI (configured)
3. ✅ Cloudflare R2 (configured)
4. ⏳ **Qwen2.5-1M** (PRIORITY #1)
5. ⏳ **Redis** (PRIORITY #2)
6. ⏳ **HunyuanVideo-1.5** (PRIORITY #3)

**Cost**: ~$2.68 per book

### Phase 2 (Production Ready)
**Estimated time**: 1-2 hours

7. ⏳ Gemini 3.1 Pro (fallback)
8. ⏳ Runway Gen-3 (alternative)
9. ⏳ Railway deployment

**Cost**: ~$3.50 per book (with fallbacks)

### Phase 3 (Advanced Features)
**Estimated time**: 1 hour

10. ⚠️ Minimax Video
11. ⚠️ Chroma RAG
12. ⚠️ Weaviate

**Cost**: Varies

---

## Cost Summary

| Phase | Services | Cost/Book | Setup Time |
|-------|----------|-----------|-----------|
| MVP | Qwen + HunyuanVideo + OpenAI | $2.68 | 2-3 hrs |
| Production | + Gemini + Runway + Railway | $3.50 | 1-2 hrs |
| Advanced | + Minimax + Chroma + Weaviate | $4.20+ | 1 hr |

---

## Testing Credentials

Before production deployment, test each service:

```bash
# Test Supabase
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://bzsemrbjwsufesasxmgs.supabase.co/rest/v1/books?limit=1

# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Qwen
curl https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer $QWEN_API_KEY"

# Test Redis
redis-cli -u $REDIS_URL ping

# Test Cloudflare R2
aws s3 ls s3://bookcinema/ \
  --endpoint-url $R2_ENDPOINT \
  --access-key $R2_ACCESS_KEY_ID \
  --secret-key $R2_SECRET_ACCESS_KEY
```

---

## Next Steps

1. **Acquire Qwen2.5-1M API key** (PRIORITY #1)
   - Go to: https://dashscope.console.aliyun.com/
   - Setup time: 5 minutes

2. **Set up Redis** (PRIORITY #2)
   - Go to: https://redis.com/try-free/
   - Setup time: 5 minutes

3. **Configure HunyuanVideo** (PRIORITY #3)
   - Go to: https://huggingface.co/tencent/HunyuanVideo-1.5
   - Setup time: 10 minutes

4. **Add credentials to `.env.local`**
   - Setup time: 2 minutes

5. **Run backend tests**
   - Setup time: 5 minutes

6. **Deploy to Railway**
   - Setup time: 10 minutes

**Total setup time for MVP**: ~40 minutes

---

## Support

- **Qwen Documentation**: https://help.aliyun.com/en/dashscope/
- **HunyuanVideo Documentation**: https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5
- **Supabase Documentation**: https://supabase.com/docs
- **Redis Documentation**: https://redis.io/docs/
- **Cloudflare R2 Documentation**: https://developers.cloudflare.com/r2/

---

**Last Updated**: April 15, 2026
**BookCinema Version**: 4.0
**Status**: Production Ready (pending API keys)
