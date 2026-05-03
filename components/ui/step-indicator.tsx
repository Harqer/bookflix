import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

export function StepIndicator({ current, total }: { current: number; total: number }) {
  const colors = useColors();
  
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isPast = i < current;
        
        return (
          <Animated.View 
            key={i} 
            layout={Animated.Layout.springify()}
            style={{
              width: isActive ? 32 : 12,
              height: 6,
              borderRadius: 3,
              backgroundColor: isActive ? colors.primary : isPast ? colors.primary + "66" : colors.border,
            }}
          />
        );
      })}
    </View>
  );
}
