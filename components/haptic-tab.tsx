import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { Platform, Animated } from "react-native";
import { useRef } from "react";
import { useAudioDirector } from "@/hooks/use-audio-director";

let Haptics: { impactAsync: (style: any) => void; ImpactFeedbackStyle: { Light: any; Medium: any } };
try {
  Haptics = require("expo-haptics");
} catch {
  Haptics = { impactAsync: () => {}, ImpactFeedbackStyle: { Light: "light", Medium: "medium" } };
}

/**
 * 🧠 NEUROMARKETING HAPTIC TAB
 * 
 * Spring-press animation + layered haptic:
 * - Press IN:  scale 0.88 (feels physically "depressed")
 * - Press OUT: spring overshoot to 1.06 → settle at 1.0
 *              mimics a physical button release = satisfying rebound
 * - Active tab: heavier haptic (sense of "locking in")
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  const { playTap } = useAudioDirector();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (ev: any) => {
    // Physical "press down" feel
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playTap();
    props.onPressIn?.(ev);
  };

  const handlePressOut = (ev: any) => {
    // Satisfying spring rebound — slight overshoot = physical button release
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 14, // Overshoot = tactile rebound sensation
    }).start();
    props.onPressOut?.(ev);
  };

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <PlatformPressable
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[{ flex: 1 }, props.style as any]}
      />
    </Animated.View>
  );
}
