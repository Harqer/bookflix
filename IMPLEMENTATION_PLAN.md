# BookFlix Google Ecosystem Implementation Plan

## Overview
This implementation plan leverages Google Cloud services to create a scalable, cost-effective, and maintainable book-to-film generation platform. The architecture follows Google's best practices for serverless applications and integrates seamlessly with the existing BookFlix architecture.

## Technology Stack

### Frontend
- **Next.js 14+** with App Router
- **Firebase Web SDK** for authentication and real-time data
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **Zustand** for state management
- **Video.js** for media playback

### Backend & AI
- **Genkit JS** with Google AI plugin
- **RLM-Enhanced Script Generation** (Recursive Language Models for unlimited context)
- **Cloud Run** for containerized services
- **Cloud Functions** (Firebase) for serverless functions
- **Google AI (Gemini 2.5 Pro/Flash)** for LLM operations
- **Firestore** for database operations
- **Firebase Authentication** for user management

### Infrastructure
- **Firebase Hosting** for frontend deployment
- **Cloud Storage** for video asset storage
- **Cloud CDN** for content delivery
- **Cloud Tasks** for async job processing
- **Cloud Monitoring** for observability
- **Cloud Build** for CI/CD

## Architecture Diagram

```
[User Browser]
       │
       ▼
[Firebase Hosting] (Next.js Frontend)
       │
       ├─► [Firebase Auth] (Authentication)
       ├─► [Firestore] (Real-time data)
       └─► [Cloud Functions] (API Gateway)
               │
               ▼
        [Cloud Run Services]
               │
       ├───────┼───────┬───────┐
       ▼       ▼       ▼       ▼
[Storyteller] [Spatial] [Cinematography] [Audio]
   Agent      Agent       Agent        Agent
       │       │       │       │
       └───────┴───────┴───────┘
               │
               ▼
        [RLM-Enhanced Script Generation]
        ├─► [Root LLM] (Book Structure Analysis)
        ├─► [Sub-LLMs] (Character Consistency)
        ├─► [Sub-LLMs] (Narrative Structure)
        └─► [Sub-LLMs] (Scene Adaptation)
               │
               ▼
        [Google AI (Gemini 2.5)]
               │
               ▼
        [Cloud Storage] (Video Assets)
               │
               ▼
        [Cloud CDN] (Global Delivery)
```

## RLM Integration Overview

**Recursive Language Models (RLM)** enable BookFlix to process unlimited book lengths (500K-2M tokens) without context window limitations or context rot. This is critical for:

1. **Full book analysis** - Process entire books without truncation
2. **Character consistency** - Maintain character identity across hundreds of scenes
3. **Narrative structure** - Identify complex patterns, foreshadowing, and story arcs
4. **Cost efficiency** - 2-3x token efficiency vs. loading full context

### RLM Configuration

```typescript
const RLM_CONFIG = {
  maxDepth: 1,              // CRITICAL: Never use depth > 1 (avoids "overthinking")
  maxIterations: 50,
  tokenBudget: 100000,      // Max tokens per query
  costThreshold: 10.0,      // Stop if cost exceeds $10
  parallelLimit: 10,        // Max parallel sub-LLM calls
  batchSize: 5,             // Process 5 scenes at a time
  timeout: 300,             // 5 minutes max per phase
  rootModel: 'gemini-2.5-pro',     // Complex orchestration
  subModel: 'gemini-2.5-flash',    // Parallel sub-tasks
};
```

### RLM Flow Architecture

**Phase 1: Root LLM (Depth=0)**
- Analyzes book structure (chapters, characters, narrative arcs)
- Plans delegation strategy for sub-LLMs
- Output: Chapter breakpoints, main characters, narrative sections

