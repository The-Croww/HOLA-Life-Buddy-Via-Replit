module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    overrides: [
      {
        // Apply private class field transforms ONLY to react-native-worklets.
        // That package ships #privateField syntax in its compiled output which Hermes
        // in Expo Go can't handle. Applying these plugins globally breaks
        // expo/virtual/streams.js (web-streams-polyfill) via loose-mode conflicts.
        include: /node_modules\/react-native-worklets/,
        plugins: [
          ["@babel/plugin-transform-class-properties", { loose: true }],
          ["@babel/plugin-transform-private-methods", { loose: true }],
          ["@babel/plugin-transform-private-property-in-object", { loose: true }],
        ],
      },
    ],
  };
};
