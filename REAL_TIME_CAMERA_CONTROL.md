# BookCinema: Real-Time Camera Control & Cinematography

## Overview

This document details the implementation of real-time camera control and movement parameters for BookCinema, enabling users to dynamically adjust cinematography during video generation. The system integrates HunyuanVideo's 14-type camera movement classifier with LongCatVideo's prompt-based camera control, providing granular control over camera angles, movement, and cinematic effects.

---

## Part 1: Camera Movement Types & Parameters

### HunyuanVideo Camera Movement Classifier (14 Types)

HunyuanVideo natively supports 14 distinct camera movement types, trained via a dedicated camera movement classifier:

| Type | Keyword | Description | UI Parameter |
|------|---------|-------------|--------------|
| **Zoom In** | `zoom in` | Camera moves forward toward subject | `zoomIntensity: 0-100` |
| **Zoom Out** | `zoom out` | Camera moves backward from subject | `zoomIntensity: 0-100` |
| **Pan Up** | `pan up` | Camera rotates upward | `panVertical: -100 to +100` |
| **Pan Down** | `pan down` | Camera rotates downward | `panVertical: -100 to +100` |
| **Pan Left** | `pan left` | Camera rotates leftward | `panHorizontal: -100 to +100` |
| **Pan Right** | `pan right` | Camera rotates rightward | `panHorizontal: -100 to +100` |
| **Tilt Up** | `tilt up` | Camera tilts upward (high angle) | `tiltAngle: -90 to +90` |
| **Tilt Down** | `tilt down` | Camera tilts downward (low angle) | `tiltAngle: -90 to +90` |
| **Tilt Left** | `tilt left` | Camera tilts left (dutch angle) | `rollAngle: -45 to +45` |
| **Tilt Right** | `tilt right` | Camera tilts right (dutch angle) | `rollAngle: -45 to +45` |
| **Around Left** | `orbit left` | Camera circles around subject (CCW) | `orbitAngle: 0-360, direction: -1` |
| **Around Right** | `orbit right` | Camera circles around subject (CW) | `orbitAngle: 0-360, direction: +1` |
| **Static Shot** | `static` | Camera remains fixed | `isStatic: true` |
| **Handheld Shot** | `handheld` | Camera has subtle jitter/shake | `handheldIntensity: 0-100` |

### LongCatVideo Prompt-Based Camera Control

LongCatVideo uses structured prompts to control camera behavior. The system parses natural language cinematography descriptions and maps them to video generation parameters:

```
Prompt Formula: [Subject] + [Motion] + [Scene] + [Shot Type] + [Camera Movement] + [Lighting] + [Style] + [Atmosphere]
```

**Camera Movement Keywords (LongCatVideo):**
- `dolly in` / `dolly out` — Forward/backward movement
- `truck left` / `truck right` — Lateral movement
- `crane up` / `crane down` — Vertical movement
- `pan left` / `pan right` — Horizontal rotation
- `tilt up` / `tilt down` — Vertical rotation
- `follow` — Tracking shot (follows subject)
- `slow motion` — Temporal slowdown
- `static` — Fixed camera

---

## Part 2: Real-Time UI Control System

### Camera Control Component Architecture

```typescript
// CameraControlPanel.tsx - Real-time parameter adjustment
interface CameraControlState {
  // Movement parameters
  zoomIntensity: number;           // 0-100, intensity of zoom
  panHorizontal: number;           // -100 to +100, left/right pan
  panVertical: number;             // -100 to +100, up/down pan
  tiltAngle: number;               // -90 to +90, camera tilt
  rollAngle: number;               // -45 to +45, dutch angle
  
  // Orbit parameters
  orbitAngle: number;              // 0-360, degrees around subject
  orbitDirection: 'left' | 'right'; // Rotation direction
  orbitRadius: number;             // 0-100, distance from subject
  
  // Special effects
  handheldIntensity: number;       // 0-100, camera shake
  motionBlur: number;              // 0-100, motion blur intensity
  depthOfField: number;            // 0-100, focus depth
  
  // Timing
  movementDuration: number;        // 0.5-10 seconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  
  // Presets
  selectedPreset: string;          // 'cinematic', 'documentary', 'action', etc.
}
```

### Real-Time Parameter Sliders

