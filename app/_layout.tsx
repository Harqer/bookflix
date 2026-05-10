import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import {
  initManusRuntime,
  subscribeSafeAreaInsets,
} from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

import * as SecureStore from "expo-secure-store";
import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import * as Sentry from "@sentry/react-native";


const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL!;

const convex = new ConvexReactClient(CONVEX_URL);

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

import { useSyncUser } from "@/hooks/use-sync-user";

// 🛡️ Sentry Init + Identity Sync
// Sentry.init() is moved into useEffect because useEffect is GUARANTEED by React
// spec to never run during SSR — solving the "version is a required argument" crash
// caused by Sentry 8.x calling native modules unavailable in Node.js SSR context.
function SentryIdentitySync() {
  const { user } = useUser();
  useSyncUser(); // 🔄 Synchronous check & sync to Neon

  useEffect(() => {
    // Init Sentry on first client-side render (never runs in SSR)
    Sentry.init({
      dsn: "https://f91178c0ccc03bba73f7ca1a824ae463@o4511300849631232.ingest.us.sentry.io/4511300862345216",
      sendDefaultPii: true,
      enableLogs: true,
      tracesSampleRate: 1.0,
      _experiments: { aiMonitoring: true },
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.mobileReplayIntegration(),
        Sentry.feedbackIntegration(),
      ],
    });
  }, []); // empty deps = runs once after first client render

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        username: user.fullName || undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  return null;
}

// Sentry.wrap is a no-op in SSR to prevent environment-matching crashes
export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Convex handles its own caching and synchronization natively

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? {
      insets: initialInsets,
      frame: initialFrame,
    };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={CLERK_PUBLISHABLE_KEY}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SentryIdentitySync />
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0c1324' }}>
          <ThemeProvider initialMetrics={providerInitialMetrics}>
            <Stack screenOptions={{ contentStyle: { backgroundColor: '#0c1324' } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </GestureHandlerRootView>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );

  return content;
}