**Phase 2: Sub-LLMs (Depth=1) - Parallel Processing**
- Character analysis (physical traits, wardrobe, speech patterns, emotional range)
- Narrative structure (3-act structure, Hero's Journey, tension arcs)
- Scene adaptation (prose to screenplay conversion with continuity)

**Phase 3: Aggregation**
- Merges sub-LLM results
- Resolves character state conflicts
- Maintains narrative coherence

### Cost Monitoring & Fallback

```typescript
class CostTracker {
  trackPhase(phaseName: string, tokens: number, cost: number)
  getReport() // Returns totalTokens, totalCost, phaseBreakdown
  
  // Automatic fallback to standard approach if:
  // - Cost threshold exceeded ($10)
  // - Timeout (5 minutes)
  // - Error rate too high
}
```

**Fallback Strategy**: Truncate context to 100K tokens, use standard LLM approach

### Expected Performance

| Metric | Traditional LLM | RLM (Depth=1) | Improvement |
|--------|----------------|---------------|-------------|
| Context Length | 500K max | 5M+ | 10x |
| Reasoning Accuracy | 50% | 65% | +30% |
| Token Efficiency | Baseline | 2-3x | 2-3x better |
| Cost (monthly) | $30K | $10K | 3x cheaper |

**See `RLM_INTEGRATION.md` for detailed architecture and implementation.**

## Phase 1: Project Setup & Infrastructure

### 1.1 Firebase Project Setup
```bash
# Create Firebase project
firebase projects create bookflix-production

# Add required services
firebase services:enable firestore
firebase services:enable storage
firebase services:enable auth
firebase services:enable functions

# Set up Firestore indexes
firebase firestore:indexes
```

### 1.2 Google Cloud Project Setup
```bash
# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable storagetransfer.googleapis.com
gcloud services enable cloudtasks.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudcdn.googleapis.com
```

### 1.3 Next.js Project Setup
```bash
# Create Next.js app with TypeScript
npx create-next-app@latest bookflix --typescript --tailwind --app

# Install Firebase dependencies
npm install firebase
npm install @genkit-ai/google-genai
npm install @genkit-ai/firebase
npm install genkit

# Install RLM dependencies
npm install zod  # For schema validation
npm install @types/node  # For TypeScript support
```

### 1.4 RLM Infrastructure Setup
```bash
# Create RLM directory structure
mkdir -p lib/genkit/flows
mkdir -p lib/genkit/config
mkdir -p lib/genkit/monitoring
mkdir -p lib/genkit/utils

# Copy RLM implementation files
# rlm-genkit-implementation.ts → lib/genkit/flows/rlmScriptGeneration.ts
# RLM configuration → lib/genkit/config/rlm.ts
# Cost tracking → lib/genkit/monitoring/costTracker.ts
```

### 1.5 Cloud Run for RLM Services
```bash
# Build RLM-enabled Cloud Run service
gcloud run deploy bookflix-rlm-service \
  --source ./cloud-run/rlm-service \
  --platform managed \
  --region us-central1 \
  --cpu 4 \
  --memory 8Gi \
  --max-instances 10 \
  --timeout 300s

# Configure environment variables
gcloud run services update bookflix-rlm-service \
  --set-env-vars=GEMINI_API_KEY=$GEMINI_API_KEY \
  --set-env-vars=RLM_MAX_DEPTH=1 \
  --set-env-vars=RLM_COST_THRESHOLD=10.0 \
  --set-env-vars=RLM_PARALLEL_LIMIT=10
```

# Install UI dependencies
npm install @radix-ui/react-slot
npm install class-variance-authority
npm install clsx
npm install tailwind-merge
```

## Phase 2: Database Schema Design

### 2.1 Firestore Collections

#### Users Collection
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  projectsCount: number;
  totalVideoMinutes: number;
}
```

#### Projects Collection
```typescript
interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  bookSource: {
    type: 'file' | 'text' | 'url';
    content: string;
    fileName?: string;
  };
  settings: {
    genre: string;
    visualStyle: string;
    aspectRatio: '16:9' | '9:16' | '1:1';
    resolution: '720p' | '1080p' | '4K';
    targetDuration: number; // in minutes
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

#### Scripts Collection
```typescript
interface Script {
  id: string;
  projectId: string;
  chapters: Chapter[];
  metadata: {
    totalScenes: number;
    estimatedDuration: number;
    characters: string[];
  };
  generatedAt: Timestamp;
}

interface Chapter {
  chapterNumber: number;
  title: string;
  scenes: Scene[];
}

interface Scene {
  sceneNumber: number;
  slugline: string;
  action: string;
  characters: string[];
  dialogue: Dialogue[];
  metadata: {
    setting: string;
    time: string;
    characters: CharacterState[];
  };
}

interface CharacterState {
  name: string;
  wardrobe: string;
  emotionalState: string;
  physicalState: string;
}
```

#### VideoSegments Collection
```typescript
interface VideoSegment {
  id: string;
  projectId: string;
  scriptId: string;
  sceneId: string;
  segmentNumber: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  prompt: string;
  videoUrl?: string;
  audioUrl?: string;
  duration: number;
  metadata: {
    model: string;
    resolution: string;
    aspectRatio: string;
  };
  createdAt: Timestamp;
  completedAt?: Timestamp;
  errorMessage?: string;
}
```

#### GenerationJobs Collection
```typescript
interface GenerationJob {
  id: string;
  projectId: string;
  type: 'script' | 'storyboard' | 'video' | 'audio' | 'assembly';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  input: any;
  output?: any;
  progress: number;
  errorMessage?: string;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}
```

### 2.2 Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Subcollections
      match /scripts/{scriptId} {
        allow read, write: if request.auth != null && 
          get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
      }
      
      match /videoSegments/{segmentId} {
        allow read, write: if request.auth != null && 
          get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
      }
      
      match /generationJobs/{jobId} {
        allow read, write: if request.auth != null && 
          get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
      }
    }
  }
}
```

## Phase 3: Authentication Implementation

### 3.1 Firebase Authentication Setup
```typescript
// lib/firebase/auth.ts
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut 
} from 'firebase/auth';

export const auth = getAuth();

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signInWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};
```

### 3.2 User Profile Management
```typescript
// lib/firebase/user.ts
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from './auth';

export const createUserProfile = async (user: any) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      createdAt: serverTimestamp(),
      subscriptionTier: 'free',
      projectsCount: 0,
      totalVideoMinutes: 0,
    });
  }
};
```

## Phase 4: Frontend Architecture

### 4.1 Project Structure
```
bookflix/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/
│   │   ├── projects/
│   │   ├── project/[id]/
│   │   └── settings/
│   ├── api/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── project/
│   ├── video/
│   └── auth/
├── lib/
│   ├── firebase/
│   ├── genkit/
│   └── utils/
├── hooks/
│   ├── useAuth.ts
│   ├── useProject.ts
│   └── useVideoGeneration.ts
└── public/
```

### 4.2 Key Components

#### Dashboard Component
```typescript
// components/project/Dashboard.tsx
'use client';

import { useProjects } from '@/hooks/useProject';
import { ProjectCard } from './ProjectCard';
import { NewProjectButton } from './NewProjectButton';

export default function Dashboard() {
  const { projects, loading } = useProjects();
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <NewProjectButton />
      </div>
      
      {loading ? (
        <div>Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Video Player Component
```typescript
// components/video/VideoPlayer.tsx
'use client';

import { useEffect, useRef } from 'react';
import Video.js from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  subtitles?: string;
}