```tsx
// app/(tabs)/camera-control.tsx
import { Slider } from '@/components/ui/slider';
import { SegmentedControl } from '@/components/ui/segmented-control';

export function CameraControlPanel() {
  const [camera, setCamera] = useState<CameraControlState>(defaultCameraState);
  const { mutate: updateCameraPreview } = trpc.chapter.previewCameraMovement.useMutation();

  const handleZoomChange = (value: number) => {
    const newState = { ...camera, zoomIntensity: value };
    setCamera(newState);
    
    // Real-time preview (debounced)
    updateCameraPreview({
      chapterId: currentChapterId,
      cameraParams: newState,
      sceneIndex: currentSceneIndex
    });
  };

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Zoom Control */}
      <View className="p-4 gap-3">
        <Text className="text-sm font-semibold text-foreground">Zoom</Text>
        <Slider
          value={[camera.zoomIntensity]}
          onValueChange={([v]) => handleZoomChange(v)}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <Text className="text-xs text-muted">{camera.zoomIntensity}%</Text>
      </View>

      {/* Pan Control (Horizontal/Vertical) */}
      <View className="p-4 gap-3">
        <Text className="text-sm font-semibold text-foreground">Pan</Text>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-2">Horizontal</Text>
            <Slider
              value={[camera.panHorizontal]}
              onValueChange={([v]) => setCamera({ ...camera, panHorizontal: v })}
              min={-100}
              max={100}
              step={5}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted mb-2">Vertical</Text>
            <Slider
              value={[camera.panVertical]}
              onValueChange={([v]) => setCamera({ ...camera, panVertical: v })}
              min={-100}
              max={100}
              step={5}
            />
          </View>
        </View>
      </View>

      {/* Orbit Control */}
      <View className="p-4 gap-3">
        <Text className="text-sm font-semibold text-foreground">Orbit</Text>
        <Slider
          value={[camera.orbitAngle]}
          onValueChange={([v]) => setCamera({ ...camera, orbitAngle: v })}
          min={0}
          max={360}
          step={15}
        />
        <SegmentedControl
          options={[
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' }
          ]}
          value={camera.orbitDirection}
          onChange={(v) => setCamera({ ...camera, orbitDirection: v as any })}
        />
      </View>

      {/* Handheld Shake */}
      <View className="p-4 gap-3">
        <Text className="text-sm font-semibold text-foreground">Handheld Intensity</Text>
        <Slider
          value={[camera.handheldIntensity]}
          onValueChange={([v]) => setCamera({ ...camera, handheldIntensity: v })}
          min={0}
          max={100}
          step={5}
        />
      </View>

      {/* Presets */}
      <View className="p-4 gap-3">
        <Text className="text-sm font-semibold text-foreground">Cinematography Presets</Text>
        <View className="flex-row gap-2 flex-wrap">
          {CAMERA_PRESETS.map((preset) => (
            <Pressable
              key={preset.id}
              onPress={() => {
                setCamera(preset.state);
                updateCameraPreview({
                  chapterId: currentChapterId,
                  cameraParams: preset.state,
                  sceneIndex: currentSceneIndex
                });
              }}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: camera.selectedPreset === preset.id ? colors.primary : colors.surface,
                  opacity: pressed ? 0.7 : 1
                }
              ]}
            >
              <Text className={`text-sm font-medium ${camera.selectedPreset === preset.id ? 'text-background' : 'text-foreground'}`}>
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// Preset definitions
const CAMERA_PRESETS = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    state: {
      zoomIntensity: 30,
      panHorizontal: 0,
      panVertical: 0,
      tiltAngle: -15,
      rollAngle: 0,
      orbitAngle: 0,
      orbitDirection: 'right',
      orbitRadius: 50,
      handheldIntensity: 5,
      motionBlur: 20,
      depthOfField: 60,
      movementDuration: 3,
      easing: 'ease-in-out',
      selectedPreset: 'cinematic'
    }
  },
  {
    id: 'documentary',
    label: 'Documentary',
    state: {
      zoomIntensity: 0,
      panHorizontal: 0,
      panVertical: 0,
      tiltAngle: 0,
      rollAngle: 0,
      orbitAngle: 0,
      orbitDirection: 'right',
      orbitRadius: 0,
      handheldIntensity: 30,
      motionBlur: 10,
      depthOfField: 20,
      movementDuration: 1,
      easing: 'linear',
      selectedPreset: 'documentary'
    }
  },
  {
    id: 'action',
    label: 'Action',
    state: {
      zoomIntensity: 60,
      panHorizontal: 20,
      panVertical: 0,
      tiltAngle: 10,
      rollAngle: 5,
      orbitAngle: 45,
      orbitDirection: 'right',
      orbitRadius: 70,
      handheldIntensity: 50,
      motionBlur: 40,
      depthOfField: 40,
      movementDuration: 1.5,
      easing: 'ease-out',
      selectedPreset: 'action'
    }
  },
  {
    id: 'static',
    label: 'Static',
    state: {
      zoomIntensity: 0,
      panHorizontal: 0,
      panVertical: 0,
      tiltAngle: 0,
      rollAngle: 0,
      orbitAngle: 0,
      orbitDirection: 'right',
      orbitRadius: 0,
      handheldIntensity: 0,
      motionBlur: 0,
      depthOfField: 100,
      movementDuration: 0,
      easing: 'linear',
      selectedPreset: 'static'
    }
  }
];
```

