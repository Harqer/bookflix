# BookCinema GPU Provisioning Strategy

## Objective
Minimize costs while maintaining production capability for LongFormVideoCat and Matrix-3D deployment.

---

## Option Comparison

### Option 1: Free GPU Tier (Recommended for MVP)
**Best for**: Testing and low-volume production

| Provider | GPU | VRAM | Cost | Availability | Latency |
|----------|-----|------|------|--------------|---------|
| **Google Colab** | T4/A100 | 16GB/40GB | Free (12 hrs/day) | Limited | Low |
| **Kaggle Notebooks** | P100/T4 | 16GB | Free (20 hrs/week) | Limited | Low |
| **Hugging Face Spaces** | T4 | 16GB | Free | Limited | Medium |
| **Paperspace Gradient** | Free tier | 8GB | Free (6 hrs/month) | Very limited | Medium |

**Best choice for MVP: Google Colab + Kaggle** (combined ~40 free GPU hours/week)

### Option 2: Spot Instance (Budget Production)
**Best for**: Scaling to 5-10 books/month

| Provider | GPU | VRAM | Cost | Availability | Latency |
|----------|-----|------|------|--------------|---------|
| **AWS Spot** | A100 | 40GB | $0.35/hr | 70% | Low |
| **Google Cloud Spot** | A100 | 40GB | $0.30/hr | 80% | Low |
| **Azure Spot** | A100 | 40GB | $0.32/hr | 75% | Low |
| **Vast.ai Spot** | A100 | 40GB | $0.20/hr | 60% | Medium |

**Best choice for budget: Vast.ai Spot** ($0.20/hr = $4.80/day)

### Option 3: Hybrid (Recommended for Production)
**Best for**: 10+ books/month with guaranteed uptime

| Component | Solution | Cost | Purpose |
|-----------|----------|------|---------|
| **Primary** | Vast.ai Spot (2× A100) | $0.40/hr | Main production |
| **Fallback** | Google Colab | Free | Burst capacity |
| **Backup** | AWS Spot | $0.35/hr | Emergency |

**Monthly cost: ~$288** (assuming 20 hrs/day average usage)

---

## 🏛️ The Hybrid Sovereign Model (2026.05 Update)
To optimize production speed and reduce infrastructure overhead, BookCinema has adopted a hybrid approach for model deployment:

### 1. Sovereign-Cloud (NIM-Resident)
**Models**: `LongCatVideo`, `NVIDIA Cosmos`, `DiffuMan`
**Strategy**: These models are called directly from Vercel/Convex via **NVIDIA NIM Cloud APIs**. 
**Benefit**: No local weight siphoning (200GB+ savings); instant scalability for non-specialized visual generation.

### 2. Sovereign-Local (Cluster-Resident)
**Models**: `RigGS` (Maya), `Ludus` (Unreal), `PDG/Karma` (Houdini)
**Strategy**: These are hosted on the **Private GPU Cluster** (H200 fleet) because they require direct RPC/binary integration with the DCC platforms.
**Benefit**: Zero-latency character rigging, motion-to-sim handoffs, and final theatrical rendering.

---

## Recommended Strategy: Hybrid Approach

### Phase 1: MVP (Free Tier)
**Timeline**: Weeks 1-2
**Cost**: $0
**Capacity**: 1-2 books/month

```
Google Colab (12 hrs/day free)
    ↓
Kaggle Notebooks (20 hrs/week free)
    ↓
Total: ~40 free GPU hours/week
```

**Setup**:
1. Create Google Colab notebook for LongFormVideoCat
2. Create Kaggle notebook for Matrix-3D
3. Use Supabase for job queue
4. Manual orchestration via cron jobs

### Phase 2: Budget Production (Spot Instances)
**Timeline**: Weeks 3-4
**Cost**: $4.80/day (~$144/month)
**Capacity**: 5-10 books/month

```
Vast.ai Spot (2× A100 @ $0.20/hr)
    ↓
Automatic job queue (BullMQ + Redis)
    ↓
Auto-scaling based on queue depth
```

**Setup**:
1. Rent 2× A100 from Vast.ai
2. Deploy LongFormVideoCat container
3. Deploy Matrix-3D container
4. Set up BullMQ job queue
5. Auto-restart failed jobs

### Phase 3: Enterprise (Guaranteed Uptime)
**Timeline**: Month 2+
**Cost**: $288/month
**Capacity**: 50+ books/month

```
Vast.ai Spot (Primary)
    ↓ (Fallback on failure)
AWS Spot (Backup)
    ↓ (Burst capacity)
Google Colab (Emergency)
```

---

## Implementation Plan

### Week 1: Free Tier Setup