export default function VideoPlayer({ src, subtitles }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  
  useEffect(() => {
    if (videoRef.current) {
      playerRef.current = Video.js(videoRef.current, {
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src, type: 'video/mp4' }],
        tracks: subtitles ? [{
          kind: 'subtitles',
          src: subtitles,
          srclang: 'en',
          label: 'English'
        }] : []
      });
    }
    
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [src, subtitles]);
  
  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
}
```

### 4.3 Custom Hooks

#### useAuth Hook
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  return { user, loading };
}
```

#### useProject Hook
```typescript
// hooks/useProject.ts
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { useAuth } from './useAuth';

export function useProjects() {
  const { user } = useAuth();
  const [projects, loading, error] = useCollection(
    query(
      collection(db, 'projects'),
      where('userId', '==', user?.uid || ''),
      orderBy('createdAt', 'desc')
    )
  );
  
  const projectsData = projects?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return { projects: projectsData, loading, error };
}
```

## Phase 5: Backend Architecture with Genkit

### 5.1 Genkit Setup
```typescript
// lib/genkit/index.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { firebase } from '@genkit-ai/firebase';
import { defineFlow } from 'genkit';

const ai = genkit({
  plugins: [
    googleAI(),
    firebase(),
  ],
});

export { ai };
```

