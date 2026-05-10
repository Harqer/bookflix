import React, { useState, useRef, useEffect } from 'react';
import { 
  View, StyleSheet, Animated, PanResponder, Platform, Text, TouchableOpacity, Image 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as DocumentPicker from 'expo-document-picker';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, EyeOff, Clapperboard, Play } from 'lucide-react-native';

// ── Studio Components & Hooks ──
import { useProductionState } from '@/hooks/use-production-state';
import { CinemaMonitor } from '@/components/studio/CinemaMonitor';
import { NleTimeline } from '@/components/studio/NleTimeline';
import { DirectorialChat, CommandDock } from '@/components/studio/DirectorialChat';
import { useAudioDirector } from '@/hooks/use-audio-director';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { playTap } = useAudioDirector();
  const bottomPadding = Platform.OS === "web" ? 16 : Math.max(insets.bottom, 12);
  const tabBarHeight = 72 + bottomPadding;
  const { 
    activeBook, scenes, assets, shots, displayStep, nextStep, currentStep, liveTask, isPlaying, setIsPlaying,
    playbackProgress, setPlaybackProgress, totalDuration, currentTime, activeScene 
  } = useProductionState();

  const [isPreviewVisible, setPreviewVisible] = useState(false);
  const [isTasksExpanded, setTasksExpanded] = useState(true);
  const [productionMode, setProductionMode] = useState<'movie' | 'series'>('movie');
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setFile] = useState<any>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedShotId, setSelectedShotId] = useState<any>(null);
  const scrollRef = useRef<any>(null);

  // ── 💬 Persistence ──────────────────────────────────────────────
  const messages = useQuery(api.studio.listMessages, activeBook ? { bookId: activeBook._id } : "skip") || [];
  const submitBook = useAction(api.submission.submitBookProtected);
  const sendMessage = useMutation(api.studio.sendMessage);

  const player = useVideoPlayer(activeScene?.videoUrl || '', p => {
    p.loop = true;
    if (isPlaying) p.play();
  });

  useEffect(() => {
    if (isPlaying) player.play();
    else player.pause();
  }, [isPlaying, activeScene?.videoUrl]);

  // ── 🎚️ Dynamic Layout State ──────────────────────────────────────────────
  const [displayHeight, setDisplayHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const editorHeight = useRef(new Animated.Value(300)).current;
  const lastHeight = useRef(300);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        // 🚀 Sovereign Physics: Responsive vertical tracking
        const newHeight = lastHeight.current - gestureState.dy;
        if (newHeight > 100 && newHeight < 1000) {
          editorHeight.setValue(newHeight);
          setDisplayHeight(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        const finalHeight = Math.max(100, Math.min(1000, lastHeight.current - gestureState.dy));
        lastHeight.current = finalHeight;
        setDisplayHeight(finalHeight);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      }
    })
  ).current;

  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  async function handleSend() {
    if (!prompt.trim() && !selectedFile) return;
    playTap();
    const currentPrompt = prompt;
    const currentFile = selectedFile;
    setPrompt('');
    setFile(null);
    setSubmitting(true);
    
    try {
      if (selectedShotId) {
        // 🛠️ TARGETED REFINEMENT MODE
        const refineTargetedAsset = useAction(api.agents.master_orchestrator.refineTargetedAsset);
        await refineTargetedAsset({
          bookId: activeBook._id,
          chapterId: activeBook.orchestrationState?.currentChapterId, // Assuming this exists in state
          sceneId: activeScene?._id,
          refinementPrompt: currentPrompt
        });
      } else {
        // 🚀 FULL PRODUCTION MODE
        await submitBook({ 
          title: productionMode === 'movie' ? "Untitled Movie" : "Untitled Series", 
          author: "Director",
          rawText: currentPrompt,
          fileStorageId: currentFile?.id,
          productionMode: productionMode, 
        });
      }

      // 🛰️ Enterprise Tracking: Tagging the directorial message to this book
      if (activeBook) {
        await sendMessage({
          bookId: activeBook._id,
          text: currentPrompt,
          role: "user"
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePickFile() {
    playTap();
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled) {
        setFile(res.assets[0]);
      }
    } catch (_) {}
  }

  const handleTimelinePress = (e: any) => {
    const { locationX } = e.nativeEvent;
    const percent = (locationX / 1200) * 100;
    setPlaybackProgress(percent);
  };

  return (
    <View style={[
      styles.container, 
      isDragging && Platform.OS === 'web' && { userSelect: 'none' } as any
    ]}>
      {/* ── 👁️ PREVIEW TOGGLE (Left Side) ───────────────────────────── */}


      {/* ── 💬 RESPONSE SECTION (Middle) ────────────────────────────── */}
      <View style={{ flex: 1 }}>
        <DirectorialChat 
          messages={messages}
          isSubmitting={isSubmitting}
          activeBook={activeBook}
          liveTask={liveTask}
          displayStep={displayStep}
          nextStep={nextStep}
          isTasksExpanded={isTasksExpanded}
          setTasksExpanded={setTasksExpanded}
          scrollRef={scrollRef}
          extraPaddingBottom={displayHeight + 100}
          assets={assets}
          playTap={playTap}
        />
      </View>

      {/* ── 🎚️ EDITOR SECTION (Production Strip) ───────────────────── */}
      <Animated.View style={[
        styles.productionStrip, 
        { height: editorHeight }
      ]}>
        
        <View {...panResponder.panHandlers} style={styles.dragHandle}>
          <View style={styles.dragIndicator} />
          <Text style={styles.dragLabel}>NLE TIMELINE • MASTER</Text>
        </View>

        <View style={styles.monitorContent}>
          <CinemaMonitor 
            activeScene={activeScene}
            activeBook={activeBook}
            player={player}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            formatTime={formatTime}
            currentTime={currentTime}
            totalDuration={totalDuration}
            isSubmitting={isSubmitting}
            playTap={playTap}
          />
        </View>

          <NleTimeline 
            displayStep={displayStep}
            activeBook={activeBook}
            playbackProgress={playbackProgress}
            pulseAnim={pulseAnim}
            handleTimelinePress={handleTimelinePress}
            onSelectShot={(id) => setSelectedShotId(id === selectedShotId ? null : id)}
            selectedShotId={selectedShotId}
            shots={shots}
          />
      </Animated.View>

      {/* ── ⌨️ CHAT INPUT (Bottom) ───────────────────────────────────── */}
      <View style={styles.dockWrapper}>
          <CommandDock 
            prompt={prompt}
            setPrompt={setPrompt}
            handleSend={handleSend}
            handlePickFile={handlePickFile}
            selectedFile={selectedFile}
            isSubmitting={isSubmitting}
            insets={insets}
            isFocused={isFocused}
            setIsFocused={setIsFocused}
            productionMode={productionMode}
            setProductionMode={setProductionMode}
          />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0506',
  },
  dockWrapper: {
    position: 'absolute',
    bottom: 84, // 🛠️ Adjusted to sit above the absolute tab bar
    left: 0,
    right: 0,
    zIndex: 2000,
  },
  previewToggle: {
    position: 'absolute',
    left: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewSection: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewMonitor: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewVideo: {
    flex: 1,
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  previewPlaceholderTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  previewPlaceholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 4,
  },
  productionStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E', // 🌑 Dark base
    borderTopWidth: 1,
    borderTopColor: '#48484A', // 💎 Sharp chrome edge
    paddingBottom: 180, // 🚀 Lifted to clear Chat Bot & Tabs
    overflow: 'hidden',
  },
  dragHandle: {
    width: '100%',
    height: 48, // 🏗️ Increased hit area for easier dragging
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backgroundColor: '#2C2C2E', // 🩶 Deep charcoal titanium
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
    ...Platform.select({
      web: { cursor: 'ns-resize' as any }
    })
  },
  dragIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
    pointerEvents: 'none', // 🚀 Stop text selection
  },
  dragLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    pointerEvents: 'none', // 🚀 Stop text selection
  },
  monitorContent: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  miniTimecode: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  miniTimecodeText: {
    color: 'white',
    fontSize: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  miniPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
