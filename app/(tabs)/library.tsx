import React, { useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, Image, TouchableOpacity, 
  ActivityIndicator, useWindowDimensions, ImageBackground,
  StyleSheet, Animated, Easing
} from 'react-native';
import { Play, Info, ChevronRight, PlayCircle, Sparkles } from 'lucide-react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableCard } from '@/components/pressable-card';
import { useAudioDirector } from '@/hooks/use-audio-director';
import { BlurView } from 'expo-blur';

// ─── 🏛️ 2026 CINEMA DESIGN SYSTEM ──────────────────────────────────────────
const C = {
  primary:      '#D4AF37',           // 🍾 Champagne Gold (Prestige)
  accent:       '#FFD700',           // ⚡ Electric Amber
  bg:           '#08091A',           // 🌑 Deep Indigo Obsidian
  surface:      'rgba(28, 20, 32, 0.75)', // Liquid Glass Deep Indigo
  border:       'rgba(212, 175, 55, 0.15)', // Gold Tinted Border
  textPrimary:  '#FFFFFF',
  textMuted:    '#7070A0',
  secondary:    '#F7E7CE',           // Champagne Gold Tint
  leakColor1:   '#0B0F2D',           // Deep Ultramarine leak
  leakColor2:   '#2D230B',           // Golden Amber leak
};

// ─── Component: Ambient Light Leaks ───────────────────────────────────────
const LightLeaks = () => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (val: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };
    animate(anim1, 10000);
    animate(anim2, 15000);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.leak, { 
        backgroundColor: C.leakColor1, 
        top: '20%', left: -200, 
        opacity: anim1.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.2] }),
        transform: [{ scale: anim1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }]
      }]} />
      <Animated.View style={[styles.leak, { 
        backgroundColor: C.leakColor2, 
        bottom: '10%', right: -200, 
        opacity: anim2.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.15] }),
        transform: [{ scale: anim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }]
      }]} />
    </View>
  );
};