### 5.2 Storyteller Agent Flow
```typescript
// lib/genkit/flows/storyteller.ts
import { z } from 'zod';
import { ai } from '../index';

const StorytellerInput = z.object({
  bookContent: z.string(),
  genre: z.string(),
  targetDuration: z.number(),
});

const StorytellerOutput = z.object({
  script: z.object({
    chapters: z.array(z.object({
      chapterNumber: z.number(),
      title: z.string(),
      scenes: z.array(z.object({
        sceneNumber: z.number(),
        slugline: z.string(),
        action: z.string(),
        characters: z.array(z.string()),
        dialogue: z.array(z.object({
          character: z.string(),
          lines: z.string(),
        })),
      })),
    })),
  }),
  metadata: z.object({
    totalScenes: z.number(),
    estimatedDuration: z.number(),
    characters: z.array(z.string()),
  }),
});

export const storytellerFlow = ai.defineFlow(
  {
    name: 'storytellerFlow',
    inputSchema: StorytellerInput,
    outputSchema: StorytellerOutput,
  },
  async (input) => {
    const { bookContent, genre, targetDuration } = input;
    
    const response = await ai.generate({
      model: googleAI.model('gemini-flash-latest'),
      prompt: `Convert this book content into a screenplay for a ${targetDuration}-minute ${genre} film:
      
      ${bookContent}
      
      Follow these guidelines:
      - Apply Three-Act Structure
      - Use "show, don't tell" principles
      - Include character state metadata
      - Format as standard screenplay
      `,
      output: {
        schema: StorytellerOutput,
      },
    });
    
    return response.output;
  }
);
```

### 5.3 Cinematography Agent Flow
```typescript
// lib/genkit/flows/cinematography.ts
import { z } from 'zod';
import { ai } from '../index';

const CinematographyInput = z.object({
  sceneDescription: z.string(),
  characterStates: z.array(z.object({
    name: z.string(),
    wardrobe: z.string(),
    emotionalState: z.string(),
  })),
  cameraInstructions: z.string(),
  visualStyle: z.string(),
});

const CinematographyOutput = z.object({
  videoPrompt: z.string(),
  cameraMovement: z.string(),
  lighting: z.string(),
  composition: z.string(),
});

export const cinematographyFlow = ai.defineFlow(
  {
    name: 'cinematographyFlow',
    inputSchema: CinematographyInput,
    outputSchema: CinematographyOutput,
  },
  async (input) => {
    const { sceneDescription, characterStates, cameraInstructions, visualStyle } = input;
    
    const response = await ai.generate({
      model: googleAI.model('gemini-flash-latest'),
      prompt: `Generate cinematography instructions for this scene:
      
      Scene: ${sceneDescription}
      Characters: ${JSON.stringify(characterStates)}
      Camera: ${cameraInstructions}
      Style: ${visualStyle}
      
      Provide:
      1. Detailed video generation prompt
      2. Camera movement specifications
      3. Lighting setup
      4. Composition guidelines
      `,
      output: {
        schema: CinematographyOutput,
      },
    });
    
    return response.output;
  }
);
```

### 5.4 Cloud Run Services

