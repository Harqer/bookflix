import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useProductionState() {
  const latestBooks = useQuery(api.studio.listBooks) ?? [];
  const activeBook  = latestBooks[0];
  const chapters    = useQuery(api.studio.listChapters, activeBook ? { bookId: activeBook._id } : "skip") ?? [];
  const jobs        = useQuery(api.studio.listJobs, activeBook ? { bookId: activeBook._id } : "skip") ?? [];
  
  const activeChapter = chapters[0];
  const scenes        = useQuery(api.studio.listScenes, activeChapter ? { chapterId: activeChapter._id } : "skip") ?? [];
  const assets        = useQuery(api.studio.listAssets, activeBook ? { bookId: activeBook._id } : "skip") ?? [];
  
  const [activeSceneId, setActiveSceneId] = useState<any>(null);
  useEffect(() => {
    if (scenes.length > 0 && !activeSceneId) setActiveSceneId(scenes[0]._id);
  }, [scenes]);

  const shots = useQuery(api.studio.listShots, activeSceneId ? { sceneId: activeSceneId } : "skip") ?? [];

  const [isPlaying, setIsPlaying]     = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [liveTask, setLiveTask]       = useState('Standby for production directive...');
  const [currentStep, setCurrentStep] = useState(0);

  const TOTAL_STEPS = 10;

  const getDerivedStep = () => {
    if (!activeBook) return 0;
    
    const status = activeBook.status;
    
    // 🛰️ Universal Telemetry Mapping
    if (status === 'pending') return 1;
    if (status === 'analyzing') return 1;
    if (status === 'scouting') return 2;
    if (status === 'scripting') return 3;
    if (status === 'directing') return 4;
    if (status === 'seeding') return 4;
    if (status === 'generating') return 5;
    
    if (status === 'ready_to_render' || status === 'rendering') {
      const hasCosmos = jobs.some(j => j.type === 'cosmos' && j.status === 'completed');
      const hasLighting = jobs.some(j => j.type === 'lighting' && j.status === 'completed');
      
      const avgProgress = jobs.length > 0 
        ? jobs.reduce((acc, j) => acc + (j.progress || 0), 0) / jobs.length 
        : 0;

      if (avgProgress > 90) return 9;
      if (avgProgress > 60) return 8;
      if (avgProgress > 30) return 7;
      if (hasLighting) return 6;
      if (hasCosmos) return 5;
      return 5;
    }
    
    if (status === 'mastering') return 9;
    if (status === 'completed') return 10;
    
    return 1;
  };

  const displayStep = getDerivedStep();
  const nextStep    = displayStep < TOTAL_STEPS ? PRODUCTION_STEPS[displayStep] : null;

  useEffect(() => {
    if (displayStep > 0) {
      setCurrentStep(displayStep);
      // 🛰️ Step-Specific Neural Reasoning
      const REASONING_MAP: Record<number, string> = {
        1: 'Dissecting narrative semiotics and authorial DNA...',
        2: 'Mapping thematic anchors and color-space directives...',
        3: 'Synthesizing technical screenplay and multi-track manifests...',
        4: 'Anchoring spatial coordinates and depth-planes in USD...',
        5: 'Generating physical environments and asset topologies...',
        6: 'Simulating atmospheric photons and soft-bounce illumination...',
        7: 'Synthesizing kinematic motion and neural physics...',
        8: 'Applying 4K texture mastery and temporal consistency...',
        9: 'Layering symphonic score and spatial audio objects...',
        10: 'Exporting 4K theatrical master. Production complete.',
      };
      
      setLiveTask(REASONING_MAP[displayStep] || 'Processing technical directive...');
    }
  }, [displayStep]);

  useEffect(() => {
    if (!activeBook) return;
    // Special overrides for failed states
    if (activeBook.status === 'failed') {
      setLiveTask('⚠️ Agent failure detected. Initiating autonomous cluster handover...');
    }
  }, [activeBook?.status]);

  const isMovie = activeBook?.productionType === 'movie';
  const defaultDuration = isMovie ? 15 : 7; // 🎥 Movie: 15s | 📺 Series: 7s
  
  const totalDuration = scenes.length > 0 ? scenes.reduce((acc, s) => acc + (s.endTime || defaultDuration), 0) : (isMovie ? 60 : 30);
  const currentTime   = (playbackProgress / 100) * totalDuration;

  let activeScene = scenes[0];
  let accumulated = 0;
  if (scenes.length > 0) {
    for (const s of scenes) {
      const sceneDur = s.endTime || defaultDuration;
      if (currentTime >= accumulated && currentTime <= accumulated + sceneDur) {
        activeScene = s;
        break;
      }
      accumulated += sceneDur;
    }
  }

  return {
    activeBook,
    activeChapter,
    scenes,
    assets,
    shots,
    jobs,
    displayStep,
    nextStep,
    currentStep,
    liveTask,
    isPlaying,
    setIsPlaying,
    playbackProgress,
    setPlaybackProgress,
    totalDuration,
    currentTime,
    activeScene,
    TOTAL_STEPS
  };
}

export const PRODUCTION_STEPS = [
  { id: 1,  title: 'Story Analysis',     desc: 'Processing narrative intelligence.' },
  { id: 2,  title: 'Visual Setup',       desc: 'Mapping thematic and color anchors.' },
  { id: 3,  title: 'Technical Script',    desc: 'Synthesizing technical manifests.' },
  { id: 4,  title: 'World Seeding',       desc: 'Defining spatial coordinates.' },
  { id: 5,  title: 'Asset Generation',    desc: 'Generating physical environments.' },
  { id: 6,  title: 'Lighting',            desc: 'Simulating atmospheric light.' },
  { id: 7,  title: 'Animation',           desc: 'Synthesizing motion and physics.' },
  { id: 8,  title: 'Refinement',          desc: 'Applying visual style mastery.' },
  { id: 9,  title: 'Audio Mix',           desc: 'Layering score and sfx.' },
  { id: 10, title: 'Final Master',        desc: 'Exporting cinematic master.' },
];
