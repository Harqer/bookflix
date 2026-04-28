# BookCinema — AI Orchestration Architecture & System Design

**Author:** Manus AI  
**Version:** 1.0  
**Date:** April 2026

---

## 1. Executive Summary

BookCinema is an AI-powered platform that transforms books of any length into cinematic video productions. The system ingests raw book text, breaks it into chapters, and applies a multi-agent AI orchestration pipeline that maintains persistent memory of characters, settings, and narrative context across the entire production. Each chapter is converted into a professional screenplay, then into a series of video scenes, resulting in a full-length movie adaptation.

---

## 2. AI Orchestration Architecture

### 2.1 Recommended Framework: LangGraph + CrewAI Hybrid

The recommended orchestration approach combines **LangGraph** for stateful workflow management with **CrewAI** for role-based multi-agent collaboration. This hybrid gives you the best of both worlds: LangGraph's deterministic graph-based state machine ensures chapters are processed in order with full context continuity, while CrewAI's agent roles (Director, Screenwriter, Continuity Supervisor, etc.) provide specialized intelligence at each stage.

| Framework | Role in Pipeline | Strength |
|-----------|-----------------|----------|
| **LangGraph** | Orchestration backbone, state machine | Stateful, resumable, graph-based DAG |
| **CrewAI** | Agent role specialization | Role-based multi-agent teams |
| **LangChain** | LLM abstraction, tool use | Broad model/tool support |
| **Redis** | Shared memory store | Fast in-memory context cache |
| **PostgreSQL** | Persistent world state | Durable character/setting DB |

### 2.2 The Five-Agent Pipeline

```
Book Input
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGENT 1: BOOK ANALYST                     │
│  - Splits book into chapters                                 │
│  - Extracts initial character list, settings, timeline       │
│  - Builds "World Bible" (master context document)            │
└─────────────────────────────────────────────────────────────┘
    │
    ▼ (World Bible → Redis + PostgreSQL)
┌─────────────────────────────────────────────────────────────┐
│                  AGENT 2: CONTINUITY SUPERVISOR              │
│  - Maintains persistent memory across chapters               │
│  - Tracks: characters, locations, props, time, relationships │
│  - Flags continuity errors before script generation          │
│  - Updates World Bible after each chapter                    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼ (Chapter + World Bible snapshot)
┌─────────────────────────────────────────────────────────────┐
│                  AGENT 3: SCREENWRITER                       │
│  - Converts chapter prose to professional screenplay format  │
│  - Uses Blake Snyder Beat Sheet / Save the Cat template      │
│  - Generates: INT/EXT sluglines, action lines, dialogue      │
│  - Respects character voices from World Bible                │
└─────────────────────────────────────────────────────────────┘
    │
    ▼ (Screenplay scenes)
┌─────────────────────────────────────────────────────────────┐
│                  AGENT 4: VISUAL DIRECTOR                    │
│  - Converts scenes to visual prompts for video generation    │
│  - Maintains visual consistency (character appearance)       │
│  - Generates keyframe descriptions for each scene            │
│  - Selects camera angles, lighting, mood                     │
└─────────────────────────────────────────────────────────────┘
    │
    ▼ (Visual prompts + keyframes)
┌─────────────────────────────────────────────────────────────┐
│                  AGENT 5: VIDEO PRODUCER                     │
│  - Calls video generation API (Runway ML / Minimax / Veo3)  │
│  - Chains segments with frame continuity                     │
│  - Assembles final chapter video via FFmpeg                  │
│  - Uploads to S3 storage                                     │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Chapter Video → Final Movie Assembly
```

### 2.3 World Bible Memory Schema

The **World Bible** is the persistent context object that every agent reads and writes. It is stored in Redis (for fast access) and PostgreSQL (for durability).

```json
{
  "bookId": "uuid",
  "title": "The Great Gatsby",
  "genre": "Drama",
  "era": "1920s",
  "characters": {
    "jay_gatsby": {
      "fullName": "Jay Gatsby",
      "aliases": ["James Gatz"],
      "appearance": "Tall, well-dressed, mysterious smile",
      "personality": "Idealistic, obsessive, charming",
      "relationships": { "daisy_buchanan": "romantic obsession" },
      "arc": "Rise and fall of the American Dream",
      "lastSeenChapter": 4,
      "visualPrompt": "1920s man, white suit, slicked hair, confident posture"
    }
  },
  "locations": {
    "west_egg": {
      "description": "New money Long Island mansion district",
      "visualPrompt": "Lavish 1920s mansion, manicured lawns, Long Island Sound",
      "mood": "Opulent but hollow"
    }
  },
  "timeline": {
    "currentDate": "Summer 1922",
    "events": []
  },
  "themes": ["American Dream", "Class", "Obsession"],
  "tone": "Melancholic, nostalgic, romantic",
  "chaptersSummaries": {}
}
```