#### Step 1: Google Colab Setup
```python
# Google Colab notebook for LongFormVideoCat
!pip install requests torch transformers
!git clone https://github.com/meituan-longcat/LongCat-Video
%cd LongCat-Video

# Download models
!huggingface-cli download meituan-longcat/LongCat-Video --local-dir ./weights/LongCat-Video

# Create inference wrapper
def generate_video(prompt, duration=10):
    # LongFormVideoCat inference code
    pass

# Expose via ngrok for API access
!pip install pyngrok
from pyngrok import ngrok
ngrok.connect(5000)
```

#### Step 2: Kaggle Notebook Setup
```python
# Kaggle notebook for Matrix-3D
!pip install torch torchvision
!git clone --recursive https://github.com/SkyworkAI/Matrix-3D
%cd Matrix-3D

# Download models
!python code/download_checkpoints.py

# Create inference wrapper
def generate_scene(prompt, output_dir):
    # Matrix-3D inference code
    pass
```

// server/gpu-cluster-client.ts
export class GPUClusterClient {
  private nimEndpoint: string; // Global Sovereign NIM Endpoint

  constructor() {
    this.nimEndpoint = process.env.NVIDIA_NIM_ENDPOINT || "https://api.bookcinema.ai/v1/nif";
  }

  async generateVideo(prompt: string, duration: number): Promise<string> {
    const response = await fetch(`${this.nimEndpoint}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, duration, model: "LongVideoCat-LLM" })
    });
    return response.json();
  }
}

### Week 2-3: Spot Instance Migration

#### Step 1: Vast.ai Setup
```bash
# 1. Go to https://vast.ai/
# 2. Sign up and add payment method
# 3. Search for: "A100 40GB" + "Ubuntu 22.04"
# 4. Rent 2 instances @ $0.20/hr each
# 5. SSH into instances

# On each Vast.ai instance:
git clone https://github.com/meituan-longcat/LongCat-Video
cd LongCat-Video
./install.sh
huggingface-cli download meituan-longcat/LongCat-Video --local-dir ./weights/LongCat-Video

# Start NVIDIA NIM Microservice
# The model is exposed as a scalable, load-balanced API endpoint on the H200 cluster.
python -m nim_service.launch --model LongVideoCat-LLM --scale-target 0.8
```

#### Step 2: Docker Containerization
```dockerfile
# Dockerfile.longvideocat-llm
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04

WORKDIR /app
RUN apt-get update && apt-get install -y python3.10 python3-pip git
RUN pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124

RUN git clone https://github.com/meituan-longcat/LongCat-Video
WORKDIR /app/LongCat-Video
RUN pip install -r requirements.txt
RUN huggingface-cli download meituan-longcat/LongVideoCat-7B --local-dir ./weights/LongVideoCat-7B

COPY server.py .
CMD ["python", "server.py"]
```

#### Step 3: Job Queue Setup
```typescript
// server/job-queue.ts
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const videoGenerationQueue = new Queue('video-generation', {
  redis: redis
});

export const sceneGenerationQueue = new Queue('scene-generation', {
  redis: redis
});

// Process video generation jobs
videoGenerationQueue.process(async (job) => {
  const { prompt, duration, bookId, chapterId } = job.data;
  
  try {
    const videoPath = await gpuClient.generateVideo(prompt, duration);
    
    // Save to database
    await db.upsertVideoScene({
      bookId,
      chapterId,
      videoPath,
      status: 'completed'
    });
    
    return { success: true, videoPath };
  } catch (error) {
    throw error; // Retry automatically
  }
});

// Process scene generation jobs
sceneGenerationQueue.process(async (job) => {
  const { prompt, outputDir, bookId, sceneId } = job.data;
  
  try {
    const scenePath = await gpuClient.generateScene(prompt, outputDir);
    
    // Save to database
    await db.upsertScene({
      bookId,
      sceneId,
      scenePath,
      status: 'completed'
    });
    
    return { success: true, scenePath };
  } catch (error) {
    throw error; // Retry automatically
  }
});
```

---

## Cost Analysis

### Scenario 1: 1 Book/Month
| Phase | GPU Hours | Cost | Provider |
|-------|-----------|------|----------|
| MVP | 20 hrs | $0 | Google Colab |
| **Total** | | **$0** | |

### Scenario 2: 5 Books/Month
| Phase | GPU Hours | Cost | Provider |
|-------|-----------|------|----------|
| Spot | 100 hrs | $20 | Vast.ai |
| **Total** | | **$20** | |

### Scenario 3: 20 Books/Month
| Phase | GPU Hours | Cost | Provider |
|-------|-----------|------|----------|
| Spot (Primary) | 400 hrs | $80 | Vast.ai |
| Spot (Backup) | 100 hrs | $35 | AWS |
| **Total** | | **$115** | |

---

## Free Tier Limitations & Workarounds

| Limitation | Workaround |
|-----------|-----------|
| 12 hrs/day Colab limit | Use Kaggle + Colab rotation |
| Session timeout | Implement auto-reconnect + job persistence |
| No persistent storage | Use Cloudflare R2 for output |
| Rate limits | Stagger job submissions via queue |
| GPU preemption | Implement checkpoint/resume logic |

---

## Recommended Implementation Order

### Week 1 (Free Tier MVP)
- [ ] Set up Google Colab notebook for LongFormVideoCat
- [ ] Set up Kaggle notebook for Matrix-3D
- [ ] Create ngrok tunnels for API access
- [ ] Integrate with BookCinema via HTTP clients
- [ ] Test with sample book (50 pages)

### Week 2 (Spot Instance Setup)
- [ ] Create Vast.ai account
- [ ] Rent 2× A100 instances
- [ ] Deploy Docker containers
- [ ] Set up BullMQ job queue
- [ ] Implement auto-scaling logic

### Week 3 (Production Testing)
- [ ] Test with 300-page book
- [ ] Validate video quality
- [ ] Optimize performance
- [ ] Set up monitoring/alerting
- [ ] Document deployment process

### Week 4+ (Enterprise Scale)
- [ ] Add AWS Spot fallback
- [ ] Implement multi-region support
- [ ] Set up auto-scaling policies
- [ ] Create CI/CD pipeline for GPU deployments

---

## API Integration

### LongFormVideoCat API Wrapper
```typescript
// server/longformvideocat-client.ts
export class LongFormVideoCatClient {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async generateVideo(
    prompt: string,
    duration: number,
    resolution: 'low' | 'medium' | 'high' = 'high'
  ): Promise<string> {
    const response = await fetch(`${this.endpoint}/api/generate-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        duration,
        resolution,
        format: 'mp4'
      })
    });

    if (!response.ok) {
      throw new Error(`LongFormVideoCat API error: ${response.statusText}`);
    }

    const { video_url } = await response.json();
    return video_url;
  }

  async continueVideo(
    previousVideoUrl: string,
    prompt: string,
    duration: number
  ): Promise<string> {
    const response = await fetch(`${this.endpoint}/api/continue-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        previous_video_url: previousVideoUrl,
        prompt,
        duration
      })
    });

    if (!response.ok) {
      throw new Error(`LongFormVideoCat API error: ${response.statusText}`);
    }

    const { video_url } = await response.json();
    return video_url;
  }
}
```

### Matrix-3D API Wrapper
```typescript
// server/matrix3d-client.ts
export class Matrix3DClient {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async generateScene(
    prompt: string,
    outputDir: string,
    resolution: 480 | 720 = 720
  ): Promise<SceneOutput> {
    const response = await fetch(`${this.endpoint}/api/generate-scene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        output_dir: outputDir,
        resolution
      })
    });

    if (!response.ok) {
      throw new Error(`Matrix-3D API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      plyPath: result.ply_path,
      videoPath: result.video_path,
      outputDir: result.output_dir
    };
  }
}
```

---

## Monitoring & Alerts

```typescript
// server/gpu-monitoring.ts
import * as Sentry from '@sentry/node';

