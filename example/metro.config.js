const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  watchFolders: [
    ...(config.watchFolders ?? []),
    root,
    path.join(root, 'node_modules'),
  ],
  resolver: {
    ...config.resolver,
    unstable_enableSymlinks: true,
  },
};