---

## Part 3: Backend Integration

### Prompt Generation with Camera Parameters

```typescript
// server/orchestration-v2.ts - Visual Director Agent (Agent 4)

interface CameraParams {
  zoomIntensity: number;
  panHorizontal: number;
  panVertical: number;
  tiltAngle: number;
  rollAngle: number;
  orbitAngle: number;
  orbitDirection: 'left' | 'right';
  orbitRadius: number;
  handheldIntensity: number;
  motionBlur: number;
  depthOfField: number;
  movementDuration: number;
  easing: string;
}

async function runVisualDirectorAgent(
  sceneDescription: string,
  cameraParams: CameraParams,
  visualBible: WorldBibleData
): Promise<VisualPrompt[]> {
  
  // Convert camera parameters to natural language cinematography description
  const cameraDescription = generateCameraDescription(cameraParams);
  
  // Build the visual prompt using HunyuanVideo formula
  const visualPrompt = `
    Subject: ${visualBible.characters[0]?.description || 'protagonist'}
    Scene: ${sceneDescription}
    Camera Movement: ${cameraDescription}
    Lighting: ${visualBible.settings.lighting || 'natural daylight'}
    Style: ${visualBible.settings.visualStyle || 'cinematic photorealism'}
    Atmosphere: ${visualBible.settings.atmosphere || 'dramatic'}
  `;

  // Generate keyframes with camera parameters
  const keyframes = await generateKeyframesWithCamera(visualPrompt, cameraParams);
  
  return keyframes;
}

function generateCameraDescription(params: CameraParams): string {
  const movements: string[] = [];

  if (params.zoomIntensity > 0) {
    movements.push(`dolly in with ${params.zoomIntensity}% intensity`);
  } else if (params.zoomIntensity < 0) {
    movements.push(`dolly out with ${Math.abs(params.zoomIntensity)}% intensity`);
  }

  if (params.panHorizontal > 0) {
    movements.push(`pan right ${params.panHorizontal}%`);
  } else if (params.panHorizontal < 0) {
    movements.push(`pan left ${Math.abs(params.panHorizontal)}%`);
  }

  if (params.panVertical > 0) {
    movements.push(`pan up ${params.panVertical}%`);
  } else if (params.panVertical < 0) {
    movements.push(`pan down ${Math.abs(params.panVertical)}%`);
  }

  if (params.tiltAngle > 0) {
    movements.push(`high angle shot, tilted up ${params.tiltAngle}°`);
  } else if (params.tiltAngle < 0) {
    movements.push(`low angle shot, tilted down ${Math.abs(params.tiltAngle)}°`);
  }

  if (params.orbitAngle > 0) {
    const direction = params.orbitDirection === 'left' ? 'counterclockwise' : 'clockwise';
    movements.push(`orbit ${direction} ${params.orbitAngle}° around subject`);
  }

  if (params.handheldIntensity > 0) {
    movements.push(`handheld camera with ${params.handheldIntensity}% shake`);
  }

  if (params.depthOfField < 50) {
    movements.push(`shallow depth of field, focus on subject`);
  }

  if (params.motionBlur > 0) {
    movements.push(`motion blur effect at ${params.motionBlur}% intensity`);
  }

  return movements.length > 0 ? movements.join(', ') : 'static camera';
}

// tRPC router for camera preview
export const chapterRouter = router({
  previewCameraMovement: protectedProcedure
    .input(z.object({
      chapterId: z.string(),
      cameraParams: z.object({
        zoomIntensity: z.number(),
        panHorizontal: z.number(),
        panVertical: z.number(),
        tiltAngle: z.number(),
        rollAngle: z.number(),
        orbitAngle: z.number(),
        orbitDirection: z.enum(['left', 'right']),
        orbitRadius: z.number(),
        handheldIntensity: z.number(),
        motionBlur: z.number(),
        depthOfField: z.number(),
        movementDuration: z.number(),
        easing: z.string(),
        selectedPreset: z.string()
      }),
      sceneIndex: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const { chapterId, cameraParams, sceneIndex } = input;

      // Fetch chapter and scene
      const chapter = await ctx.db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId)
      });

      if (!chapter) throw new Error('Chapter not found');

      // Generate camera-aware visual prompt
      const cameraDescription = generateCameraDescription(cameraParams);
      
      // Store camera parameters for this scene
      await ctx.db.update(videoScenes).set({
        cameraParams: JSON.stringify(cameraParams),
        updatedAt: new Date()
      }).where(
        and(
          eq(videoScenes.chapterId, chapterId),
          eq(videoScenes.sceneIndex, sceneIndex)
        )
      );

      return {
        success: true,
        cameraDescription,
        previewUrl: `${process.env.NEXT_PUBLIC_API_URL}/preview/camera/${chapterId}/${sceneIndex}`
      };
    })
});
```

