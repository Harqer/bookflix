import React, { useRef, useCallback } from 'react';
import { Animated, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import { useAudioDirector } from '@/hooks/use-audio-director';

interface PressableCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  /** 
   * 🧠 Neuromarketing preset:
   * 'card'    — gentle scale (0.96) for browse cards (low commitment feel)
   * 'cta'     — deep scale (0.92) for CTAs (high commitment, weighty)
   * 'poster'  — asymmetric spring with rotation drift (cinematic, alive)
   */
  variant?: 'card' | 'cta' | 'poster';
  playSound?: boolean;
}

/**
 * 🧠 GLOW PRESSABLE CARD — Neuromarketing Spring Engine
 *
 * Why spring physics?
 * ───────────────────────────────────────────────────────────────────────
 * Linear animations feel mechanical and lifeless.
 * Spring physics mimic real-world object behavior — the brain is wired
 * to find organic motion MORE engaging and trustworthy.
 *
 * The slight overshoot on release (bounciness) triggers a micro-dopamine
 * response because the brain "predicts" the settle position and gets a
 * small reward when the animation resolves correctly.
 * ───────────────────────────────────────────────────────────────────────
 */
export function PressableCard({
  children,
  style,
  onPress,
  variant = 'card',
  playSound = true,
}: PressableCardProps) {
  const { playTap, playCardHover } = useAudioDirector();
  const scale    = useRef(new Animated.Value(1)).current;
  const rotate   = useRef(new Animated.Value(0)).current;
  const shadowOp = useRef(new Animated.Value(0.15)).current;

  const configs = {
    card:   { pressTo: 0.96, bounciness: 10, speed: 40 },
    cta:    { pressTo: 0.92, bounciness: 6,  speed: 50 },
    poster: { pressTo: 0.94, bounciness: 14, speed: 35 },
  };

  const { pressTo, bounciness, speed } = configs[variant];

  const handlePressIn = useCallback(() => {
    if (playSound) playTap();

    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressTo,
        useNativeDriver: true,
        bounciness: 0,
        speed: 60,
      }),
      // Poster variant: slight tilt on press (feels "picked up")
      variant === 'poster'
        ? Animated.spring(rotate, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 0,
            speed: 60,
          })
        : Animated.timing(rotate, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.timing(shadowOp, {
        toValue: 0.4,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [playSound, playTap, scale, rotate, shadowOp, pressTo, variant]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      // Spring rebound — slight overshoot = satisfying release
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness,
        speed,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: bounciness * 1.5,
        speed,
      }),
      Animated.timing(shadowOp, {
        toValue: 0.15,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, rotate, shadowOp, bounciness, speed]);

  const rotateInterpolated = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', variant === 'poster' ? '-1.5deg' : '0deg'],
  });

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }, { rotate: rotateInterpolated }],
            shadowColor: '#E50914',
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 20,
            shadowOpacity: shadowOp as any,
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
