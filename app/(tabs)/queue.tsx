import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, Dimensions, StyleSheet } from 'react-native';
import { Activity, Clock, RefreshCcw, Search as IconSearch, Film, Trash2 } from 'lucide-react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 🏛️ DIRECTOR QUEUE CONSTANTS
const DR_BACKGROUND = '#08091A'; // 🌑 Deep Indigo Obsidian
const DR_ACCENT = '#AFDBF5'; // 🧊 Pale Blue (Tranquility)
const DR_LAVENDER = '#E6E6FA'; // 🌸 Lavender (Spiritual Calm)
const DR_GOLD = '#D4AF37'; // 🍾 Champagne Gold (Treasure)
const DR_SURFACE = 'rgba(255,255,255,0.02)';

export default function QueueScreen() {
  const router = useRouter();
  const { user } = useUser();
  const books = useQuery(api.studio.listBooks);
  const discardProduction = useMutation(api.studio.discardProduction);
  
  const inProduction = books?.filter(b => 
    b.status !== 'completed' && 
    b.status !== 'failed' && 
    b.status !== 'pending' &&
    b.status !== 'analyzing_failed'
  ) || [];
  const finished = books?.filter(b => b.status === 'completed') || [];

  if (books === undefined) {
    return (
      <View style={{ backgroundColor: DR_BACKGROUND, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={DR_ACCENT} />
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: DR_BACKGROUND, flex: 1 }}>
      {/* 🏛️ DIRECTOR TOP APP BAR */}
      <View style={styles.header}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <View style={styles.userProfile}>
            <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
            <View>
              <Text style={styles.headerTitle}>DIRECTOR QUEUE</Text>
              <Text style={styles.headerSub}>SOVEREIGN FLEET STATUS</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <IconSearch color="white" size={20} opacity={0.6} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 120, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          
          {/* ACTIVE RENDER JOBS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE RENDERS</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{inProduction.length} RUNNING</Text>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            {inProduction.map((book) => {
              // 🏛️ REAL PRODUCTION LOGIC
              const progress = book.progress || 10; // Start at 10% for baseline
              const isStalled = Date.now() - (book.lastUpdate || book.createdAt) > 1000 * 60 * 30; // 30 mins
              const etaMins = Math.ceil((100 - progress) * 0.5); // Estimate 30s per 1%
              const etaStr = isStalled ? "STALLED" : `${etaMins}:00 REMAINING`;

              return (
                <TouchableOpacity 
                  key={book._id}
                  onPress={() => router.push(`/create?bookId=${book._id}`)}
                  style={[styles.jobCard, isStalled && { borderColor: 'rgba(239,68,68,0.2)' }]}
                >
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                  <View style={styles.jobInfo}>
                    <View style={styles.jobHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                        <Text style={styles.episodeTag}>{isStalled ? 'FLEET TIMEOUT' : 'EPISODE 1: GENESIS'}</Text>
                      </View>
                      <View style={[styles.renderingBadge, isStalled && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                        <Activity color={isStalled ? '#EF4444' : DR_ACCENT} size={12} />
                        <Text style={[styles.renderingText, isStalled && { color: '#EF4444' }]}>
                          {isStalled ? 'STALLED' : 'RENDERING'}
                        </Text>
                      </View>
                      
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          discardProduction({ bookId: book._id });
                        }}
                        style={styles.discardButton}
                      >
                        <Trash2 color="#EF4444" size={14} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>COMPLETION ESTIMATE</Text>
                        <Text style={styles.etaText}>{etaStr} REMAINING</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                      </View>
                      <View style={styles.progressFooter}>
                        <Text style={styles.progressPercent}>{progress}% COMPLETE</Text>
                        <Text style={styles.frameText}>H200 CLUSTER ACTIVE</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {inProduction.length === 0 && (
              <View style={styles.emptyState}>
                <RefreshCcw color={DR_LAVENDER} size={48} opacity={0.2} />
                <Text style={styles.emptyText}>FLEET STANDBY: NO ACTIVE RENDERS</Text>
              </View>
            )}
          </View>

          {/* COMPLETED RENDERS */}
          <View style={[styles.sectionHeader, { marginTop: 40 }]}>
            <Text style={styles.sectionTitle}>MASTERED ARCHIVE</Text>
          </View>

          <View style={{ gap: 12 }}>
            {finished.slice(0, 5).map((book) => (
              <TouchableOpacity 
                key={book._id}
                onPress={() => router.push(`/library`)}
                style={styles.archiveCard}
              >
                <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                <Film color="rgba(255,255,255,0.2)" size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.archiveTitle}>{book.title}</Text>
                  <Text style={styles.archiveSub}>EPISODE 1 COMPLETED</Text>
                </View>
                <Text style={styles.archiveDate}>24 BIT MASTER</Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 100,
    zIndex: 100,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DR_ACCENT,
  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSub: {
    color: '#FDF6EE', // 🏛️ Marble White
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.7,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },
  countBadge: {
    backgroundColor: 'rgba(175,219,245,0.15)', // 🧊 Pale Blue Glow
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  countText: {
    color: '#FDF6EE', // 🏛️ Marble White
    fontSize: 8,
    fontWeight: '900',
  },
  jobCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  jobInfo: {
    padding: 20,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bookTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  episodeTag: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  renderingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(230,230,250,0.15)', // 🌸 Lavender Glow
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  renderingText: {
    color: '#FDF6EE', // 🏛️ Marble White
    fontSize: 9,
    fontWeight: '900',
  },
  discardButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  progressSection: {
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '800',
  },
  etaText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: DR_LAVENDER, // 🌸 Lavender Flow
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPercent: {
    color: '#FDF6EE', // 🏛️ Marble White
    fontSize: 10,
    fontWeight: '900',
    opacity: 0.9,
  },
  frameText: {
    color: 'rgba(175,219,245,0.4)', // 🧊 Pale Blue Muted
    fontSize: 8,
    fontWeight: '700',
  },
  archiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.03)', // 🍾 Gold Treasure Tint
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.1)',
    overflow: 'hidden',
  },
  archiveTitle: {
    color: DR_GOLD, // 🍾 Champagne Gold
    fontSize: 14,
    fontWeight: '700',
  },
  archiveSub: {
    color: 'rgba(212,175,55,0.4)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  archiveDate: {
    color: 'rgba(212,175,55,0.3)',
    fontSize: 8,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
