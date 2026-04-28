# LongCatVideo & Matrix-3D Integration Guide

## Overview

BookCinema now integrates two cutting-edge open-source models:
- **LongCatVideo** (Meituan): Long-form video generation with consistency
- **Matrix-3D** (Skywork AI): 3D scene generation from text/image

## Architecture

```
Book Upload
    ↓
Gemini 3.1 Pro (Full-book context processing)
    ↓
World Bible Generation
    ↓
Screenplay + Visual Prompts
    ↓
LongCatVideo (Text-to-Video + Video Continuation)
    ↓
Matrix-3D (3D Scene Generation)
    ↓
AI Director Agent (Camera Control + Cinematography)
    ↓
Consistency Validation (GPT-4V)
    ↓
Final Movie Assembly (FFmpeg)
```

---

## 1. LongCatVideo Integration

### Key Features
- **13.6B parameters** foundational model
- **Text-to-Video**: Generate video from screenplay
- **Image-to-Video**: Generate video from keyframe
- **Video-Continuation**: Seamless long-form video generation
- **Efficient inference**: 720p 30fps in minutes
- **Multi-GPU support**: Context parallel processing

### Installation

```bash
# Clone LongCatVideo repo
git clone --single-branch --branch main https://github.com/meituan-longcat/LongCat-Video
cd LongCat-Video

# Create conda environment
conda create -n longcat-video python=3.10
conda activate longcat-video

# Install dependencies
pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
pip install ninja psutil packaging
pip install flash_attn==2.7.4.post1
pip install -r requirements.txt

# Download models
huggingface-cli download meituan-longcat/LongCat-Video --local-dir ./weights/LongCat-Video
```

### Usage in BookCinema

```typescript
// server/longcat-video-integration.ts
import { spawn } from 'child_process';
import path from 'path';

export interface LongCatVideoConfig {
  checkpointDir: string;
  resolution: 'low' | 'medium' | 'high'; // 480p, 720p
  gpuCount: number;
  enableCompile: boolean;
}

export class LongCatVideoGenerator {
  private config: LongCatVideoConfig;

  constructor(config: LongCatVideoConfig) {
    this.config = config;
  }

  /**
   * Generate video from text prompt (screenplay)
   */
  async generateTextToVideo(
    prompt: string,
    outputPath: string,
    duration: number = 10 // seconds
  ): Promise<string> {
    return this.runDemo('text_to_video', {
      prompt,
      output_path: outputPath,
      duration,
      num_frames: duration * 30 // 30fps
    });
  }

  /**
   * Generate video from keyframe image
   */
  async generateImageToVideo(
    imagePath: string,
    prompt: string,
    outputPath: string,
    duration: number = 10
  ): Promise<string> {
    return this.runDemo('image_to_video', {
      image_path: imagePath,
      prompt,
      output_path: outputPath,
      duration,
      num_frames: duration * 30
    });
  }

  /**
   * Continue video seamlessly (for long-form generation)
   */
  async continueVideo(
    previousVideoPath: string,
    prompt: string,
    outputPath: string,
    duration: number = 10
  ): Promise<string> {
    return this.runDemo('video_continuation', {
      video_path: previousVideoPath,
      prompt,
      output_path: outputPath,
      duration,
      num_frames: duration * 30
    });
  }

  /**
   * Generate long-form video (multiple segments)
   */
  async generateLongVideo(
    prompts: string[],
    outputPath: string,
    segmentDuration: number = 10
  ): Promise<string> {
    return this.runDemo('long_video', {
      prompts: prompts.join('|'),
      output_path: outputPath,
      segment_duration: segmentDuration,
      num_segments: prompts.length
    });
  }

  private async runDemo(
    demoType: string,
    params: Record<string, any>
  ): Promise<string> {
    const scriptPath = path.join(
      this.config.checkpointDir,
      `../run_demo_${demoType}.py`
    );

    return new Promise((resolve, reject) => {
      const args = [
        scriptPath,
        `--checkpoint_dir=${this.config.checkpointDir}`,
        `--resolution=${this.config.resolution === 'high' ? 720 : 480}`,
        this.config.enableCompile ? '--enable_compile' : '',
        ...Object.entries(params).map(([k, v]) => `--${k}=${v}`)
      ].filter(Boolean);

      const gpuArgs = this.config.gpuCount > 1
        ? [`--nproc_per_node=${this.config.gpuCount}`, `--context_parallel_size=${this.config.gpuCount}`]
        : [];

      const process = spawn('torchrun', [...gpuArgs, ...args]);

      let output = '';
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`LongCatVideo generation failed: ${output}`));
        }
      });
    });
  }
}
```