#### Storyteller Service (RLM-Enhanced)
```typescript
// services/storyteller/src/index.ts
import { hybridScriptGenerationFlow } from '@bookflix/genkit/flows/rlmScriptGeneration';
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { CostTracker } from '@bookflix/genkit/monitoring/costTracker';

const firestore = new Firestore();
const storage = new Storage();
const costTracker = new CostTracker();

app.post('/generate-script', async (req, res) => {
  try {
    const { projectId, bookContent, genre, targetDuration, title, author } = req.body;
    
    // Update job status
    await firestore.collection('projects').doc(projectId).update({
      status: 'processing',
    });
    
    console.log(`🚀 Starting RLM-enhanced script generation for project: ${projectId}`);
    console.log(`📖 Book length: ${bookContent.length} characters`);
    
    // Generate script using RLM-enhanced flow
    const script = await hybridScriptGenerationFlow({
      content: bookContent,
      genre,
      targetDuration,
      title,
      author,
    });
    
    // Get cost report
    const costReport = costTracker.getReport();
    console.log('💰 Cost Report:', costReport);
    
    // Save to Firestore with cost metadata
    await firestore.collection('projects').doc(projectId)
      .collection('scripts').add({
        ...script,
        generatedAt: new Date(),
        costMetadata: costReport,
        generationMethod: 'rlm-enhanced',
      });
    
    res.json({ 
      success: true, 
      script,
      costReport,
    });
  } catch (error) {
    console.error('❌ Script generation error:', error);
    
    // Update project status to failed
    await firestore.collection('projects').doc(projectId)
      .update({ 
        status: 'failed',
        errorMessage: error.message,
      });
    
    res.status(500).json({ error: 'Script generation failed' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Storyteller service running on port ${PORT}`);
});
```

#### Video Generation Service
```typescript
// services/video-generation/src/index.ts
import { cinematographyFlow } from '@bookflix/genkit/flows';
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';

const firestore = new Firestore();
const storage = new Storage();

app.post('/generate-video', async (req, res) => {
  try {
    const { projectId, segmentId, sceneData } = req.body;
    
    // Update segment status
    await firestore
      .collection('projects')
      .doc(projectId)
      .collection('videoSegments')
      .doc(segmentId)
      .update({ status: 'generating' });
    
    // Generate cinematography instructions
    const cinematography = await cinematographyFlow(sceneData);
    
    // Call FLUX 3 API (or other video generation service)
    const videoUrl = await generateVideoWithFLUX3(cinematography);
    
    // Upload to Cloud Storage
    const bucketName = 'bookflix-videos';
    const fileName = `${projectId}/${segmentId}.mp4`;
    await storage.bucket(bucketName).file(fileName).save(videoUrl);
    
    // Update segment with results
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    await firestore
      .collection('projects')
      .doc(projectId)
      .collection('videoSegments')
      .doc(segmentId)
      .update({
        status: 'completed',
        videoUrl: publicUrl,
        completedAt: new Date(),
      });
    
    res.json({ success: true, videoUrl: publicUrl });
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: 'Video generation failed' });
  }
});
```

## Phase 6: Cloud Functions Integration

### 6.1 Firebase Functions Setup
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { CloudTasksClient } from '@google-cloud/tasks';

const tasksClient = new CloudTasksClient();

// Trigger on project creation
export const onProjectCreated = functions.firestore
  .document('projects/{projectId}')
  .onCreate(async (snap, context) => {
    const project = snap.data();
    
    // Create initial generation job
    await firestore.collection('projects')
      .doc(context.params.projectId)
      .collection('generationJobs')
      .add({
        type: 'script',
        status: 'queued',
        input: {
          bookContent: project.bookSource.content,
          genre: project.settings.genre,
          targetDuration: project.settings.targetDuration,
        },
        createdAt: new Date(),
      });
    
    // Queue Cloud Task for script generation
    const task = {
      parent: tasksClient.queuePath(
        process.env.GCP_PROJECT,
        process.env.GCP_LOCATION,
        'script-generation-queue'
      ),
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: 'https://storyteller-service.run.app/generate-script',
          body: Buffer.from(JSON.stringify({
            projectId: context.params.projectId,
            ...project,
          })),
        },
      },
    };
    
    await tasksClient.createTask(task);
  });
```

