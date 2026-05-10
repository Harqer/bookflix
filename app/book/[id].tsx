import React, { useState } from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Play, Pause, Download, Share2, Settings, Maximize2, RotateCcw, RotateCw, Volume2, ClosedCaption } from 'lucide-react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 🏛️ GLOW STUDIO PLAYER CONSTANTS
const FS_BACKGROUND = '#0B0C10';
const FS_ACCENT = '#E50914';

export default function PlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useQuery(api.studio.getBook, { id: id as Id<"books"> });
  const [isPlaying, setIsPlaying] = useState(true);

  if (book === undefined) {
    return (
      <View style={{ backgroundColor: FS_BACKGROUND }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={FS_ACCENT} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={{ backgroundColor: FS_BACKGROUND }} className="flex-1 items-center justify-center px-8">
        <Text className="text-white text-2xl font-black mb-4 uppercase font-['Space_Grotesk']">SCENE NOT FOUND</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: FS_ACCENT }} className="font-bold tracking-[0.2em] uppercase text-xs">Back to Studio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: FS_BACKGROUND }} className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* 🎬 MAIN CINEMATIC PLAYER CANVAS */}
        <View style={{ height: SCREEN_HEIGHT }} className="w-full relative bg-black justify-center items-center">
          
          {/* Background Video Placeholder */}
          <Image 
            source={{ uri: book.coverImageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCZeFyWkjD-Nsq_-BTCY7-jwOgYkEYFpMH4_9EZFFL0GlskOddLz1TT7r_wax8jmWihYQnhjXJC_6nqj_L7eAT7vwpVbY8069XlFDRSmlIFynqsfHgMJauyb4DzYUlwzzpLTjYL89DJf1fJ-pbtz09GIPI4kK5bhIBAj45vhB6RU3z8wHAjKISLW8mLYEp4_kg8871cMCOUjZXd0PbJPPbsG4FoD74mm9Zl-bJWkT2LLcpbMicN5XvWjBMLqTf4P9SbVPsVYui35IFR" }} 
            className="absolute inset-0 w-full h-full opacity-80"
            resizeMode="cover"
          />

          {/* Overlays for Legibility (Vignettes) */}
          <LinearGradient 
            colors={['rgba(11, 12, 16, 0.9)', 'rgba(11, 12, 16, 0.4)', 'transparent']} 
            className="absolute top-0 left-0 right-0 h-1/2 z-10" 
          />
          <LinearGradient 
            colors={['transparent', 'rgba(11, 12, 16, 0.5)', 'rgba(11, 12, 16, 0.95)']} 
            className="absolute bottom-0 left-0 right-0 h-1/2 z-10" 
          />

          {/* 🏛️ PLAYER CONTENT HUD */}
          <View className="absolute inset-0 z-20 flex-col justify-between px-8 py-16">
            
            {/* Top Controls Area */}
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-6">
                <TouchableOpacity 
                  onPress={() => router.back()}
                  className="w-12 h-12 rounded-full items-center justify-center bg-white/10 border border-white/5 backdrop-blur-3xl"
                >
                  <ArrowLeft color="white" size={20} />
                </TouchableOpacity>
                <View>
                  <Text className="text-white text-2xl font-black tracking-tight uppercase font-['Space_Grotesk']">{book.title}</Text>
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">S1 : E04 • Discovery</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity className="w-12 h-12 rounded-full items-center justify-center bg-white/10 border border-white/5 backdrop-blur-3xl">
                  <Share2 color="white" size={20} />
                </TouchableOpacity>
                <TouchableOpacity className="w-12 h-12 rounded-full items-center justify-center bg-white/10 border border-white/5 backdrop-blur-3xl">
                  <Download color="white" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Weighted Play/Pause Action */}
            <View className="items-center justify-center">
              <View className="relative">
                {/* Glow Bloom Effect */}
                <View style={{ backgroundColor: FS_ACCENT }} className="absolute inset-0 blur-3xl opacity-20 scale-150 rounded-full" />
                <TouchableOpacity 
                  onPress={() => setIsPlaying(!isPlaying)}
                  style={{ backgroundColor: FS_ACCENT }}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full items-center justify-center shadow-2xl shadow-red-900/60 transition-transform active:scale-95"
                >
                  {isPlaying ? (
                    <Pause color="white" size={40} fill="white" />
                  ) : (
                    <Play color="white" size={40} fill="white" style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Player HUD */}
            <View className="w-full">
              {/* Progress Bar System */}
              <View className="mb-6">
                <View className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                  {/* Current Playback */}
                  <View style={{ width: '42%', backgroundColor: FS_ACCENT }} className="h-full absolute left-0" />
                  {/* Seek Thumb */}
                  <View style={{ left: '42%' }} className="absolute -top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-red-600 shadow-xl" />
                </View>
                <View className="flex-row justify-between items-center mt-3">
                  <Text className="text-white/40 text-[10px] font-black tracking-widest">24:18</Text>
                  <Text className="text-white/40 text-[10px] font-black tracking-widest">58:00</Text>
                </View>
              </View>

              {/* Secondary Control Row */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-8">
                  <TouchableOpacity><RotateCcw color="white" size={24} /></TouchableOpacity>
                  <TouchableOpacity><RotateCw color="white" size={24} /></TouchableOpacity>
                  <View className="flex-row items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-2xl">
                    <Volume2 color="white" size={16} />
                    <View className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                      <View style={{ width: '66%', backgroundColor: FS_ACCENT }} className="h-full" />
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center gap-6">
                  <TouchableOpacity className="flex-row items-center gap-2">
                    <ClosedCaption color="white" size={18} opacity={0.6} />
                    <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Subtitles</Text>
                  </TouchableOpacity>
                  <TouchableOpacity><Settings color="white" size={20} opacity={0.6} /></TouchableOpacity>
                  <TouchableOpacity><Maximize2 color="white" size={20} /></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 🎞️ POST-PLAYER: RECOMMENDED NEXT (Bento Grid) */}
        <View style={{ backgroundColor: FS_BACKGROUND }} className="px-8 pt-16 pb-32">
          <View className="flex-row justify-between items-end mb-10 border-b border-white/5 pb-4">
            <Text className="text-white text-3xl font-black uppercase tracking-tighter">Recommended Next</Text>
            <TouchableOpacity><Text style={{ color: FS_ACCENT }} className="text-xs font-bold uppercase tracking-widest">View All Series</Text></TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-6">
            {/* Card 1 */}
            <TouchableOpacity className="w-full aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative group">
              <ImageBackground 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcluWOxTqB3o7lQl4G5Ou1uAKxobR8zae9JP7r71AZ0tBhG2c3Sh9jWMmF_Ds-RDey9KwKiIuC0gbirvOiAr8oikRzs0fz2IALcdzNSzDP5WEd-drH4gz-HWG_-5yAHwwYyNZFZNLZDaQ6xtrvFI81KaZhTXp0rcwpp-brFKKS9P68_mTzTBDTEbgB29GXE9Hk3nJZZBQEvWixDhTBUhTkSl8i7Im3JCAlTFZ-tIt5LHvZNFfK99Yvcc8NgvWCSkJt75_R5DwwFvlT' }}
                className="flex-1 opacity-80"
              >
                <LinearGradient colors={['transparent', 'rgba(11,12,16,0.95)']} className="absolute inset-0" />
                <View className="flex-1 justify-end p-8">
                  <Text style={{ color: FS_ACCENT }} className="text-[10px] font-black uppercase tracking-widest mb-1">Coming Up Next</Text>
                  <Text className="text-white text-2xl font-black uppercase tracking-tighter">The Origin of Silence</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            {/* Card 2 */}
            <TouchableOpacity className="flex-1 min-w-[45%] aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative">
              <ImageBackground 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnUah7L7iORROx0LJFZSMKah_MYjp4a460YQ9e0J4-tPGpN4OCtz4a1nw2rG2RAd5-DZxEpS6dFWeqqFg_0aFX3gc7gnNYYrOXBJFvX5qg6DZc4InQZGRIfHng1p9EH-iV7Vb9QJC-X9_fEsiUXIEJklX-yjArTS2FexLCwXDK8nSrZPChzDSpyzCnnoc31u2WO4dF7wOXRp7V7J-Pm7JcXbrs6nNe13EOne4INVJQNIr-QzkVL_K0PWO1gdjGtq4ZrARohXZJWjih' }}
                className="flex-1 opacity-60"
              >
                <LinearGradient colors={['transparent', 'rgba(11,12,16,0.95)']} className="absolute inset-0" />
                <View className="flex-1 justify-end p-6">
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Behind the Scenes</Text>
                  <Text className="text-white text-lg font-black uppercase tracking-tighter leading-tight">World Building 101</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            {/* Card 3 */}
            <TouchableOpacity className="flex-1 min-w-[45%] aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative">
              <ImageBackground 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc0xdvQN3KhWA88ur0xqD_B2ChjxnSyFZGJcVKtHrbTYDxzKquA_YcyYuSWHF3FpYEMJ4F-YvkFw9F5feg2J7XIVr2poj0R4g6yMxZgFGCvUnnOTtzWUelePiMhb4RhZAXprVImjx2VhOAN90P25W8pgJE9u_JCyq-rB6U_IZ6h5Jo49B5fYag74aVDkevAhEEH0PcGJ9Q4U43BY3bBT3bsRVD8cFhSga9M88tCHq1graBMzextwKDskaM5czhOmPCAom0-stqxINJ' }}
                className="flex-1 opacity-60"
              >
                <LinearGradient colors={['transparent', 'rgba(11,12,16,0.95)']} className="absolute inset-0" />
                <View className="flex-1 justify-end p-6">
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Episodes</Text>
                  <Text className="text-white text-lg font-black uppercase tracking-tighter leading-tight">S1 : E05 • The Signal</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