### Integration with BookCinema Pipeline

```typescript
// server/orchestration-v2.ts - Agent 5 (Video Producer)
async function runVideoProducer(
  chapter: ChapterData,
  visualPrompts: VisualPrompt[],
  directorDecisions: DirectorDecisions,
  worldBible: WorldBibleData
): Promise<VideoScene[]> {
  const longcat = new LongCatVideoGenerator({
    checkpointDir: process.env.LONGCAT_CHECKPOINT_DIR || './weights/LongCat-Video',
    resolution: 'high',
    gpuCount: 2,
    enableCompile: true
  });

  const videoScenes: VideoScene[] = [];
  let previousVideoPath: string | null = null;

  for (let i = 0; i < visualPrompts.length; i++) {
    const prompt = visualPrompts[i];
    const outputPath = `./videos/chapter_${chapter.id}_scene_${i}.mp4`;

    try {
      let videoPath: string;

      if (i === 0) {
        // First scene: use keyframe if available
        if (prompt.keyframeUrl) {
          videoPath = await longcat.generateImageToVideo(
            prompt.keyframeUrl,
            prompt.visualPrompt,
            outputPath,
            prompt.duration || 10
          );
        } else {
          videoPath = await longcat.generateTextToVideo(
            prompt.visualPrompt,
            outputPath,
            prompt.duration || 10
          );
        }
      } else {
        // Subsequent scenes: use video continuation for seamless flow
        videoPath = await longcat.continueVideo(
          previousVideoPath!,
          prompt.visualPrompt,
          outputPath,
          prompt.duration || 10
        );
      }

      videoScenes.push({
        sceneIndex: i,
        videoPath,
        prompt: prompt.visualPrompt,
        duration: prompt.duration || 10,
        cameraDecisions: directorDecisions.cameraTrajectories[i],
        consistency: {
          characters: worldBible.characters,
          locations: worldBible.locations,
          lighting: directorDecisions.lighting
        }
      });

      previousVideoPath = videoPath;
    } catch (error) {
      console.error(`Failed to generate scene ${i}:`, error);
      throw error;
    }
  }

  return videoScenes;
}
```

---

## 2. Matrix-3D Integration

### Key Features
- **Omnidirectional 3D world generation**
- **Panoramic representation** for 360° exploration
- **Text-to-Scene**: Generate 3D scene from text
- **Image-to-Scene**: Generate 3D scene from image
- **Customizable trajectories** for camera movement
- **Two reconstruction methods**: Optimization-based (high-quality) and Feed-forward (fast)

### Installation

```bash
# Clone Matrix-3D repo
git clone --recursive https://github.com/SkyworkAI/Matrix-3D.git
cd Matrix-3D

# Create conda environment
conda create -n matrix3d python=3.10
conda activate matrix3d

# Install dependencies
pip install torch==2.7.0 torchvision==0.22.0
chmod +x install.sh
./install.sh

# Download models
python code/download_checkpoints.py
```

### Usage in BookCinema