### 6.2 Webhook Handlers
```typescript
// functions/src/webhooks.ts
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

// Handle video generation completion webhooks
export const onVideoCompleted = functions.https.onRequest(
  async (req, res) => {
    const { projectId, segmentId, videoUrl } = req.body;
    
    await firestore
      .collection('projects')
      .doc(projectId)
      .collection('videoSegments')
      .doc(segmentId)
      .update({
        status: 'completed',
        videoUrl,
        completedAt: new Date(),
      });
    
    // Check if all segments are completed
    const segments = await firestore
      .collection('projects')
      .doc(projectId)
      .collection('videoSegments')
      .get();
    
    const allCompleted = segments.docs.every(
      doc => doc.data().status === 'completed'
    );
    
    if (allCompleted) {
      // Trigger assembly job
      await triggerAssemblyJob(projectId);
    }
    
    res.json({ success: true });
  }
);
```

## Phase 7: Video Generation Pipeline Integration

### 7.1 FLUX 3 Integration
```typescript
// lib/video/flux3.ts
import axios from 'axios';

const FLUX3_API_URL = 'https://api.muapi.ai/flux3/video';

export async function generateVideoWithFLUX3(prompt: string, options: {
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  generateAudio?: boolean;
}) {
  const response = await axios.post(FLUX3_API_URL, {
    prompt,
    duration: options.duration || 10,
    resolution: options.resolution || '1080p',
    aspectRatio: options.aspectRatio || '16:9',
    generateAudio: options.generateAudio !== false,
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.FLUX3_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.data.videoUrl;
}
```

### 7.2 Video Assembly Pipeline
```typescript
// lib/video/assembly.ts
import { Storage } from '@google-cloud/storage';
import { execSync } from 'child_process';

const storage = new Storage();

export async function assembleVideo(projectId: string) {
  const bucket = storage.bucket('bookflix-videos');
  const files = await bucket.getFiles({ prefix: `${projectId}/` });
  
  // Download all segments
  const segmentPaths = files[0].map(file => {
    const localPath = `/tmp/${file.name.split('/').pop()}`;
    file.download({ destination: localPath });
    return localPath;
  });
  
  // Use FFmpeg to stitch segments
  const outputPath = `/tmp/${projectId}_final.mp4`;
  const fileList = segmentPaths.join('|');
  
  execSync(
    `ffmpeg -i "concat:${fileList}" -c copy ${outputPath}`
  );
  
  // Upload final video
  const finalFileName = `${projectId}/final.mp4`;
  await bucket.upload(outputPath, { destination: finalFileName });
  
  return `https://storage.googleapis.com/bookflix-videos/${finalFileName}`;
}
```

## Phase 8: Deployment Strategy

### 8.1 Firebase Hosting Deployment
```bash
# Build Next.js app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 8.2 Cloud Run Deployment
```bash
# Build and deploy RLM-enhanced Storyteller service
gcloud builds submit --tag gcr.io/bookflix/storyteller-service
gcloud run deploy storyteller-service \
  --image gcr.io/bookflix/storyteller-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 8Gi \
  --cpu 4 \
  --max-instances 10 \
  --timeout 300s \
  --set-env-vars=GEMINI_API_KEY=$GEMINI_API_KEY \
  --set-env-vars=RLM_MAX_DEPTH=1 \
  --set-env-vars=RLM_COST_THRESHOLD=10.0 \
  --set-env-vars=RLM_PARALLEL_LIMIT=10

# Build and deploy Video Generation service
gcloud builds submit --tag gcr.io/bookflix/video-generation-service
gcloud run deploy video-generation-service \
  --image gcr.io/bookflix/video-generation-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 8Gi \
  --cpu 4
```

### 8.2.1 RLM-Specific Configuration

**Environment Variables for RLM**:
```bash
# RLM Configuration
RLM_MAX_DEPTH=1              # CRITICAL: Never set > 1
RLM_COST_THRESHOLD=10.0      # Dollars
RLM_TOKEN_BUDGET=100000      # Tokens per query
RLM_PARALLEL_LIMIT=10        # Max parallel sub-LLM calls
RLM_BATCH_SIZE=5             # Scenes per batch
RLM_TIMEOUT=300              # Seconds per phase

# Model Selection
RLM_ROOT_MODEL=gemini-2.5-pro
RLM_SUB_MODEL=gemini-2.5-flash

# Fallback Configuration
RLM_FALLBACK_ENABLED=true
RLM_FALLBACK_TRIGGER=timeout_or_cost
RLM_FALLBACK_MODE=truncated_context
```

