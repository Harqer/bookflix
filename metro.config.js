import { getDefaultConfig } from "expo/metro-config.js";
import { withNativeWind } from "nativewind/metro.js";
import { withSentryConfig } from "@sentry/react-native/metro.js";

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

export default withSentryConfig(
  withNativeWind(config, {
    input: "./global.css",
    // 🚀 Performance: NativeWind v4 Force Write
    // Fixes HMR and styling sync issues in 2026-grade environments
    forceWriteFileSystem: true,
  })
);