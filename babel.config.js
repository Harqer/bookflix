module.exports = function (api) {
  api.cache(true);
  const isWeb = api.caller((caller) => caller && (caller.name === "babel-loader" || caller.target === "web"));

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // 🚀 Optimization: Disable mobile-only codegen for web builds
          // This resolves the VirtualViewNativeComponent crash on Vercel
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