**Resource Allocation**:
- **Memory**: 8Gi minimum (for large book processing)
- **CPU**: 4 vCPUs (for parallel sub-LLM processing)
- **Timeout**: 300s (5 minutes max per request)
- **Max Instances**: 10 (for concurrent project processing)

### 8.3 Cloud Functions Deployment
```bash
# Deploy Firebase Functions
firebase deploy --only functions
```

### 8.4 Cloud CDN Setup
```bash
# Create CDN backend
gcloud compute backend-buckets create bookflix-videos \
  --gcs-bucket-name=bookflix-videos

# Create CDN policy
gcloud compute backend-buckets update bookflix-videos \
  --enable-cdn
```

### 8.5 RLM Monitoring Setup
```bash
# Create Cloud Monitoring dashboard for RLM metrics
gcloud monitoring dashboards create bookflix-rlm-dashboard \
  --config-from-file=monitoring/rlm-dashboard.json

# Set up cost alerting
gcloud alpha monitoring policies create bookflix-rlm-cost-alert \
  --condition="fetch_prometheus('bookflix_rlm_cost_total') > 100" \
  --notification-channels=cost-alert-channel

# Set up fallback rate alerting
gcloud alpha monitoring policies create bookflix-rlm-fallback-alert \
  --condition="fetch_prometheus('bookflix_rlm_fallback_rate') > 0.1" \
  --notification-channels=ops-alert-channel
```

**RLM-Specific Metrics to Monitor**:
- `bookflix_rlm_cost_total` - Total RLM processing cost
- `bookflix_rlm_tokens_total` - Total tokens processed
- `bookflix_rlm_fallback_rate` - Rate of fallback to standard approach
- `bookflix_rlm_phase_duration` - Duration per RLM phase
- `bookflix_rlm_parallel_efficiency` - Sub-LLM parallel processing efficiency
- `bookflix_rlm_character_consistency_score` - Character consistency quality metric
```bash
# Create CDN backend
gcloud compute backend-buckets create bookflix-videos \
  --gcs-bucket-name=bookflix-videos

# Create CDN policy
gcloud compute backend-buckets update bookflix-videos \
  --enable-cdn
```

## Phase 9: Monitoring & Scaling

### 9.1 RLM Performance Monitoring

```typescript
// lib/genkit/monitoring/rlmMetrics.ts
import { Monitoring } from '@google-cloud/monitoring';

const monitoring = new Monitoring();

export async function logRLMMetric(metricType: string, value: number, labels: Record<string, string> = {}) {
  const dataPoint = {
    interval: {
      endTime: new Date(),
    },
    value: {
      doubleValue: value,
    },
  };
  
  await monitoring.projects.timeSeries.create({
    name: `projects/${process.env.GCP_PROJECT}`,
    timeSeries: [{
      metric: {
        type: metricType,
        labels,
      },
      resource: {
        type: 'cloud_run_revision',
        labels: {
          service_name: 'storyteller-service',
        },
      },
      points: [dataPoint],
    }],
  });
}

// RLM-specific metrics
export const RLM_METRICS = {
  COST_TOTAL: 'custom.googleapis.com/bookflix/rlm/cost_total',
  TOKENS_TOTAL: 'custom.googleapis.com/bookflix/rlm/tokens_total',
  FALLBACK_RATE: 'custom.googleapis.com/bookflix/rlm/fallback_rate',
  PHASE_DURATION: 'custom.googleapis.com/bookflix/rlm/phase_duration',
  PARALLEL_EFFICIENCY: 'custom.googleapis.com/bookflix/rlm/parallel_efficiency',
  CHARACTER_CONSISTENCY: 'custom.googleapis.com/bookflix/rlm/character_consistency',
};

// Usage in RLM flow
await logRLMMetric(RLM_METRICS.COST_TOTAL, costReport.totalCost, { phase: 'complete' });
await logRLMMetric(RLM_METRICS.TOKENS_TOTAL, costReport.totalTokens, { phase: 'complete' });
await logRLMMetric(RLM_METRICS.FALLBACK_RATE, fallbackRate, { method: 'rlm' });
```

