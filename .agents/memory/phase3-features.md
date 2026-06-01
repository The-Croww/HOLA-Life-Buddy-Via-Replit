---
name: Phase 3 features
description: All Phase 3 features and key implementation patterns across all 3 artifacts.
---

## Completed Phase 3 features

### Data Persistence (SQLite — better-sqlite3)
- All data now lives in `hola.db` (sqlite) via `artifacts/api-server/src/lib/db.ts`
- 13 tables, seed data (alex@example.com/password123, doctor@example.com/doctor123, dr@clinic.com/password123)
- `hola.db` added to `.gitignore`
- `better-sqlite3` must stay in `onlyBuiltDependencies` in `pnpm-workspace.yaml`

### Push Notifications (Expo)
- Backend: `artifacts/api-server/src/lib/pushNotification.ts` — calls Expo push API
- Backend: `POST /api/v1/users/push-token` — stores token per user in `push_tokens` table
- Mobile: `artifacts/mobile-user/hooks/usePushNotifications.ts` — requests permission, saves token
- Mobile: `PushSetup` component inside `AuthProvider` in `_layout.tsx` registers on login
- Push fires on: new message received, task assigned, task completed (notifies psych), risk alert

### Real-time Messaging
- `POST /api/v1/messages/read` — marks messages as read (called on screen focus)
- `GET /api/v1/messages/unread-count` — returns count for badge
- Mobile: `useUnreadMessages` hook polls every 10s, drives `tabBarBadge` on Messages tab
- Mobile: `messages.tsx` calls `markAsRead` on `useFocusEffect`

### Assigned Tasks on Home Screen
- `GET /api/v1/tasks/assigned` — returns pending (non-completed) tasks
- `index.tsx` shows pending tasks with `CelebrationOverlay` animation on complete (green flash + ✅)
- After celebration (1.4s), queries are invalidated and card disappears

### Risk Alert Engine
- Runs hourly via `setInterval` in `riskEngine.ts`
- 4 rules: no check-in 3+ days, mood ≤3 for 3 entries, distress emotions, tasks overdue 3+ days
- Emits socket event + push notification to psychologist on alert creation
- Dedup via `dbHasRecentAlert` (24h window)

## Key patterns
- All API routes import directly from `../lib/db` — store.ts is just a re-export shim
- babel-preset-expo needs to match expo version — when upgrading expo, update babel-preset-expo too
- GROQ_API_KEY and EXPO_PUBLIC_DOMAIN are secrets to be added by user
