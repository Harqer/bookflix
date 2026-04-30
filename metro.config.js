const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withSentryConfig } = require("@sentry/react-native/metro");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

// 👑 Sovereign Toolchain Alignment
// We add .flow to the source extensions so the bundler can see our vendored files.
config.resolver.sourceExts.push("flow");

// 👑 Sovereign Redirection: Direct Correction Pattern
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith("VirtualViewNativeComponent")) {
    return {
      filePath: path.resolve(__dirname, "vendor/react-native/VirtualViewNativeComponent.flow"),
      type: "sourceFile",
    };
  }
  if (moduleName.endsWith("VirtualViewExperimentalNativeComponent")) {
    return {
      filePath: path.resolve(__dirname, "vendor/react-native/VirtualViewExperimentalNativeComponent.flow"),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withSentryConfig(
  withNativeWind(config, {
    input: "./global.css",
    // 🚀 Performance: NativeWind v4 Force Write
    forceWriteFileSystem: true,
  })
);