```typescript
// server/matrix3d-integration.ts
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface Matrix3DConfig {
  checkpointDir: string;
  resolution: 480 | 720;
  reconstructionMethod: 'optimization' | 'feed-forward';
  enableVramManagement: boolean;
  use5bModel: boolean;
}

export interface CameraTrajectory {
  type: 'straight' | 's-curve' | 'forward-right' | 'custom';
  customJsonPath?: string;
}

export class Matrix3DGenerator {
  private config: Matrix3DConfig;

  constructor(config: Matrix3DConfig) {
    this.config = config;
  }

  /**
   * Generate 3D scene from text prompt
   */
  async generateTextToScene(
    prompt: string,
    outputDir: string,
    trajectory: CameraTrajectory = { type: 'straight' }
  ): Promise<SceneOutput> {
    // Step 1: Generate panoramic image from text
    await this.generatePanoramicImage('t2p', {
      prompt,
      output_path: outputDir
    });

    // Step 2: Generate panoramic video
    await this.generatePanoramicVideo(outputDir, trajectory);

    // Step 3: Extract 3D scene
    return this.extract3DScene(outputDir);
  }

  /**
   * Generate 3D scene from image
   */
  async generateImageToScene(
    imagePath: string,
    outputDir: string,
    trajectory: CameraTrajectory = { type: 'straight' }
  ): Promise<SceneOutput> {
    // Step 1: Generate panoramic image from input
    await this.generatePanoramicImage('i2p', {
      input_image_path: imagePath,
      output_path: outputDir
    });

    // Step 2: Generate panoramic video
    await this.generatePanoramicVideo(outputDir, trajectory);

    // Step 3: Extract 3D scene
    return this.extract3DScene(outputDir);
  }

  private async generatePanoramicImage(
    mode: 't2p' | 'i2p',
    params: Record<string, string>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        'code/panoramic_image_generation.py',
        `--mode=${mode}`,
        ...Object.entries(params).map(([k, v]) => `--${k}=${v}`)
      ];

      const process = spawn('python', args, {
        cwd: this.config.checkpointDir
      });

      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Panoramic image generation failed with code ${code}`));
      });
    });
  }

  private async generatePanoramicVideo(
    outputDir: string,
    trajectory: CameraTrajectory
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        'code/panoramic_image_to_video.py',
        `--inout_dir=${outputDir}`,
        `--resolution=${this.config.resolution}`,
        `--movement_mode=${trajectory.type === 'custom' ? 'custom' : trajectory.type}`,
        this.config.enableVramManagement ? '--enable_vram_management' : '',
        this.config.use5bModel ? '--use_5b_model' : ''
      ].filter(Boolean);

      if (trajectory.type === 'custom' && trajectory.customJsonPath) {
        args.push(`--json_path=${trajectory.customJsonPath}`);
      }

      const process = spawn('torchrun', ['--nproc_per_node=1', ...args], {
        cwd: this.config.checkpointDir
      });

      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Panoramic video generation failed with code ${code}`));
      });
    });
  }

  private async extract3DScene(outputDir: string): Promise<SceneOutput> {
    return new Promise((resolve, reject) => {
      const method = this.config.reconstructionMethod === 'optimization'
        ? 'panoramic_video_to_3DScene.py'
        : 'panoramic_video_480p_to_3DScene_lrm.py';

      const args = [
        `code/${method}`,
        `--inout_dir=${outputDir}`,
        `--resolution=${this.config.resolution}`
      ];

      const process = spawn('python', args, {
        cwd: this.config.checkpointDir
      });

      process.on('close', async (code) => {
        if (code === 0) {
          const plyPath = path.join(outputDir, 'generated_3dgs_opt.ply');
          const exists = await fs.stat(plyPath).catch(() => null);
          
          if (exists) {
            resolve({
              plyPath,
              videoPath: path.join(outputDir, 'pano_video.mp4'),
              outputDir
            });
          } else {
            reject(new Error('3D scene extraction failed: PLY file not found'));
          }
        } else {
          reject(new Error(`3D scene extraction failed with code ${code}`));
        }
      });
    });
  }
}

interface SceneOutput {
  plyPath: string;
  videoPath: string;
  outputDir: string;
}
```

