import { View } from "react-native";
import Animated, { Layout } from "react-native-reanimated";

export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isPast = i < current;
        
        return (
          <Animated.View 
            key={i} 
            layout={Layout.springify()} // 🏛️ Modern Reanimated Syntax
            style={{
              width: isActive ? 32 : 12,
              height: 6,
              borderRadius: 3,
              backgroundColor: isActive 
                ? "#FF8A00" // ⚡ Electric Orange (Active)
                : isPast 
                  ? "rgba(38, 97, 156, 0.4)" // 💎 Lapis (Past)
                  : "rgba(255, 255, 255, 0.1)", // 🏛️ Ghost (Future)
            }}
          />
        );
      })}
    </View>
  );
}
