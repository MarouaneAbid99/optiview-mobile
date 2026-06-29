module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 / SDK 54: the worklets plugin must be listed LAST.
    // (In v4 this replaces the old 'react-native-reanimated/plugin'.)
    plugins: ['react-native-worklets/plugin'],
  };
};
