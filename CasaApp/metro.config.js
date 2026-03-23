const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      '@env': require.resolve('react-native-dotenv'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