export class GPUMonitor {
  async checkClusterHealth(): Promise<ClusterStatus> {
    const colabStatus = await this.checkColab();
    const kaggleStatus = await this.checkKaggle();
    const vastStatus = await this.checkVast();

    const allHealthy = colabStatus && kaggleStatus && vastStatus;

    if (!allHealthy) {
      Sentry.captureMessage('GPU cluster degraded', 'warning');
    }

    return {
      colab: colabStatus,
      kaggle: kaggleStatus,
      vast: vastStatus,
      healthy: allHealthy
    };
  }

  private async checkColab(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.COLAB_ENDPOINT}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkKaggle(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.KAGGLE_ENDPOINT}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkVast(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.VAST_ENDPOINT}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

## Summary

**Best Strategy for Your Constraints:**

1. **Week 1**: Use free Google Colab + Kaggle (cost: $0)
2. **Week 2**: Migrate to Vast.ai Spot instances (cost: $4.80/day)
3. **Week 3+**: Add AWS Spot fallback for reliability (cost: +$0.35/hr)

**Total cost for 300-page book test**: $0 (free tier)
**Ongoing cost per book**: ~$0.65 (on Vast.ai)

---

**Last Updated**: April 16, 2026
**BookCinema Version**: 4.2
**Status**: Ready for GPU provisioning
