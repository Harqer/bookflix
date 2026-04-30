const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withSentryConfig } = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

module.exports = withSentryConfig(
  withNativeWind(config, {
    input: "./global.css",
    // 🚀 Performance: NativeWind v4 Force Write
    // Fixes HMR and styling sync issues in 2026-grade environments
    forceWriteFileSystem: true,
  })
);