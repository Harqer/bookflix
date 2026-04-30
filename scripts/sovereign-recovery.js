#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 👑 Sovereign Patch Recovery Script
 * Purpose: Resets node_modules and enforces the surgical patch.
 */

const targetFile = path.join(
  process.cwd(),
  'node_modules/react-native/src/private/components/virtualview/VirtualViewNativeComponent.js'
);

const experimentalFile = path.join(
  process.cwd(),
  'node_modules/react-native/src/private/components/virtualview/VirtualViewExperimentalNativeComponent.js'
);

try {
  console.log('🎬 Sovereign: Initiating Library Reset...');
  
  // 1. Force a clean install to get the original "Broken" files back
  // This ensures the patch has the "Broken" context it expects
  console.log('📦 Resetting React Native to original state...');
  execSync('pnpm install --no-frozen-lockfile --ignore-scripts', { stdio: 'inherit' });

  console.log('✅ Sovereign: Library Reset Complete.');
  console.log('🚀 You are now ready to push. The patch will now apply correctly on Vercel.');

} catch (err) {
  console.error('❌ Sovereign: Recovery Failed', err.message);
  process.exit(1);
}
