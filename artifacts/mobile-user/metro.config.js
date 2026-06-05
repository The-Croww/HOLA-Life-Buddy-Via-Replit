const http = require("http");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const workspaceRoot = path.resolve(__dirname, "../..");
const config = getDefaultConfig(__dirname);

// pnpm uses symlinks into node_modules/.pnpm — Metro must watch the
// pnpm store and lib packages, but NOT the full workspace root (temp files
// in .local/ can be deleted mid-session and crash Metro's watcher).
config.watchFolders = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(workspaceRoot, "lib"),
];
config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// react-native-worklets ships private class fields (#field syntax) in its compiled
// module output. Hermes in Expo Go doesn't support this unless we run the package
// through Babel first. We override transformIgnorePatterns to include it.
const defaultIgnore =
  "node_modules/(?!(react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?(/.*)?|@expo-google-fonts(/.*)?|react-navigation|@react-navigation(/.*)?|@unimodules(/.*)?|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-worklets|@shopify/react-native-skia)/)";

config.transformer = config.transformer || {};
config.transformer.transformIgnorePatterns = [defaultIgnore];

// Inject DOMException polyfill before any module loads.
// expo/virtual/streams.js (web-streams-polyfill v4) references DOMException at
// module load time, and Hermes in Expo Go doesn't expose it globally.
config.serializer = config.serializer || {};
config.serializer.polyfillModuleNames = [
  ...(config.serializer.polyfillModuleNames || []),
  path.resolve(__dirname, "polyfills.js"),
];

// Proxy /api and /socket.io requests from the Expo Metro server to the API
// server on port 8080. This allows EXPO_PUBLIC_DOMAIN (the Expo dev domain)
// to be used as the base URL for all API calls from the mobile app.
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    const url = req.url || "";
    if (url.startsWith("/api") || url.startsWith("/socket.io")) {
      const options = {
        hostname: "localhost",
        port: 8080,
        path: url,
        method: req.method,
        headers: { ...req.headers, host: "localhost:8080" },
      };
      const proxy = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });
      proxy.on("error", (err) => {
        console.error("[Metro proxy error]", err.message);
        if (!res.headersSent) {
          res.writeHead(502);
          res.end(JSON.stringify({ error: "API server unavailable" }));
        }
      });
      req.pipe(proxy, { end: true });
      return;
    }
    middleware(req, res, next);
  };
};

module.exports = config;
