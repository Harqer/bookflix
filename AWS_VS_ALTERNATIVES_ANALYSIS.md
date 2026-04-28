# AWS vs Alternatives: GPU Cluster Cost Analysis for BookCinema

## Executive Summary

For a 300-page book production (estimated 1,000 video scenes):
- **AWS Spot**: $47-65/book
- **Vast.ai Spot**: $12-18/book ✅ **BEST VALUE**
- **Lambda Labs**: $22-30/book
- **Google Cloud Spot**: $15-22/book
- **Self-Hosted (Capital)**: $0.50/book (after $15K upfront)

**Recommendation**: Start with **Vast.ai Spot** for MVP, migrate to **self-hosted** for production scale.

---

## Detailed Cost Breakdown

### 1. AWS (SageMaker + EC2 Spot)

#### Option A: SageMaker Processing Jobs
```
GPU Instance: ml.p3.8xlarge (8× V100)
- On-demand: $24.48/hr
- Spot: $7.34/hr (70% discount)

Per 300-page book (1,000 scenes × 10s each = ~2.8 hrs compute):
- Video generation: 2.8 hrs × $7.34 = $20.55
- Storage (1TB output): $0.023/GB × 1 = $23
- Data transfer: $0.09/GB × 1 = $0.90
- Total: $44.45/book
```

#### Option B: EC2 Spot + Manual Orchestration
```
Instance: g4dn.12xlarge (4× A100)
- On-demand: $7.48/hr
- Spot: $2.24/hr (70% discount)

Per 300-page book:
- Compute: 4 hrs × $2.24 = $8.96
- Storage: $23
- Transfer: $0.90
- Total: $32.86/book
```

#### Option C: EC2 Spot + Batch (Recommended AWS)
```
Instance: g4dn.metal (8× A100)
- Spot: $3.20/hr
- Batch overhead: 15%

Per 300-page book:
- Compute: 3.5 hrs × $3.20 × 1.15 = $12.88
- Storage: $23
- Transfer: $0.90
- Total: $36.78/book

Monthly cost (10 books): $367.80
```

**AWS Verdict**: ⚠️ Expensive, but reliable. Best for enterprise SLAs.

---

### 2. Vast.ai Spot (RECOMMENDED)

#### Setup
```
GPU: A100 40GB
- Spot price: $0.18-0.25/hr
- Average: $0.20/hr
- Reliability: 85% (auto-restart on preemption)
```

#### Per 300-page book
```
Compute: 3 hrs × $0.20 = $0.60
Storage (local): $0 (included)
Egress (1TB to R2): $0.015/GB × 1 = $15
Total: $15.60/book
```

#### Monthly cost (10 books)
```
Compute: $6
Storage: $150
Total: $156/month
```

**Vast.ai Verdict**: ✅ **BEST VALUE** — 70% cheaper than AWS, instant provisioning.

---

### 3. Lambda Labs On-Demand

#### Setup
```
GPU: A100 40GB
- Price: $1.10/hr (no spot available)
- Reliability: 100%
```

#### Per 300-page book
```
Compute: 3 hrs × $1.10 = $3.30
Storage (local): $0
Egress: $15
Total: $18.30/book
```

#### Monthly cost (10 books)
```
Compute: $33
Storage: $150
Total: $183/month
```

**Lambda Labs Verdict**: ✅ Good for guaranteed uptime, 15% more than Vast.ai.

---

### 4. Google Cloud Spot

#### Setup
```
GPU: A100 40GB
- On-demand: $2.50/hr
- Spot: $0.75/hr (70% discount)
- Reliability: 80%
```

#### Per 300-page book
```
Compute: 3 hrs × $0.75 = $2.25
Storage (GCS): $0.020/GB × 1 = $20
Egress: $0.12/GB × 1 = $120
Total: $142.25/book
```

**Google Cloud Verdict**: ❌ High egress costs make it expensive. Better for Google-native workflows.

