const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

module.exports = withNativeWind(config, {
  input: "./global.css",
  // 🚀 Performance: NativeWind v4 Force Write
  forceWriteFileSystem: true,
});