---

## Part 4: Video Generation Integration

### HunyuanVideo API Call with Camera Parameters

```python
# Python backend service for video generation

from hunyuan_video import HunyuanVideoAPI
import json

def generate_video_with_camera(
    prompt: str,
    camera_params: dict,
    image_input: str = None,
    duration: int = 5,
    resolution: str = "1280x720"
) -> str:
    """
    Generate video using HunyuanVideo with real-time camera control.
    
    Args:
        prompt: Base visual prompt
        camera_params: Camera control parameters
        image_input: Optional reference image for I2V
        duration: Video duration in seconds
        resolution: Output resolution
    
    Returns:
        Video URL
    """
    
    # Enhance prompt with camera description
    camera_description = generate_camera_description(camera_params)
    enhanced_prompt = f"{prompt}. Camera: {camera_description}"
    
    # Initialize HunyuanVideo API
    client = HunyuanVideoAPI(api_key=os.getenv('HUNYUAN_API_KEY'))
    
    if image_input:
        # Image-to-Video with camera control
        response = client.generate_i2v(
            image_url=image_input,
            prompt=enhanced_prompt,
            duration=duration,
            resolution=resolution,
            camera_movement_type=extract_camera_type(camera_params),
            camera_intensity=calculate_camera_intensity(camera_params)
        )
    else:
        # Text-to-Video with camera control
        response = client.generate_t2v(
            prompt=enhanced_prompt,
            duration=duration,
            resolution=resolution,
            camera_movement_type=extract_camera_type(camera_params),
            camera_intensity=calculate_camera_intensity(camera_params)
        )
    
    return response['video_url']

def extract_camera_type(params: dict) -> str:
    """Map camera parameters to HunyuanVideo camera movement type."""
    if params['zoomIntensity'] > 50:
        return 'zoom_in'
    elif params['zoomIntensity'] < -50:
        return 'zoom_out'
    elif params['panHorizontal'] > 50:
        return 'pan_right'
    elif params['panHorizontal'] < -50:
        return 'pan_left'
    elif params['orbitAngle'] > 0:
        return 'orbit_right' if params['orbitDirection'] == 'right' else 'orbit_left'
    elif params['handheldIntensity'] > 50:
        return 'handheld'
    else:
        return 'static'

def calculate_camera_intensity(params: dict) -> float:
    """Calculate overall camera movement intensity (0-1)."""
    intensities = [
        abs(params['zoomIntensity']) / 100,
        abs(params['panHorizontal']) / 100,
        abs(params['panVertical']) / 100,
        abs(params['tiltAngle']) / 90,
        params['handheldIntensity'] / 100,
        params['orbitAngle'] / 360
    ]
    return min(max(sum(intensities) / len(intensities), 0), 1)
```

---

## Part 5: Consistency Engine with Camera Tracking

### Character Appearance Consistency Across Camera Movements

