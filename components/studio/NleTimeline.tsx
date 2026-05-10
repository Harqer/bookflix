import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { FileText, Globe, Wand2, Clapperboard, Music } from 'lucide-react-native';

interface NleTimelineProps {
  displayStep: number;
  activeBook: any;
  playbackProgress: number;
  pulseAnim: Animated.Value;
  handleTimelinePress: (e: any) => void;
  onSelectShot?: (shotId: any) => void;
  selectedShotId?: any;
  shots?: any[];
}

const TimelineGrid = () => (
  <View style={{ position: 'absolute', inset: 0, flexDirection: 'row' }}>
    {Array.from({ length: 24 }).map((_, i) => (
      <View key={i} style={{ width: 50, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.03)', height: '100%', alignItems: 'center' }}>
        <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.1)', marginTop: 2, fontWeight: '700' }}>
          {String(i * 5).padStart(2, '0')}s
        </Text>
      </View>
    ))}
  </View>
);

export function NleTimeline({
  displayStep,
  activeBook,
  playbackProgress,
  pulseAnim,
  handleTimelinePress,
  onSelectShot,
  selectedShotId,
  shots = []
}: NleTimelineProps) {
  return (
    <View style={styles.timelineWrapper}>
      <View style={styles.timelineLabels}>
        {([
          { id: 'SCR', Icon: FileText,      label: 'SCRIPT', active: displayStep >= 1 },
          { id: 'AST', Icon: Globe,         label: 'ASSET',  active: displayStep >= 3 },
          { id: 'ANM', Icon: Wand2,         label: 'ANIM',   active: displayStep >= 5 },
          { id: 'RND', Icon: Clapperboard,  label: 'RENDER', active: displayStep >= 7 },
          { id: 'FIN', Icon: Music,         label: 'FINISH', active: displayStep >= 9 },
        ] as const).map(({ id, Icon, label, active }) => (
          <View key={id} style={[styles.trackLabel, active && styles.activeTrackLabel]}>
            <Icon size={12} color={active ? '#FDF6EE' : 'rgba(255,255,255,0.4)'} />
            <Text style={[styles.trackText, active && { color: '#FDF6EE' }]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineCanvas}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleTimelinePress}
          style={{ width: 1200, height: '100%', paddingVertical: 10 }}
        >
          <TimelineGrid />
          
          <View style={[styles.playhead, { left: `${playbackProgress}%` }]}>
            <View style={styles.playheadDiamond} />
          </View>

          {/* ── SCRIPT TRACK ── */}
          <View style={styles.trackRow}>
            {displayStep === 1 || displayStep === 2 ? (
              <Animated.View style={[styles.loadingClip, { opacity: pulseAnim, width: 300, backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={styles.loadingClipText}>ANALYZING NARRATIVE...</Text>
              </Animated.View>
            ) : displayStep > 2 ? (
              <View style={[styles.clipNode, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', width: 400 }]}>
                <Text style={styles.clipText}>Screenplay: {activeBook?.title || 'Area X'}</Text>
              </View>
            ) : null}
          </View>

          {/* ── WORLD TRACK ── */}
          <View style={styles.trackRow}>
            {displayStep === 3 || displayStep === 4 ? (
              <Animated.View style={[styles.loadingClip, { opacity: pulseAnim, width: 400, marginLeft: 50, backgroundColor: 'rgba(38, 97, 156, 0.15)' }]}>
                <Text style={[styles.loadingClipText, { color: '#FDF6EE' }]}>ANCHORING SPATIAL PLANES...</Text>
              </Animated.View>
            ) : displayStep > 4 ? (
              <View style={[styles.clipNode, { backgroundColor: 'rgba(38, 97, 156, 0.1)', borderColor: '#26619C', width: 450, marginLeft: 50 }]}>
                <Text style={[styles.clipText, { color: '#FDF6EE' }]}>Environment: {activeBook?.genre || 'Cinematic'}</Text>
              </View>
            ) : null}
          </View>

          {/* ── KEYS TRACK ── */}
          <View style={styles.trackRow}>
            {displayStep === 5 || displayStep === 6 ? (
              <Animated.View style={[styles.loadingClip, { opacity: pulseAnim, width: 350, marginLeft: 150, backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                <Text style={[styles.loadingClipText, { color: '#FDF6EE' }]}>SYNTHESIZING ASSETS...</Text>
              </Animated.View>
            ) : displayStep > 6 ? (
              <View style={[styles.clipNode, { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: '#D4AF37', width: 380, marginLeft: 150 }]}>
                <Text style={[styles.clipText, { color: '#FDF6EE' }]}>Tech: {activeBook?.productionStyle || 'Luminous'}</Text>
              </View>
            ) : null}
          </View>

          {/* ── VIDEO TRACK ── */}
          <View style={styles.trackRow}>
            {shots.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: 4, paddingLeft: 100 }}>
                {shots.map((shot: any, idx: number) => (
                  <TouchableOpacity 
                    key={idx} 
                    onPress={() => onSelectShot?.(shot._id)}
                    activeOpacity={0.7}
                    style={[
                      styles.clipNode, 
                      { 
                        backgroundColor: shot.status === 'complete' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(230, 230, 250, 0.05)', 
                        borderColor: selectedShotId === shot._id ? '#3F00FF' : (shot.status === 'complete' ? '#D4AF37' : '#E6E6FA'), 
                        borderWidth: selectedShotId === shot._id ? 2 : 1,
                        width: 150,
                        borderStyle: shot.status === 'complete' ? 'solid' : 'dashed',
                      }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={[styles.clipText, { fontSize: 8, color: '#FDF6EE' }]}>
                        SHOT_{shot.shotNumber}
                      </Text>
                      {shot.status === 'complete' && (
                        <View style={styles.masteredIndicator} />
                      )}
                    </View>
                    <Text style={[styles.clipText, { fontSize: 6, opacity: 0.6, color: '#FDF6EE' }]}>
                      {shot.status === 'complete' ? 'PRESTIGE MASTER' : 'SYNTHESIZING...'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : displayStep >= 7 && displayStep <= 8 ? (
              <Animated.View style={[styles.loadingClip, { opacity: pulseAnim, width: 600, marginLeft: 100, backgroundColor: 'rgba(107,114,128,0.15)' }]}>
                <Text style={[styles.loadingClipText, { color: '#9CA3AF' }]}>RENDERING PHOTONS...</Text>
              </Animated.View>
            ) : displayStep > 8 ? (
              <View style={[styles.clipNode, { backgroundColor: 'rgba(107,114,128,0.1)', borderColor: '#6B7280', width: 800, marginLeft: 100 }]}>
                <Text style={[styles.clipText, { color: '#D1D5DB' }]}>RENDER_MASTER_V1.mp4</Text>
              </View>
            ) : null}
          </View>

          {/* ── AUDIO TRACK ── */}
          <View style={styles.trackRow}>
            {displayStep === 9 ? (
              <Animated.View style={[styles.loadingClip, { opacity: pulseAnim, width: 1000, backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                <Text style={[styles.loadingClipText, { color: '#A78BFA' }]}>FINISHING IN COMPRO-NUKE...</Text>
              </Animated.View>
            ) : displayStep === 10 ? (
              <View style={[styles.clipNode, { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: '#8B5CF6', width: 1100 }]}>
                <Text style={[styles.clipText, { color: '#FDF6EE' }]}>MASTER_DELIVERY_V1.mov</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
  },
  timelineLabels: {
    width: 60,
    backgroundColor: '#2C2C2E',
    borderRightWidth: 1,
    borderColor: '#48484A',
  },
  trackLabel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    opacity: 0.3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  activeTrackLabel: {
    opacity: 1,
    backgroundColor: 'rgba(38, 97, 156, 0.1)', // 💎 Lapis Blue Glass Tint
  },
  trackText: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  timelineCanvas: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#3F00FF', // 💎 Ultramarine Playhead
    zIndex: 20,
    shadowColor: '#3F00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  playheadDiamond: {
    width: 12,
    height: 12,
    backgroundColor: '#3F00FF', // 💎 Ultramarine Playhead
    transform: [{ rotate: '45deg' }],
    marginLeft: -5,
    marginTop: -4,
  },
  trackRow: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#2C2C2E',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  clipNode: {
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#3A3A3E',
    borderColor: '#48484A',
  },
  clipText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  loadingClip: {
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  loadingClipText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FDF6EE', // 🏛️ Marble White
    letterSpacing: 1,
  },
  masteredIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37', // 🍾 Champagne Gold
    shadowColor: '#D4AF37',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
});