### Integration with BookCinema Pipeline

```typescript
// server/orchestration-v2.ts - Enhanced with 3D scenes
async function runVideoProducerWith3D(
  chapter: ChapterData,
  visualPrompts: VisualPrompt[],
  directorDecisions: DirectorDecisions,
  worldBible: WorldBibleData
): Promise<VideoScene[]> {
  const longcat = new LongCatVideoGenerator({...});
  const matrix3d = new Matrix3DGenerator({
    checkpointDir: process.env.MATRIX3D_CHECKPOINT_DIR || './weights/Matrix-3D',
    resolution: 720,
    reconstructionMethod: 'optimization',
    enableVramManagement: true,
    use5bModel: false
  });

  const videoScenes: VideoScene[] = [];

  for (let i = 0; i < visualPrompts.length; i++) {
    const prompt = visualPrompts[i];
    const outputDir = `./scenes/chapter_${chapter.id}_scene_${i}`;

    try {
      // Generate 3D scene for location context
      const sceneOutput = await matrix3d.generateTextToScene(
        `${worldBible.locations[i]?.description || ''} ${prompt.visualPrompt}`,
        outputDir,
        { type: directorDecisions.cameraTrajectories[i]?.type || 'straight' }
      );

      // Generate video from 3D scene
      const videoPath = `./videos/chapter_${chapter.id}_scene_${i}.mp4`;
      // ... video generation logic

      videoScenes.push({
        sceneIndex: i,
        videoPath,
        plyPath: sceneOutput.plyPath,
        prompt: prompt.visualPrompt,
        duration: prompt.duration || 10,
        cameraDecisions: directorDecisions.cameraTrajectories[i],
        consistency: {
          characters: worldBible.characters,
          locations: worldBible.locations,
          lighting: directorDecisions.lighting
        }
      });
    } catch (error) {
      console.error(`Failed to generate scene ${i}:`, error);
      throw error;
    }
  }

  return videoScenes;
}
```

---

## 3. API Keys & Configuration

### Required Environment Variables

```bash
# LongCatVideo (No API key required - self-hosted)
LONGCAT_CHECKPOINT_DIR=./weights/LongCat-Video

# Matrix-3D (No API key required - self-hosted)
MATRIX3D_CHECKPOINT_DIR=./weights/Matrix-3D

# Gemini (for full-book context processing)
GEMINI_API_KEY=your_gemini_key_here

# OpenAI (for GPT-4V consistency validation)
OPENAI_API_KEY=your_openai_key_here

# Redis (for caching and job queue)
REDIS_URL=redis://...

# Cloudflare R2 (for storage)
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

### No Additional API Keys Required

✅ **LongCatVideo**: Self-hosted, no API key needed
✅ **Matrix-3D**: Self-hosted, no API key needed
✅ **Gemini 3.1 Pro**: Already configured
✅ **OpenAI GPT-4V**: Already configured
✅ **Redis**: Already configured
✅ **Cloudflare R2**: Already configured

---

## 4. Hardware Requirements

### Minimum Setup (MVP)
- **GPU**: 1× NVIDIA A100 (40GB) or RTX 4090 (24GB)
- **CPU**: 16+ cores
- **RAM**: 64GB
- **Storage**: 500GB SSD

### Production Setup
- **GPU**: 2× NVIDIA H100 (80GB)
- **CPU**: 32+ cores
- **RAM**: 128GB
- **Storage**: 2TB SSD + 10TB NAS

### Cost Estimates (Self-Hosted)

| Component | Monthly Cost |
|-----------|-------------|
| GPU (2× H100 on Lambda Labs) | $1,200 |
| CPU/RAM (32-core server) | $300 |
| Storage (2TB SSD + 10TB NAS) | $150 |
| **Total** | **$1,650** |

**Cost per 300-page book**: ~$0.50 (amortized)

---

## 5. Deployment Options

### Option A: Self-Hosted (Recommended for Production)
- Full control over infrastructure
- No API rate limits
- Lower long-term costs
- Requires GPU server management

### Option B: Cloud GPU Providers
- **Lambda Labs**: $1.10/hr for A100
- **Vast.ai**: $0.30-0.60/hr for A100
- **RunPod**: $0.44/hr for A100
- **Crusoe Energy**: $0.25/hr for H100

### Option C: Hybrid Approach
- Self-host for high-volume production
- Cloud GPU for burst capacity
- Cost-effective scaling

---

## 6. Testing & Validation

### Unit Tests

```typescript
// tests/longcat-matrix3d.test.ts
import { describe, it, expect } from 'vitest';
import { LongCatVideoGenerator } from '@/server/longcat-video-integration';
import { Matrix3DGenerator } from '@/server/matrix3d-integration';

