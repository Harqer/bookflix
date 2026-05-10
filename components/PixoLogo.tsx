import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withDelay,
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function PixoLogo({ scale = 1 }: { scale?: number }) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      // 🧘 'Breathing' rhythm: 5 second cycle (approx 12 breaths per min) 
      withTiming(1.03, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const apertureStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: pulse.value }],
  }));

  return (
    <View style={{ transform: [{ scale }], flexDirection: 'row', alignItems: 'center' }}>
      
      {/* THE KINETIC APERTURE (Symbolizing the Alchemical Prism) */}
      <View className="relative w-16 h-16 items-center justify-center mr-4">
        
        {/* 🌈 Spectral Refraction Layer (The 'Prism' effect) */}
        <LinearGradient
          colors={['transparent', '#E50914', '#FFD700', 'transparent']}
          className="absolute w-24 h-24 opacity-20"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ transform: [{ rotate: '45deg' }] }}
        />
        
        {/* Rotating Blades */}
        <Animated.View style={[{ width: 48, height: 48 }, apertureStyle]}>
           {[0, 60, 120, 180, 240, 300].map((deg) => (
             <View 
               key={deg}
               className="absolute w-[1.5px] h-24 bg-[#FFD700]/10 rounded-full"
               style={{ 
                 left: 23, 
                 top: -24, 
                 transform: [{ rotate: `${deg}deg` }] 
               }} 
             />
           ))}
        </Animated.View>

        {/* The Negative Space 'P' Core (The 'Vision' seed) */}
        <View className="absolute w-8 h-8 bg-[#121212] rounded-full items-center justify-center border border-white/5 shadow-2xl">
           <View className="w-2 h-4 border-r-[2px] border-t-[2px] border-[#E50914] rounded-tr-md" style={{ transform: [{ translateX: 1.5 }] }} />
        </View>
      </View>

      {/* TYPOGRAPHY: 'PIXO' - With Subliminal Chromatic Aberration */}
      <View className="relative">
        {/* Red Offset (Subliminal) */}
        <Text style={{ 
          fontFamily: 'Unbounded, sans-serif', 
          fontSize: 30, 
          color: '#FF0000', 
          letterSpacing: 8,
          fontWeight: '100',
          position: 'absolute',
          left: -0.5,
          opacity: 0.15
        }}>
          PIXO
        </Text>
        {/* Blue Offset (Subliminal) */}
        <Text style={{ 
          fontFamily: 'Unbounded, sans-serif', 
          fontSize: 30, 
          color: '#0000FF', 
          letterSpacing: 8,
          fontWeight: '100',
          position: 'absolute',
          left: 0.5,
          opacity: 0.15
        }}>
          PIXO
        </Text>
        {/* Main White Layer */}
        <Text style={{ 
          fontFamily: 'Unbounded, sans-serif', 
          fontSize: 30, 
          color: '#FFFFFF', 
          letterSpacing: 8,
          fontWeight: '100',
          opacity: 0.85
        }}>
          PIXO
        </Text>
        <View className="h-[0.5px] w-full bg-white/20 mt-2" />
      </View>

    </View>
  );
}



