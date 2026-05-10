import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { VideoView } from 'expo-video';
import { Clapperboard, SkipBack, Play, Pause, SkipForward, ZoomIn, Maximize2 } from 'lucide-react-native';

interface CinemaMonitorProps {
  activeScene: any;
  activeBook: any;
  player: any;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  formatTime: (seconds: number) => string;
  currentTime: number;
  totalDuration: number;
  isSubmitting: boolean;
  playTap: () => void;
}

export function CinemaMonitor({
  activeScene,
  activeBook,
  player,
  isPlaying,
  setIsPlaying,
  formatTime,
  currentTime,
  totalDuration,
  isSubmitting,
  playTap
}: CinemaMonitorProps) {
  return (
    <View style={styles.monitorSection}>
      <View style={styles.monitorContainer}>
        {activeScene?.videoUrl ? (
          <VideoView 
            player={player} 
            style={styles.monitorImage} 
            contentFit="cover"
            nativeControls={false}
          />
        ) : activeBook?.coverImageUrl ? (
          <Image source={{ uri: activeBook.coverImageUrl }} style={styles.monitorImage} resizeMode="cover" />
        ) : (
          <View style={styles.monitorPlaceholder}>
            <Clapperboard color="rgba(255,255,255,0.1)" size={48} strokeWidth={1} />
            <Text style={styles.monitorPlaceholderText}>Preview Window</Text>
            <Text style={styles.monitorPlaceholderSub}>
              {isSubmitting ? 'Generating cinematic assets...' : 'Add assets to timeline to see preview'}
            </Text>
          </View>
        )}
        <View style={styles.timecodeBadge}>
          <Text style={styles.timecodeText}>{formatTime(currentTime)} / {formatTime(totalDuration)}</Text>
        </View>
        
        {activeScene?.videoUrl && (
          <View style={styles.masteredBadge}>
            <View style={styles.masteredDot} />
            <Text style={styles.masteredBadgeText}>MASTERED</Text>
          </View>
        )}
      </View>

      <View style={styles.playbackWrapper}>
        <View style={styles.playbackHeader}>
          <Text style={styles.durationText}>{formatTime(currentTime)} / {formatTime(totalDuration)}</Text>
          <View style={styles.controlGroup}>
            <TouchableOpacity style={styles.miniButton}><ZoomIn color="white" size={12} /></TouchableOpacity>
            <TouchableOpacity style={styles.miniButton}><Maximize2 color="white" size={12} /></TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.transportButtons}>
          <TouchableOpacity><SkipBack color="rgba(255,255,255,0.4)" size={20} /></TouchableOpacity>
          <TouchableOpacity
            onPress={() => { playTap(); setIsPlaying(!isPlaying); }}
            style={styles.playButton}
          >
            {isPlaying ? <Pause color="white" size={20} fill="white" /> : <Play color="white" size={20} fill="white" />}
          </TouchableOpacity>
          <TouchableOpacity><SkipForward color="rgba(255,255,255,0.4)" size={20} /></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monitorSection: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 4,
  },
  monitorContainer: {
    width: 120,
    aspectRatio: 16/9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#2C2C2E', // 🌑 border-dark
  },
  monitorImage: {
    width: '100%',
    height: '100%',
  },
  monitorPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E', // 🌑 surface-dark
  },
  monitorPlaceholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
  },
  monitorPlaceholderSub: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 6,
    textAlign: 'center',
    marginTop: 2,
  },
  timecodeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  timecodeText: {
    color: 'white',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  playbackWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  playbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationText: {
    color: '#FDF6EE', // 🏛️ Marble White
    fontSize: 10,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  controlGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  miniButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  transportButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#26619C', // 💎 Lapis Blue
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#26619C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  masteredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.9)', // 🍾 Champagne Gold Glass
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  masteredDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FDF6EE', // 🏛️ Marble White
  },
  masteredBadgeText: {
    color: 'black',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