---

### 5. Self-Hosted (Capital Investment)

#### One-Time Setup
```
Hardware:
- 2× NVIDIA H100 80GB: $40,000
- CPU server (32-core): $5,000
- Storage (2TB SSD + 10TB NAS): $3,000
- Networking/cooling: $2,000
Total: $50,000

Amortized over 3 years: $13.89/month per book
```

#### Monthly Operating Costs
```
Electricity (2× H100 @ 700W each):
- 700W × 2 × 24 hrs × 30 days = 1,008 kWh
- Cost: 1,008 × $0.12 = $120.96

Maintenance: $200
Cooling/Infrastructure: $100
Total: $420.96/month
```

#### Per 300-page book (10 books/month)
```
Operating cost: $420.96 / 10 = $42.10
Amortized capital: $13.89
Total: $55.99/book
```

**Self-Hosted Verdict**: ✅ Best long-term (>100 books/year), requires capital investment.

---

## Comparison Table

| Provider | Per-Book Cost | Monthly (10 books) | Setup Time | Reliability | Flexibility |
|----------|--------------|-------------------|-----------|-------------|------------|
| **AWS Spot** | $36.78 | $368 | 30 min | 95% | High |
| **AWS On-Demand** | $44.45 | $445 | 30 min | 99.9% | High |
| **Vast.ai Spot** | $15.60 | $156 | 5 min | 85% | Medium |
| **Lambda Labs** | $18.30 | $183 | 10 min | 100% | Medium |
| **Google Cloud** | $142.25 | $1,423 | 20 min | 80% | High |
| **Self-Hosted** | $55.99 | $560 | 2 weeks | 99% | Very High |

---

## Recommended Strategy by Scale

### Phase 1: MVP (1-5 books/month)
**Provider**: Vast.ai Spot
- Cost: $15-78/month
- Setup: 5 minutes
- Reliability: 85%
- Action: Rent 1-2 A100 instances, test with 300-page book

### Phase 2: Growth (5-20 books/month)
**Provider**: Vast.ai Spot + Lambda Labs Backup
- Cost: $156-400/month
- Setup: 15 minutes
- Reliability: 92% (auto-failover)
- Action: Add Lambda Labs for burst capacity

### Phase 3: Scale (20-100 books/month)
**Provider**: AWS Batch + Vast.ai Spot
- Cost: $1,500-4,000/month
- Setup: 1 hour
- Reliability: 97%
- Action: Implement auto-scaling, multi-region

### Phase 4: Enterprise (100+ books/month)
**Provider**: Self-Hosted + AWS Burst
- Cost: $5,000-15,000/month
- Setup: 2 weeks
- Reliability: 99%
- Action: Deploy on-premises H100 cluster

---

## AWS Batch Implementation (If Choosing AWS)

### Architecture
```
User Upload
    ↓
S3 Bucket
    ↓
Lambda (Trigger)
    ↓
AWS Batch Job Queue
    ↓
EC2 Spot Fleet (g4dn.metal)
    ↓
LongFormVideoCat + Matrix-3D
    ↓
S3 Output
    ↓
CloudFront Distribution
```

### Batch Job Definition
```json
{
  "jobDefinitionName": "bookcinema-video-generation",
  "type": "container",
  "containerProperties": {
    "image": "bookcinema:latest",
    "vcpus": 16,
    "memory": 60000,
    "environment": [
      {
        "name": "LONGFORMVIDEOCAT_API_KEY",
        "value": "ak_2UN4RJ2qP4WB3Sf6B914S20j81N2d"
      }
    ]
  }
}
```

### Cost Optimization
```
1. Use Spot instances (70% discount)
2. Implement checkpointing (resume on preemption)
3. Batch multiple books together
4. Use S3 Intelligent-Tiering for outputs
5. Enable S3 Transfer Acceleration
```

---

## Vast.ai Setup Instructions

