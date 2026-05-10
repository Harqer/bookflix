import React from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Sparkles, Clapperboard } from 'lucide-react-native';

import { AiMessageItem } from './chat/AiMessageItem';
import { SovereignTracker } from './chat/SovereignTracker';
export { CommandDock } from './chat/CommandDock';

interface DirectorialChatProps {
  messages: any[];
  isSubmitting: boolean;
  activeBook: any;
  liveTask: string;
  displayStep: number;
  nextStep: any;
  isTasksExpanded: boolean;
  setTasksExpanded: (expanded: boolean) => void;
  scrollRef: any;
  extraPaddingBottom?: number;
  assets?: any[];
  playTap: () => void;
}

export function DirectorialChat({
  messages,
  isSubmitting,
  activeBook,
  liveTask,
  displayStep,
  nextStep,
  isTasksExpanded,
  setTasksExpanded,
  scrollRef,
  extraPaddingBottom = 0,
  assets = [],
  playTap
}: DirectorialChatProps) {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: extraPaddingBottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* The Tracker is now at the top of the scroll or can be sticky */}
        <SovereignTracker 
          isSubmitting={isSubmitting}
          activeBook={activeBook}
          liveTask={liveTask}
          displayStep={displayStep}
          nextStep={nextStep}
          isTasksExpanded={isTasksExpanded}
          setTasksExpanded={setTasksExpanded}
          playTap={playTap}
          pulseAnim={pulseAnim}
        />

        {messages.length === 0 && !activeBook && !isSubmitting && (
          <View style={styles.standbyContainer}>
            <Clapperboard color="rgba(255,255,255,0.03)" size={120} strokeWidth={0.5} />
            <Text style={styles.standbyText}>STANDBY FOR PRODUCTION</Text>
          </View>
        )}

        {messages.map((msg) => (
          <AiMessageItem key={msg._id} msg={msg} playTap={playTap} />
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  standbyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    opacity: 0.4,
  },
  standbyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 24,
  },
  assetsContainer: {
    marginTop: 12,
    gap: 16,
  },
  assetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 4,
  },
  assetsHeaderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  assetsScroll: {
    gap: 12,
    paddingRight: 20,
  },
  assetCard: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  assetTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(38, 97, 156, 0.1)', // 💎 Lapis Tint
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#26619C', // 💎 Lapis Filigree
  },
  assetTypeTagText: {
    color: '#FDF6EE', // 🏛️ Marble White
    fontSize: 8,
    fontWeight: '900',
  },
  assetName: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  assetDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    lineHeight: 14,
  },
});
