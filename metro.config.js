const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withSentryConfig } = require("@sentry/react-native/metro");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

// 👑 Sovereign Redirection: Direct Correction Pattern
// Instead of patching node_modules, we redirect the bundler to our corrected source.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith("VirtualViewNativeComponent")) {
    return {
      filePath: path.resolve(__dirname, "vendor/react-native/VirtualViewNativeComponent.tsx"),
      type: "sourceFile",
    };
  }
  if (moduleName.endsWith("VirtualViewExperimentalNativeComponent")) {
    return {
      filePath: path.resolve(__dirname, "vendor/react-native/VirtualViewExperimentalNativeComponent.tsx"),
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