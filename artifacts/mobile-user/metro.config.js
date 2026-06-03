const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// react-native-worklets ships private class fields (#field syntax) in its compiled
// module output. Hermes in Expo Go doesn't support this unless we run the package
// through Babel first. We override transformIgnorePatterns to include it.
const defaultIgnore =
  "node_modules/(?!(react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?(/.*)?|@expo-google-fonts(/.*)?|react-navigation|@react-navigation(/.*)?|@unimodules(/.*)?|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-worklets|@shopify/react-native-skia)/)";

config.transformer = config.transformer || {};
config.transformer.transformIgnorePatterns = [defaultIgnore];

module.exports = config;