export default function LibraryScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { playScrollTick, playPremiere, playTap } = useAudioDirector();
  const allBooks = useQuery(api.studio.listBooks);
  const books = allBooks?.filter(b => b.status === 'completed') || [];

  const isTablet = width > 768;
  const padding = isTablet ? 48 : 24;

  if (allBooks === undefined) {
    return (
      <View style={{ backgroundColor: C.bg }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const featured = books[0];

  return (
    <View style={{ backgroundColor: C.bg, flex: 1 }}>
      <LightLeaks />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* 🎬 CINEMATIC HERO SECTION */}
        <View style={[styles.heroContainer, { paddingTop: insets.top }]}>
          <ImageBackground 
            source={{ uri: featured?.coverImageUrl || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071' }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          >
            <LinearGradient 
              colors={['rgba(8,4,5,0.3)', 'rgba(8,4,5,0.6)', C.bg]} 
              style={StyleSheet.absoluteFill} 
            />
          </ImageBackground>

          <View style={{ paddingHorizontal: padding, paddingBottom: 40, paddingTop: 60 }}>
            <BlurView intensity={10} tint="light" style={styles.badge}>
              <Text style={styles.badgeText}>TRENDING PRODUCTION</Text>
            </BlurView>
            
            <Text style={styles.heroTitle} numberOfLines={2}>
              {featured?.title || 'Studio Premiere'}
            </Text>
            <Text style={styles.heroSummary} numberOfLines={2}>
              {featured?.summary || 'The visual masterpiece of the decade. Orchestrated by AI, refined by Glow.'}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <PressableCard
                variant="cta"
                onPress={() => { playPremiere(); featured && router.push(`/book/${featured._id}`); }}
                style={styles.watchButton}
              >
                <LinearGradient
                  colors={['#3F00FF', '#120A8F']} // 💎 Ultramarine Gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Play color="white" size={18} fill="white" />
                <Text style={styles.watchText}>WATCH NOW</Text>
              </PressableCard>
              <TouchableOpacity style={styles.detailsButton}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <Info color="#D4AF37" size={18} />
                <Text style={styles.detailsText}>DETAILS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 🎞️ CAROUSEL SECTIONS */}
        <View style={{ paddingHorizontal: padding, marginTop: -20, paddingBottom: 100 }}>
          
          {/* YOUR CREATIONS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Creations</Text>
            <TouchableOpacity style={styles.viewAll}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
              <ChevronRight color={C.primary} size={14} />
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={() => playScrollTick()}
            scrollEventThrottle={120}
            contentContainerStyle={{ gap: 20 }}
          >
            {books.length > 0 ? books.map((book) => (
              <PressableCard
                key={book._id}
                variant="card"
                onPress={() => router.push(`/book/${book._id}`)}
                style={styles.creationCard}
              >
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: book.coverImageUrl || "" }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.cardPlayOverlay}>
                    <PlayCircle color="white" size={40} opacity={0.6} />
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: '65%' }]} />
                  </View>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={styles.cardMetadata}>EDITED 2H AGO • SYNCED</Text>
                </View>
              </PressableCard>
            )) : (
              <View style={styles.emptyState}>
                <Sparkles color="rgba(255,255,255,0.05)" size={48} />
                <Text style={styles.emptyText}>NO PRODUCTIONS FOUND</Text>
              </View>
            )}
          </ScrollView>

          {/* EPISODIC */}
          <View style={[styles.sectionHeader, { marginTop: 48 }]}>
            <Text style={styles.sectionTitle}>Episodic</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {books.slice(0, 6).map((book) => (
              <PressableCard
                key={`${book._id}-poster`}
                variant="poster"
                onPress={() => router.push(`/book/${book._id}`)}
                style={styles.posterCard}
              >
                <ImageBackground source={{ uri: book.coverImageUrl || "" }} style={StyleSheet.absoluteFill} resizeMode="cover">
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.topBadge}>
                    <Text style={styles.topBadgeText}>TOP 10</Text>
                  </View>
                  <View style={{ flex: 1, justifyContent: 'flex-end', padding: 12 }}>
                    <Text style={styles.posterTitle} numberOfLines={1}>{book.title}</Text>
                    <Text style={styles.posterMeta}>8 EPISODES</Text>
                  </View>
                </ImageBackground>
              </PressableCard>
            ))}
          </ScrollView>

          {/* FULL LENGTH */}
          <View style={[styles.sectionHeader, { marginTop: 48 }]}>
            <Text style={styles.sectionTitle}>Full Length</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 24 }}>
            {books.slice(0, 4).map((book) => (
              <PressableCard
                key={`${book._id}-movie`}
                variant="card"
                onPress={() => router.push(`/book/${book._id}`)}
                style={styles.wideCard}
              >
                <View style={styles.wideImageContainer}>
                  <Image source={{ uri: book.coverImageUrl || "" }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <View style={styles.masterBadge}>
                    <Text style={styles.masterText}>4K MASTER</Text>
                  </View>
                </View>
                <View style={styles.wideInfo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.wideTitle} numberOfLines={1}>{book.title}</Text>
                    <Text style={styles.wideMeta}>ACTION • 1H 42M</Text>
                  </View>
                  <View style={styles.imaxBadge}>
                    <Text style={styles.imaxText}>IMAX</Text>
                  </View>
                </View>
              </PressableCard>
            ))}
          </ScrollView>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  leak: {
    position: 'absolute',
    width: 700,
    height: 700,
    borderRadius: 350,
    filter: 'blur(120px)',
  },
  heroContainer: {
    width: '100%',
    aspectRatio: 21/11,
    minHeight: 400,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    color: '#FDF6EE', // 🏛️ Marble White
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: 'white',
    fontSize: 48,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -2,
    lineHeight: 48,
    marginBottom: 8,
  },
  heroSummary: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 32,
    maxWidth: '90%',
  },
  watchButton: {
    backgroundColor: '#3F00FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3F00FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  watchText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(212,175,55,0.05)', // 🍾 Champagne Glass
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#D4AF37', // 🍾 Champagne Gold Filigree
    overflow: 'hidden',
  },
  detailsText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  creationCard: {
    width: 280,
  },
  cardImageContainer: {
    aspectRatio: 16/9,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E6E6FA', // 🌸 Lavender Flow for in-progress
  },
  cardInfo: {
    marginTop: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  cardMetadata: {
    color: C.textMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  emptyState: {
    height: 150,
    width: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 12,
  },
  posterCard: {
    width: 150,
    aspectRatio: 2/3,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: C.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  topBadgeText: {
    color: 'white',
    fontSize: 7,
    fontWeight: '900',
  },
  posterTitle: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  posterMeta: {
    color: C.primary,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  wideCard: {
    width: 340,
  },
  wideImageContainer: {
    aspectRatio: 16/9,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  masterBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  masterText: {
    color: 'white',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  wideInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  wideTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  wideMeta: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  imaxBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  imaxText: {
    color: C.primary,
    fontSize: 8,
    fontWeight: '900',
  },
});
