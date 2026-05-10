import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronDown, RefreshCcw } from 'lucide-react-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CinematicViewport } from './CinematicViewport';

interface SovereignTrackerProps {
  isSubmitting: boolean;
  activeBook: any;
  liveTask: string;
  displayStep: number;
  nextStep: any;
  isTasksExpanded: boolean;
  setTasksExpanded: (expanded: boolean) => void;
  playTap: () => void;
  pulseAnim: any;
}

const TypewriterText = (props: any) => {
  const { text, style } = props;
  const [displayedText, setDisplayedText] = React.useState('');
  
  React.useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [text]);

  return <Text style={style}>{displayedText}</Text>;
};

export const getDynamicSteps = (productionType: string, modelId: string) => {
  const isHighPrestige = modelId?.includes('h200') || modelId?.includes('veo');
  
  const baseSteps = [
    { id: 1,  title: 'Story Analysis',     desc: 'Processing narrative intelligence.' },
    { id: 2,  title: 'Visual Setup',       desc: 'Mapping thematic and color anchors.' },
  ];

  if (isHighPrestige) {
    baseSteps.push(
      { id: 3,  title: 'Neural Scoping',    desc: 'Synthesizing high-fidelity técnicos.' },
      { id: 4,  title: 'Latent Seeding',    desc: 'Warming up the H200 fleet.' }
    );
  }

  baseSteps.push(
    { id: 5,  title: 'Asset Generation',    desc: 'Synthesizing the visual DNA.' },
    { id: 6,  title: 'Neural Mastering',    desc: 'Finalizing the 4K cinematic proxy.' }
  );

  return baseSteps;
};

