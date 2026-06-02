const devDomain = process.env.REPLIT_DEV_DOMAIN;
const origin = devDomain
  ? `https://${devDomain}:3000`
  : "https://replit.com/";

module.exports = {
  expo: {
    name: "HOLA! Life Buddy",
    slug: "holalifebuddy",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "holalifebuddy",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#3DD68C",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.holalifebuddy.user",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#3DD68C",
      },
      package: "com.holalifebuddy.user",
    },
    web: {
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      ["expo-router", { origin }],
      "expo-font",
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