---

## 3. Screenplay Framework (Template Foundation)

The screenwriter agent uses the **Save the Cat Beat Sheet** as its structural template, adapted for book-to-movie conversion. This is the industry-standard framework used by professional Hollywood screenwriters.

| Beat | Page Range | Description |
|------|-----------|-------------|
| Opening Image | 1 | Visual statement of theme |
| Theme Stated | 5 | What the story is about |
| Set-Up | 1-10 | Establish world, hero, stakes |
| Catalyst | 12 | Inciting incident |
| Debate | 12-25 | Hero resists change |
| Break into Two | 25 | Hero commits to journey |
| B Story | 30 | Love story / thematic mirror |
| Fun & Games | 30-55 | Promise of premise |
| Midpoint | 55 | False victory or defeat |
| Bad Guys Close In | 55-75 | Pressure mounts |
| All Is Lost | 75 | Hero at lowest point |
| Dark Night of Soul | 75-85 | Hero reflects |
| Break into Three | 85 | Solution found |
| Finale | 85-110 | Hero applies new worldview |
| Final Image | 110 | Mirror of opening image |

The AI screenwriter prompt template includes:

```
You are a professional Hollywood screenwriter adapting [BOOK TITLE].
Current chapter: [CHAPTER NUMBER] - [CHAPTER TITLE]

WORLD BIBLE CONTEXT:
[Injected World Bible snapshot]

CHAPTER TEXT:
[Chapter content]

SCREENPLAY FORMAT RULES:
- Use standard screenplay format (INT./EXT., character names in CAPS)
- Each scene should be 1-3 minutes of screen time
- Preserve the author's voice in dialogue
- Maintain character consistency with World Bible
- Flag any continuity issues for the Continuity Supervisor

OUTPUT FORMAT:
{
  "scenes": [...],
  "continuityUpdates": {...},
  "worldBibleChanges": {...}
}
```

---

## 4. GitHub Repositories to Accelerate Production

### 4.1 Core Pipeline Repositories

| Repository | URL | Purpose | Integration |
|-----------|-----|---------|-------------|
| **ttv-pipeline** | github.com/trilogy-group/ttv-pipeline | Long-form text-to-video with Runway/Veo3/Minimax | Video Producer Agent |
| **aiscreenplay** | github.com/ruvnet/aiscreenplay | Screenplay generation from scene templates | Screenwriter Agent base |
| **LangGraph** | github.com/langchain-ai/langgraph | Stateful multi-agent orchestration | Orchestration backbone |
| **CrewAI** | github.com/crewAIInc/crewAI | Role-based agent teams | Agent specialization |
| **Open-Sora** | github.com/hpcaitech/Open-Sora | Open-source video generation | Local GPU fallback |
| **CogVideoX** | github.com/zai-org/CogVideo | Open-source T2V model | Local GPU fallback |

### 4.2 Recommended Upgrades to ttv-pipeline

The `ttv-pipeline` repository handles video generation well but lacks book-to-movie specific features. The following upgrades are recommended:

**Upgrade 1: Chapter-Aware Segmentation**
Replace the single-prompt segmentation with a chapter-aware parser that reads the World Bible before generating visual prompts for each scene.

**Upgrade 2: Character Consistency Engine**
Add a character embedding cache that stores reference images for each character after their first appearance, then uses image-to-image generation to maintain visual consistency across all subsequent scenes.

**Upgrade 3: Narrative Pacing Controller**
Add a pacing module that adjusts scene duration based on the emotional weight of each moment (action scenes: shorter clips; emotional scenes: longer, slower cuts).

**Upgrade 4: Audio Layer**
Integrate ElevenLabs or Kokoro TTS for character voice generation, and Suno/Udio for background score generation per chapter mood.

---

## 5. Backend Architecture for Enterprise Scaling