export const SovereignTracker = (props: SovereignTrackerProps) => {
  const {
    isSubmitting,
    activeBook,
    liveTask,
    displayStep,
    nextStep,
    isTasksExpanded,
    setTasksExpanded,
    playTap,
    pulseAnim
  } = props;

  const discardProduction = useMutation(api.studio.discardProduction);
  const refireProduction = useMutation(api.studio.refireProduction);
  
  const activeSteps = getDynamicSteps(activeBook?.productionType || 'movie', activeBook?.activeModelId || 'siphon-h200');
  const [hasEverShown, setHasEverShown] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSubmitting || activeBook) {
      setHasEverShown(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } else if (activeBook?.status === 'completed') {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 1000, useNativeDriver: true }).start(() => setHasEverShown(false));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting, activeBook, activeBook?.status]);

  if (!hasEverShown && !isSubmitting && !activeBook) {
    return null;
  }

  const TOTAL_STEPS = activeSteps.length;

  if (!isSubmitting && !activeBook) {
    return (
      <View style={styles.trackerContainer}>
        <View style={styles.liveFeedBar}>
           <Text style={styles.topPlanLabel}>SOVEREIGN FLEET - STANDBY</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.trackerContainer}>
      <TouchableOpacity 
        onPress={() => { playTap(); setTasksExpanded(!isTasksExpanded); }}
        activeOpacity={0.8}
        style={[
          styles.liveFeedBar,
          isTasksExpanded && styles.liveFeedBarExpanded
        ]}
      >
        <View style={styles.topPlanHeader}>
          <View style={styles.topPlanLeft}>
            <Text style={styles.topPlanLabel}>SOVEREIGN FLEET STATUS</Text>
            <Text style={[styles.topPlanStatus, activeBook?.status === 'failed' && { color: '#26619C' }]}>
              {activeBook?.status === 'failed' ? 'RE-ROUTING CLUSTER...' : `${displayStep - 1}/${TOTAL_STEPS} COMPLETED`}
            </Text>
          </View>

          {activeBook?.status === 'failed' && (
            <TouchableOpacity 
              onPress={() => {
                playTap?.();
                discardProduction({ bookId: activeBook._id });
              }}
              style={styles.resetButton}
            >
              <RefreshCcw color="#26619C" size={12} />
              <Text style={styles.resetText}>PURGE & RESET</Text>
            </TouchableOpacity>
          )}

          {activeBook?.status === 'pending' && !isSubmitting && (
            <TouchableOpacity 
              onPress={() => {
                playTap?.();
                refireProduction({ bookId: activeBook._id });
              }}
              style={styles.refireButton}
            >
              <RefreshCcw color="#FF8A00" size={12} />
              <Text style={styles.refireText}>RE-FIRE FLEET</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.topPlanSegments}>
            {activeSteps.map((step: any) => {
              const isFailed = activeBook?.status === 'failed' && step.id === displayStep;
              return (
                <View 
                  key={step.id} 
                  style={[
                    styles.segment,
                    step.id < displayStep && styles.segmentCompleted,
                    step.id === displayStep && styles.segmentActive,
                    isFailed && { backgroundColor: '#26619C' }
                  ]} 
                />
              );
            })}
          </View>

          <ChevronDown 
            size={16} 
            color="rgba(255,255,255,0.6)" 
            style={{ transform: [{ rotate: isTasksExpanded ? '180deg' : '0deg' }] }} 
          />
        </View>
      </TouchableOpacity>

      {isTasksExpanded && (
        <View style={styles.taskDetailContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {activeSteps.map((step: any) => {
              const isCompleted = step.id < displayStep;
              const isActive    = step.id === displayStep;
              
              return (
                <View key={step.id} style={styles.taskRow}>
                  <View style={styles.taskIconColumn}>
                    <View style={[
                      styles.taskDot,
                      isCompleted && styles.taskDotCompleted,
                      isActive && styles.taskDotActive
                    ]}>
                      {isActive && (
                        <Animated.View style={[styles.taskPulse, { opacity: pulseAnim }]} />
                      )}
                    </View>
                    {step.id < activeSteps.length && (
                      <View style={[
                        styles.taskLine,
                        isCompleted && styles.taskLineCompleted
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.taskTextColumn}>
                    <Text style={[
                      styles.taskTitleText,
                      isActive && styles.taskTitleActive,
                      isCompleted && styles.taskTitleCompleted
                    ]}>
                      {step.title}
                    </Text>
                    {isActive && (
                      <View style={[styles.thinkingConsole, activeBook?.status === 'failed' && { borderColor: '#26619C' }]}>
                        <View style={styles.consoleHeader}>
                          <Text style={[styles.consoleLabel, activeBook?.status === 'failed' && { color: '#26619C' }]}>
                            {activeBook?.status === 'failed' ? 'DIRECTORIAL_RECOVERY_MODE' : 'DIRECTORIAL_LOG'}
                          </Text>
                          <Animated.View style={[styles.consoleCursor, { opacity: pulseAnim }, activeBook?.status === 'failed' && { backgroundColor: '#26619C' }]} />
                        </View>
                        <TypewriterText 
                          text={activeBook?.status === 'failed' ? 'Agent failure detected. Initiating autonomous cluster handover...' : liveTask} 
                          style={styles.consoleText}
                        />
                        
                        {(step.id === 5 || step.id === 7) && (
                          <CinematicViewport 
                            productionId={activeBook?._id} 
                            isActive={isActive && activeBook?.status !== 'failed'} 
                          />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  trackerContainer: {
    marginBottom: 16,
  },
  liveFeedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#48484A',
    gap: 12,
    overflow: 'hidden',
    backgroundColor: '#3A3A3E',
  },
  liveFeedBarExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  taskDetailContainer: {
    marginTop: 0,
    paddingTop: 8,
    paddingHorizontal: 4,
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#48484A',
    maxHeight: 300,
    overflow: 'hidden',
  },
  topPlanHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  topPlanLeft: {
    gap: 2,
  },
  topPlanLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topPlanStatus: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(38,97,156,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  resetText: {
    color: '#26619C',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  refireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,138,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  refireText: {
    color: '#FF8A00',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topPlanSegments: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 8,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  segmentCompleted: {
    backgroundColor: '#D4AF37',
  },
  segmentActive: {
    backgroundColor: '#FFD700',
  },
  taskRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 16,
  },
  taskIconColumn: {
    alignItems: 'center',
    width: 20,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  taskDotCompleted: {
    backgroundColor: '#D4AF37',
  },
  taskDotActive: {
    backgroundColor: '#FFD700',
  },
  taskPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    transform: [{ scale: 1.5 }],
  },
  taskLine: {
    position: 'absolute',
    top: 12,
    bottom: -12,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 1,
  },
  taskLineCompleted: {
    backgroundColor: 'rgba(212,175,55,0.3)',
  },
  taskTextColumn: {
    flex: 1,
    gap: 2,
  },
  taskTitleText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  taskTitleActive: {
    color: '#FDF6EE',
    fontWeight: '900',
  },
  taskTitleCompleted: {
    color: '#FDF6EE',
    opacity: 0.6,
  },
  taskDesc: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    lineHeight: 14,
  },
  thinkingConsole: {
    marginTop: 8,
    backgroundColor: '#121214',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  consoleLabel: {
    color: '#FDF6EE',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    opacity: 0.8,
  },
  consoleCursor: {
    width: 4,
    height: 8,
    backgroundColor: '#FDF6EE',
  },
  consoleText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