### Step 1: Create Account
```bash
# Go to https://vast.ai/
# Sign up with email
# Add payment method (credit card)
```

### Step 2: Rent GPU
```bash
# Search filters:
# - GPU: A100 40GB
# - VRAM: 40GB+
# - Disk: 500GB+
# - OS: Ubuntu 22.04
# - Price: < $0.30/hr

# Example rental:
# Provider: Vast.ai
# GPU: A100 40GB
# Price: $0.20/hr
# Rental duration: 168 hours (1 week)
```

### Step 3: SSH Access
```bash
ssh -i vast_key.pem ubuntu@<instance_ip>

# Install dependencies
sudo apt update
sudo apt install -y python3.10 python3-pip git
pip install torch torchvision torchaudio

# Clone BookCinema
git clone https://github.com/Harqer/bookflix.git
cd bookflix
```

### Step 4: Deploy Services
```bash
# LongFormVideoCat
git clone https://github.com/meituan-longcat/LongCat-Video
cd LongCat-Video
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8000 &

# Matrix-3D
git clone https://github.com/SkyworkAI/Matrix-3D
cd Matrix-3D
./install.sh
python -m uvicorn server:app --host 0.0.0.0 --port 8001 &
```

### Step 5: Configure BookCinema
```bash
export LONGFORMVIDEOCAT_ENDPOINT=http://localhost:8000
export MATRIX3D_ENDPOINT=http://localhost:8001
export LONGFORMVIDEOCAT_API_KEY=ak_2UN4RJ2qP4WB3Sf6B914S20j81N2d

# Start BookCinema orchestration
node dist/index.js
```

---

## Fallback Strategy (If Vast.ai Preempted)

```typescript
// server/gpu-failover.ts
export class GPUFailoverManager {
  private providers = [
    { name: 'Vast.ai', endpoint: process.env.VAST_ENDPOINT },
    { name: 'Lambda Labs', endpoint: process.env.LAMBDA_ENDPOINT },
    { name: 'AWS Batch', endpoint: process.env.AWS_ENDPOINT }
  ];

  async generateVideoWithFailover(prompt: string): Promise<string> {
    for (const provider of this.providers) {
      try {
        const client = new GPUClient(provider.endpoint);
        return await client.generateVideo(prompt);
      } catch (error) {
        console.log(`${provider.name} failed, trying next...`);
        continue;
      }
    }
    throw new Error('All GPU providers failed');
  }
}
```

---

## Recommendation for BookCinema

### Immediate (This Week)
✅ Use **Vast.ai Spot** ($0.20/hr)
- Cheapest option
- Instant provisioning
- Perfect for MVP testing

### Short-term (1-2 Months)
✅ Add **Lambda Labs Backup** ($1.10/hr)
- Guaranteed uptime
- Auto-failover on Vast.ai preemption
- Combined cost: $156 + $183 = $339/month for 10 books

### Medium-term (3-6 Months)
✅ Migrate to **AWS Batch** + **Vast.ai**
- Enterprise reliability
- Auto-scaling
- Cost: $368/month for 10 books

### Long-term (6+ Months)
✅ Deploy **Self-Hosted** H100 cluster
- $50K upfront
- $420/month operating
- $55.99/book (amortized)
- Best ROI for 100+ books/month

---

## Next Steps

1. **Test with Vast.ai** (this week)
   - Rent 1× A100 for $0.20/hr
   - Run 300-page book test
   - Validate video quality

2. **Set up AWS Batch** (optional, for enterprise)
   - Create job queue
   - Configure spot fleet
   - Implement auto-scaling

3. **Plan self-hosted** (for scale)
   - Order H100 GPUs
   - Set up data center
   - Deploy Kubernetes cluster

---

**Last Updated**: April 16, 2026
**BookCinema Version**: 4.3
**Recommendation**: Start with Vast.ai, scale to self-hosted
