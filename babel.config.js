module.exports = function (api) {
  api.cache(true);

  // 🚀 Detection: Aggressive platform check for Vercel/Web builds
  const isWeb =
    process.env.EXPO_PUBLIC_PLATFORM === "web" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1";

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          native: !isWeb,
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      "@babel/plugin-transform-flow-strip-types",
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          alias: isWeb
            ? {
                "react-native/src/private/components/virtualview/VirtualViewNativeComponent": "./lib/fabric-mock",
                "react-native/src/private/components/virtualview/VirtualViewExperimentalNativeComponent": "./lib/fabric-mock",
              }
            : {},
        },
      ],
    ],
  };
};
