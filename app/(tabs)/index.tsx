import React, { useRef, useEffect } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Dimensions, ScrollView, Image, useWindowDimensions, Animated, StyleSheet, Easing } from 'react-native';
import { MonitorPlay, Search as IconSearch } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PressableCard } from '@/components/pressable-card';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/expo';
import { useAudioDirector } from '@/hooks/use-audio-director';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── 🧙‍♂️ WIZARDING WORLD CINEMA DESIGN ──────────────────────────────────────────
const C = {
  primary:      '#6D0707',           // 🧙‍♂️ Deep Crimson (Gryffindor)
  accent:       '#FFD700',           // ⚡ Pure Gold
  bg:           '#080808',           // Obsidian Night
  surface:      'rgba(21, 15, 15, 0.85)', // Deep Burgundy Glass
  border:       'rgba(255, 215, 0, 0.12)', // Subtle Gold Filigree
  textPrimary:  '#E5E5E5',
  textMuted:    '#8A8A8A',           
  secondary:    '#C5A021',           // Aged Gold
  leakColor1:   '#4A0404',           // Crimson leak
  leakColor2:   '#2D230B',           // Amber leak
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
    animate(anim1, 8000);
    animate(anim2, 12000);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.leak, { 
        backgroundColor: C.leakColor1, 
        top: -100, left: -100, 
        opacity: anim1.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.25] }),
        transform: [{ scale: anim1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }]
      }]} />
      <Animated.View style={[styles.leak, { 
        backgroundColor: C.leakColor2, 
        bottom: -100, right: -100, 
        opacity: anim2.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.2] }),
        transform: [{ scale: anim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }]
      }]} />
    </View>
  );
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isTablet   = width > 768;
  const padding    = isTablet ? 48 : 24;
  const router     = useRouter();
  const { user }   = useUser();
  const { playTap, playSwell, playScrollTick, playPremiere } = useAudioDirector();

  const books      = useQuery(api.studio.listBooks) || [];
  const insets     = useSafeAreaInsets();

  const renderHero = () => (
    <View style={{ height: SCREEN_HEIGHT * 0.75, width: '100%', overflow: 'hidden' }}>
      <ImageBackground
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGUnFnYA3z328_DhfjxMVfd_iLoMGT-MzpSKIcyBKWNVKne1wAxfiHkAoq3jImoYkvvCzdFuSnFdxvyK_msii7Z8vfpwbISXZjXhoJd-knbzm54A0pItaYET89tOI96P9rwrB5Zn75OqSHYm9HQMMbXJws1WHOWpVB9tP4Ni86GVQjc9tMzc0PxmeuCjCP3-EpedkkaIej0lNY1ba128bx1vyWEjlw9ovf1e7WyAk4MIe6q6DWuO7fllDCBFpxRUT3Pa0-VPt_j57O' }}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(8,4,5,0.4)', C.bg]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Hero content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: isTablet ? 80 : 40, paddingBottom: 80 }}>
          <Text style={styles.heroTitle}>Glow</Text>

          <View style={{ paddingLeft: 48, marginTop: 20, marginBottom: 48 }}>
            <Text style={styles.heroSubtitle}>Your imagination in motion</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <PressableCard
              variant="cta"
              onPress={() => {
                playPremiere();
                router.push('/create');
              }}
              style={styles.ctaButton}
            >
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <MonitorPlay color="white" size={20} />
              <Text style={styles.ctaText}>Start Creating</Text>
            </PressableCard>
            <TouchableOpacity
              onPress={playTap}
              style={styles.secondaryButton}
            >
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.secondaryButtonText}>Watch Reel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View style={{ backgroundColor: C.bg, flex: 1 }}>
      <LightLeaks />

      {/* ── Top App Bar (Liquid Glass) ───────────────────────────────── */}
      <BlurView intensity={25} tint="dark" style={[styles.navbar, { paddingTop: insets.top }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: padding, height: 64 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={styles.userAvatar}>
              <Image source={{ uri: user?.imageUrl }} style={{ width: '100%', height: '100%' }} />
            </View>
            <Text style={styles.navLogo}>Glow</Text>
          </View>
          <TouchableOpacity onPress={playTap} style={styles.navIconButton}>
            <IconSearch color="white" size={22} opacity={0.8} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {renderHero()}

        {/* ── Trending Styles ────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: padding, marginTop: 48 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={styles.sectionTitle}>Trending Styles</Text>
            <Text style={styles.sectionSubtitle}>Selected directions by top creators</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={() => { playScrollTick(); }}
            scrollEventThrottle={120}
            style={{ shadowColor: "#26619C", shadowOpacity: 0.1, shadowRadius: 10 }}
          >
            {books.slice(0, 8).map((bookItem) => (
              <PressableCard
                key={bookItem._id}
                variant="poster"
                onPress={() => router.push(`/book/${bookItem._id}`)}
                style={styles.posterCard}
              >
                <ImageBackground source={{ uri: bookItem.coverImageUrl || '' }} style={{ flex: 1 }}>
                  <LinearGradient colors={['transparent', 'rgba(8,4,5,0.9)']} style={StyleSheet.absoluteFill} />
                  <View style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}>
                    <Text style={styles.posterTitle} numberOfLines={1}>{bookItem.title}</Text>
                    <Text style={styles.posterGenre}>{bookItem.genre || 'Epic Noir'}</Text>
                  </View>
                </ImageBackground>
              </PressableCard>
            ))}
          </ScrollView>
        </View>

        {/* ── Studio Highlights ─────────────────────────────────────── */}
        <View style={{ paddingHorizontal: padding, marginTop: 64, paddingBottom: 160 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 32 }]}>Studio Highlights</Text>
          {books[0] && (
            <PressableCard variant="card" style={styles.highlightCard}>
              <ImageBackground source={{ uri: books[0]?.coverImageUrl || '' }} style={{ flex: 1 }}>
                <LinearGradient 
                  colors={['rgba(8,4,5,0.9)', 'transparent']} 
                  start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} 
                  style={StyleSheet.absoluteFill} 
                />
                <View style={{ padding: 24, justifyContent: 'center', height: '100%', maxWidth: '70%' }}>
                  <Text style={styles.highlightLabel}>LATEST PRODUCTION</Text>
                  <Text style={styles.highlightTitle}>{books[0]?.title}</Text>
                  <Text style={styles.highlightText} numberOfLines={2}>
                    {books[0]?.summary || 'The visual masterpiece is currently being rendered in 8K.'}
                  </Text>
                </View>
              </ImageBackground>
            </PressableCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  leak: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    filter: 'blur(100px)',
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)', // Gold Filigree
  },
  navLogo: {
    color: C.accent,
    fontSize: 28,
    fontFamily: 'Cinzel Decorative',
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowRadius: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 84,
    color: '#FFD700',
    fontFamily: 'Cinzel Decorative',
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowRadius: 40,
  },
  heroSubtitle: {
    color: '#E5E5E5',
    fontSize: 14,
    fontFamily: 'Fraunces',
    fontStyle: 'italic',
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  ctaButton: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(109, 7, 7, 0.15)', // Crimson Glass
    borderWidth: 0.5,
    borderColor: '#FFD700', // Gold Filigree
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  ctaText: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 13,
    fontFamily: 'Cinzel Decorative',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  secondaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: C.accent,
    fontSize: 26,
    fontFamily: 'Cinzel Decorative',
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: 'rgba(229, 229, 229, 0.4)',
    fontSize: 11,
    fontFamily: 'Fraunces',
    fontStyle: 'italic',
    letterSpacing: 2,
    marginTop: 4,
  },
  posterCard: {
    marginRight: 20,
    width: 200,
    aspectRatio: 2/3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  posterTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Cinzel Decorative',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  posterGenre: {
    color: '#FFD700',
    fontSize: 9,
    fontFamily: 'Fraunces',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  highlightCard: {
    width: '100%',
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  highlightLabel: {
    color: '#FFD700',
    fontSize: 10,
    fontFamily: 'Cinzel Decorative',
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  highlightTitle: {
    color: 'white',
    fontSize: 28,
    fontFamily: 'Cinzel Decorative',
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  highlightText: {
    color: 'rgba(229, 229, 229, 0.6)',
    fontSize: 14,
    fontFamily: 'Fraunces',
    lineHeight: 20,
    fontWeight: '500',
  },
});