### 9.2 Cloud Monitoring Setup
```typescript
// lib/monitoring.ts
import { Monitoring } from '@google-cloud/monitoring';

const monitoring = new Monitoring();

export async function logMetric(metricType: string, value: number) {
  const dataPoint = {
    interval: {
      endTime: new Date(),
    },
    value: {
      doubleValue: value,
    },
  };
  
  await monitoring.projects.timeSeries.create({
    name: `projects/${process.env.GCP_PROJECT}`,
    timeSeries: [{
      metric: {
        type: metricType,
      },
      resource: {
        type: 'cloud_run_revision',
      },
      points: [dataPoint],
    }],
  });
}
```

### 9.3 Auto-scaling Configuration
```yaml
# cloudrun/storyteller-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: storyteller-service
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '10'
        autoscaling.knative.dev/minScale: '1'
        autoscaling.knative.dev/target: '70'
```

## Phase 10: Cost Optimization

### 10.1 Resource Allocation
- **Storyteller Service (RLM-Enhanced)**: 4 CPUs, 8GB RAM (for parallel sub-LLM processing)
- **Video Generation Service**: 4 CPUs, 8GB RAM (GPU-intensive)
- **Firebase Functions**: 256MB - 2GB based on function complexity

### 10.2 RLM Cost Optimization
- **Token Budget**: Set hard limits (100K tokens per query)
- **Cost Threshold**: Automatic fallback at $10 per query
- **Model Selection**: Use Gemini 2.5 Flash for sub-tasks (cheaper)
- **Parallel Processing**: Batch sub-LLM calls to reduce overhead
- **Caching**: Cache character profiles across scenes
- **Smart Delegation**: Only delegate complex tasks to sub-LLMs

### 10.3 Storage Optimization
- **Lifecycle Policies**: Auto-delete temporary files after 7 days
- **CDN Caching**: Aggressive caching for completed videos
- **Compression**: Use efficient video codecs (H.265)

### 10.4 GPU Spot Instances
- Use Preemptible VMs for video generation when possible
- Implement checkpoint/resume for long-running jobs

## Implementation Timeline

### Week 1-2: Foundation
- Firebase project setup
- Next.js project initialization
- Authentication implementation
- Basic UI components
- **RLM infrastructure setup** (Cloud Run, environment variables)

### Week 3-4: Core Features with RLM
- Firestore schema implementation
- **RLM-enhanced Genkit flows development**
- **Root LLM orchestration implementation**
- **Sub-LLM delegation system**
- Cloud Run services setup
- Basic video generation pipeline

### Week 5-6: Advanced Features
- **Character consistency tracking with RLM**
- **Narrative structure analysis with RLM**
- Video assembly pipeline
- Audio synchronization
- Real-time progress tracking
- **Cost monitoring and fallback implementation**

### Week 7-8: Production Readiness
- **RLM performance monitoring**
- **RLM cost optimization**
- Monitoring and logging
- Error handling and recovery
- Performance optimization
- Security hardening

### Week 9-10: Testing & Deployment
- **RLM vs Traditional A/B testing**
- End-to-end testing
- Load testing
- Security auditing
- Production deployment
- **RLM fine-tuning based on metrics**

## Next Steps

1. **Initialize Firebase Project**: Create Firebase project and enable required services
2. **Set Up Development Environment**: Configure local development with Firebase emulators
3. **Implement Authentication**: Set up Firebase Authentication with Google provider
4. **Create Database Schema**: Implement Firestore collections and security rules
5. **Build Genkit Flows**: Develop storyteller and cinematography agent flows
6. **Deploy Cloud Run Services**: Containerize and deploy backend services
7. **Integrate Video Generation**: Connect with FLUX 3 API and assembly pipeline
8. **Test End-to-End**: Verify complete pipeline from book upload to video delivery

This implementation plan provides a clear path to building BookFlix using Google's ecosystem, ensuring scalability, maintainability, and cost-effectiveness while leveraging the powerful AI capabilities of Google's Gemini models through Genkit.