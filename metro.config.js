const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

// Escape special regex chars in the absolute path (handles Windows backslashes)
const distDir = path.resolve(__dirname, 'dist');
const escapedDistDir = distDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    blockList: [new RegExp(`^${escapedDistDir}`)],
  },
};

module.exports = mergeConfig(defaultConfig, config);
