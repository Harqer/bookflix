module.exports = function (api) {
  api.cache(true);

  // 🚀 Detection: Check if we are building for web (Vercel)
  // This avoids the "api.caller" caching conflict
  const isWeb = process.env.EXPO_PUBLIC_PLATFORM === "web" || process.env.NODE_ENV === "production";

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Bypass mobile-only codegen for web stability
          native: !isWeb,
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      "@babel/plugin-transform-flow-strip-types",
      "react-native-reanimated/plugin",
    ],
  };
};
