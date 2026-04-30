module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "@babel/plugin-transform-flow-strip-types",
      "react-native-reanimated/plugin",
    ],
    // 👑 Sovereign Parser Synchronization
    // Ensures that our corrected vendored components are properly type-stripped.
    overrides: [
      {
        test: "./vendor/react-native/**/*.js",
        plugins: ["@babel/plugin-transform-flow-strip-types"],
      },
    ],
  };
};
