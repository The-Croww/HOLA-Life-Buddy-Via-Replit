---
name: Expo Replit QR + Hermes setup
description: How to correctly wire Expo Go QR code scanning, fix private class field crashes, and route API calls on Replit.
---

## QR Code scanning (Expo Go on physical device)

`REPLIT_EXPO_DEV_DOMAIN` is a Replit runtime variable (not listed in secrets UI) that resolves to `[REPL_ID]-[slug].expo.[cluster].replit.dev` — distinct from `REPLIT_DEV_DOMAIN` which has no `.expo.` segment. Replit proxies this domain to port 23106 (Metro bundler).

**Why:** Without `.expo.` the QR code URL becomes `exp://[REPLIT_DEV_DOMAIN]` (port 80 = Web Admin), so Expo Go connects to the wrong server and fails silently.

**How to apply:** Always use `REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_EXPO_DEV_DOMAIN` and `EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN` with `--localhost --port 23106`.

Correct workflow command:
```
EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN EXPO_PUBLIC_REPL_ID=$REPL_ID REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_EXPO_DEV_DOMAIN pnpm --filter @workspace/mobile-user exec expo start --localhost --port 23106
```

Note: port 23106 is NOT in the `configureWorkflow` supported ports list, so omit `waitForPort`.

## EXPO_PUBLIC_DOMAIN for API calls

Set `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN` (not the expo domain). The Web Admin Vite server (port 5000) has a `/api` proxy to port 8080, so all API calls at `https://[REPLIT_DEV_DOMAIN]/api/v1/...` work correctly.

**Why:** The Expo dev domain proxies to Metro (port 23106), not the API (port 8080). Using `REPLIT_EXPO_DEV_DOMAIN` for `EXPO_PUBLIC_DOMAIN` would route API calls to the bundler, not the Express server.

## Hermes private class fields crash

Hermes (Expo Go's JS engine) does NOT support `#privateField` syntax at runtime. The babel.config.js `overrides` must list every offending package.

Known culprits in this project (besides `react-native-worklets`):
- `socket.io-client@4.8.3` — uses `#` in `socket.js`
- `engine.io-client@6.6.5` — uses `#` in `parseuri.js`, `polling-fetch.js`, `websocket.js`

**Why:** Applying the transforms globally breaks `expo/virtual/streams.js` (web-streams-polyfill) via loose-mode conflicts, so target only the offending packages with `include: [/regex/]`.

**How to apply:** In `babel.config.js`, add new packages to the `overrides[0].include` array with the pattern transform plugins (loose: true).
