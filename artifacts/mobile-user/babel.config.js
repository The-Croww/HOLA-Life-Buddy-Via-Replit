module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    overrides: [
      {
        // Apply private class field transforms to packages that ship #privateField
        // syntax in their compiled output, which Hermes in Expo Go can't handle.
        // Applying globally breaks expo/virtual/streams.js (web-streams-polyfill)
        // via loose-mode conflicts, so we target only the offending packages.
        include: [
          /node_modules\/react-native-worklets/,
          /node_modules\/socket\.io-client/,
          /node_modules\/engine\.io-client/,
        ],
        plugins: [
          ["@babel/plugin-transform-class-properties", { loose: true }],
          ["@babel/plugin-transform-private-methods", { loose: true }],
          ["@babel/plugin-transform-private-property-in-object", { loose: true }],
        ],
      },
    ],
  };
};