```typescript
// server/consistency-engine.ts

interface CharacterAppearance {
  characterId: string;
  embedding: number[];  // CLIP embedding
  description: string;
  keyVisualFeatures: {
    clothingColor: string;
    hairstyle: string;
    facialFeatures: string;
    accessories: string[];
  };
}

async function ensureCharacterConsistencyAcrossCameraMovement(
  previousFrame: Buffer,
  currentPrompt: string,
  cameraParams: CameraParams,
  character: CharacterAppearance
): Promise<Buffer> {
  
  // Extract character appearance from previous frame
  const previousAppearance = await extractCharacterEmbedding(previousFrame);
  
  // Calculate appearance drift
  const drift = calculateEmbeddingDistance(previousAppearance, character.embedding);
  
  if (drift > CONSISTENCY_THRESHOLD) {
    // Character appearance has drifted, regenerate with consistency constraints
    const consistencyPrompt = `
      ${currentPrompt}
      
      CONSISTENCY CONSTRAINTS:
      - Character clothing: ${character.keyVisualFeatures.clothingColor}
      - Hairstyle: ${character.keyVisualFeatures.hairstyle}
      - Facial features: ${character.keyVisualFeatures.facialFeatures}
      - Accessories: ${character.keyVisualFeatures.accessories.join(', ')}
      
      Camera movement: ${generateCameraDescription(cameraParams)}
      
      Maintain exact character appearance despite camera movement.
    `;
    
    // Regenerate frame with I2I consistency
    const consistentFrame = await regenerateWithConsistency(
      previousFrame,
      consistencyPrompt,
      character.embedding
    );
    
    return consistentFrame;
  }
  
  return previousFrame;
}

function calculateEmbeddingDistance(emb1: number[], emb2: number[]): number {
  // Cosine distance
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < emb1.length; i++) {
    dotProduct += emb1[i] * emb2[i];
    norm1 += emb1[i] * emb1[i];
    norm2 += emb2[i] * emb2[i];
  }
  
  return 1 - (dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)));
}
```

---

## Part 6: Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)
- [ ] Implement basic camera control sliders (zoom, pan, tilt)
- [ ] Integrate HunyuanVideo camera movement types
- [ ] Build camera parameter storage in database
- [ ] Create 4 cinematography presets (Cinematic, Documentary, Action, Static)

### Phase 2: Advanced Controls (Weeks 3-4)
- [ ] Add orbit/rotation controls
- [ ] Implement handheld shake and motion blur
- [ ] Build real-time preview system
- [ ] Add depth-of-field control

### Phase 3: Consistency Engine (Weeks 5-6)
- [ ] Implement character embedding extraction (CLIP)
- [ ] Build consistency scoring with VLM (GPT-4V)
- [ ] Add I2I consistency regeneration
- [ ] Implement location/lighting consistency tracking

### Phase 4: Production Optimization (Weeks 7-8)
- [ ] Batch camera parameter processing
- [ ] Add Redis caching for camera presets
- [ ] Implement WebSocket real-time updates
- [ ] Build analytics dashboard for camera usage

---

## Part 7: Cost Estimates

| Component | Cost per Book | Notes |
|-----------|---------------|-------|
| HunyuanVideo generation (1000 clips) | $400 | $0.40/clip, 8-GPU H100 cluster |
| Camera parameter optimization | $50 | Consistency checks via CLIP |
| VLM consistency scoring (GPT-4V) | $30 | ~100 consistency checks per book |
| Video assembly & encoding | $20 | FFmpeg on standard GPU |
| **Total** | **$500** | Production-grade cinematography |

---

## Part 8: API Reference

### tRPC Endpoints

```typescript
// Get available camera presets
chapter.getCameraPresets()

// Update camera parameters for a scene
chapter.updateCameraParams(chapterId, sceneIndex, cameraParams)

// Preview camera movement
chapter.previewCameraMovement(chapterId, sceneIndex, cameraParams)

// Get camera consistency score
chapter.getCameraConsistencyScore(chapterId, sceneIndex)

// Generate video with camera control
chapter.generateVideoWithCamera(chapterId, sceneIndex, cameraParams)
```

---

## References

- **HunyuanVideo Paper:** https://arxiv.org/abs/2412.03603
- **HunyuanVideo Prompt Handbook:** https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5/blob/main/assets/HunyuanVideo_1_5_Prompt_Handbook_EN.md
- **LongCatVideo Developer Guide:** https://fal.ai/learn/devs/building-with-longcat-video-developers-guide
- **CLIP Embeddings:** https://github.com/openai/CLIP
- **FFmpeg Documentation:** https://ffmpeg.org/documentation.html
