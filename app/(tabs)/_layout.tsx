import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import { Clapperboard, Compass, PlusCircle, Layers, Library } from "lucide-react-native";
import { HapticTab } from "@/components/haptic-tab";
import { useAudioDirector } from "@/hooks/use-audio-director";

// 🏛️ MAGICAL STUDIO NAV CONSTANTS
const GLOW_ACCENT = '#FFD700'; // ⚡ Pure Gold
const GLOW_BG_LOWEST = 'rgba(8, 8, 8, 0.98)'; // 🌑 Obsidian Night

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { playSwell } = useAudioDirector();
  const bottomPadding = Platform.OS === "web" ? 16 : Math.max(insets.bottom, 12);
  const tabBarHeight = 72 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: GLOW_ACCENT,
        tabBarInactiveTintColor: "rgba(255, 215, 0, 0.3)",
        headerShown: false,
        tabBarButton: (props) => (
          <HapticTab 
            {...props} 
            onPress={(e) => {
              playSwell();
              props.onPress?.(e);
            }}
          />
        ),
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: GLOW_BG_LOWEST,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              overflow: 'hidden',
            }}
          >
            <BlurView intensity={100} tint="dark" style={{ flex: 1 }} />
          </View>
        ),
        tabBarStyle: {
          paddingTop: 12,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          position: 'absolute',
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        // 🎬 Cinematic slide-from-left tab transition
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Studio",
          tabBarIcon: ({ color, focused }) => <Clapperboard size={24} color={color} fill={focused ? color : 'transparent'} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => <Compass size={24} color={color} fill={focused ? color : 'transparent'} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => (
            <PlusCircle size={28} color="#FDF6EE" fill={focused ? "rgba(253, 246, 238, 0.2)" : "transparent"} strokeWidth={1.5} />
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "900",
            color: "#FDF6EE",
            marginTop: 2,
          }
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: "Queue",
          tabBarIcon: ({ color, focused }) => <Layers size={24} color={color} fill={focused ? color : 'transparent'} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, focused }) => <Library size={24} color={color} fill={focused ? color : 'transparent'} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