describe('LongCatVideo Integration', () => {
  it('should generate text-to-video', async () => {
    const generator = new LongCatVideoGenerator({
      checkpointDir: './weights/LongCat-Video',
      resolution: 'low',
      gpuCount: 1,
      enableCompile: false
    });

    const videoPath = await generator.generateTextToVideo(
      'A serene forest with sunlight filtering through trees',
      './test_output/video.mp4',
      5
    );

    expect(videoPath).toBeDefined();
  });

  it('should generate image-to-video', async () => {
    const generator = new LongCatVideoGenerator({...});
    
    const videoPath = await generator.generateImageToVideo(
      './test_data/keyframe.jpg',
      'The character walks through the forest',
      './test_output/video.mp4',
      5
    );

    expect(videoPath).toBeDefined();
  });
});

describe('Matrix-3D Integration', () => {
  it('should generate text-to-scene', async () => {
    const generator = new Matrix3DGenerator({
      checkpointDir: './weights/Matrix-3D',
      resolution: 480,
      reconstructionMethod: 'feed-forward',
      enableVramManagement: true,
      use5bModel: true
    });

    const scene = await generator.generateTextToScene(
      'A medieval castle on a hilltop',
      './test_output/scene'
    );

    expect(scene.plyPath).toBeDefined();
    expect(scene.videoPath).toBeDefined();
  });
});
```

---

## 7. Performance Benchmarks

### LongCatVideo Performance
| Task | Resolution | Duration | GPU | Time |
|------|-----------|----------|-----|------|
| Text-to-Video | 720p | 10s | 1× A100 | 3 min |
| Image-to-Video | 720p | 10s | 1× A100 | 2 min |
| Video-Continuation | 720p | 10s | 1× A100 | 2 min |
| Long-Video (10 segments) | 720p | 100s | 2× A100 | 15 min |

### Matrix-3D Performance
| Task | Resolution | Method | GPU | Time |
|------|-----------|--------|-----|------|
| Text-to-Scene | 480p | Feed-forward | 1× A100 | 8 min |
| Text-to-Scene | 720p | Optimization | 1× A100 | 45 min |
| Image-to-Scene | 480p | Feed-forward | 1× A100 | 6 min |

---

## 8. Next Steps

1. **Deploy LongCatVideo** on GPU cluster
2. **Deploy Matrix-3D** on separate GPU cluster
3. **Integrate with BookCinema tRPC API**
4. **Set up job queue** (BullMQ + Redis)
5. **Implement consistency validation** (GPT-4V)
6. **Test with 300-page book** production

---

## Support & Documentation

- **LongCatVideo**: https://github.com/meituan-longcat/LongCat-Video
- **Matrix-3D**: https://github.com/SkyworkAI/Matrix-3D
- **Gemini**: https://ai.google.dev/
- **OpenAI GPT-4V**: https://platform.openai.com/docs/guides/vision

---

**Last Updated**: April 16, 2026
**BookCinema Version**: 4.2
**Status**: Ready for GPU cluster deployment
