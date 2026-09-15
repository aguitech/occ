const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [
  __dirname + '/node_modules',
];

// Expo Router detectará src/app/ automáticamente
process.env.EXPO_ROUTER_APP_ROOT = __dirname + '/src/app';

module.exports = config;