### 5.1 Recommended Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **API Server** | Node.js + tRPC + Express | Type-safe, already in template |
| **Job Queue** | BullMQ + Redis | Reliable async processing for long AI tasks |
| **Database** | PostgreSQL (TiDB for scale) | Relational, handles World Bible state |
| **Cache** | Redis | World Bible hot cache, rate limiting |
| **File Storage** | S3-compatible (Cloudflare R2) | Cheapest S3-compatible at $0.015/GB |
| **Video CDN** | Cloudflare Stream | $5/1000 min stored, global edge delivery |
| **Deployment** | Railway.app or Fly.io | Git-push deploy, usage-based billing |
| **Monitoring** | Sentry + Grafana | Error tracking + metrics |

### 5.2 Job Queue Architecture (BullMQ)

Long AI tasks (book processing, video generation) must never block the API. The BullMQ queue system handles this:

```
API Request → BullMQ Queue → Worker Pool → AI APIs → S3 Storage
     │              │              │
     │         Redis Store    Auto-retry
     │              │         (3 attempts)
     └── Job ID ────┘
         returned to client
         
Client polls: GET /api/jobs/:jobId/status
```

**Queue Priorities:**
- `book-analysis`: Priority 10 (fast, runs first)
- `screenplay-generation`: Priority 8 (chapter by chapter)
- `video-generation`: Priority 5 (slow, expensive, batched)
- `video-assembly`: Priority 3 (final step)

### 5.3 Caching Strategy

| Cache Layer | TTL | What is Cached |
|------------|-----|----------------|
| World Bible | 24h | Character/setting context per book |
| Chapter Screenplay | 7d | Generated scripts (immutable after approval) |
| Video Prompts | 7d | Visual prompts per scene |
| Generated Images | 30d | Keyframe images for character consistency |
| User Sessions | 1h | Auth tokens |

### 5.4 Cost Estimation (Enterprise Scale)

| Service | Cost | Notes |
|---------|------|-------|
| Railway.app (API) | $20/mo base | Scales to $0.000463/vCPU-s |
| TiDB Serverless | $0/mo (5GB free) | $0.15/GB after |
| Cloudflare R2 | $0.015/GB/mo | No egress fees |
| Cloudflare Stream | $5/1000 min | Video hosting |
| Runway ML API | $0.05/sec video | ~$3/min of video |
| Redis (Upstash) | $0/mo (10K req/day) | $0.2/100K after |
| **Total (100 books/mo)** | **~$150-300/mo** | Scales linearly |

### 5.5 Security Architecture

| Threat | Mitigation |
|--------|-----------|
| API abuse | Rate limiting via Redis (100 req/min per user) |
| Prompt injection | Input sanitization + system prompt hardening |
| File upload attacks | MIME type validation + virus scanning |
| Data leakage | Row-level security in DB (userId checks) |
| API key exposure | All keys server-side only, never in client |
| DDoS | Cloudflare WAF + rate limiting |
| OWASP Top 10 | Input validation via Zod schemas |

---

## 6. Deployment Recommendation

### Option A: Railway.app (Recommended for Startups)
- Git-push deployment with zero DevOps
- Built-in PostgreSQL and Redis
- Usage-based billing (pay only for what you use)
- Auto-scaling with no cold starts

### Option B: Fly.io (Recommended for Global Scale)
- Deploy to 35+ regions worldwide
- Persistent volumes for model weights
- Fine-grained machine sizing
- Better for GPU workloads

### Option C: AWS ECS + Fargate (Enterprise)
- Full control, enterprise SLAs
- Spot instances for video generation workers (70% cost reduction)
- EFS for shared model storage
- CloudFront for video CDN

---

## 7. Mobile App Screen Architecture

The BookCinema mobile app has the following screens:

1. **Home** — Featured productions, recent books, quick-start CTA
2. **Library** — User's book collection with processing status
3. **Book Detail** — Book info, chapter list, overall progress
4. **Chapter View** — Chapter screenplay + video player
5. **Submit Book** — Text input, file upload, metadata form
6. **Processing** — Real-time pipeline progress visualization
7. **World Bible** — Character cards, location gallery, timeline
8. **Settings** — Theme, notifications, API preferences
9. **Explore** — Community productions (future feature)

---

*This document serves as the living architecture reference for the BookCinema platform.*
