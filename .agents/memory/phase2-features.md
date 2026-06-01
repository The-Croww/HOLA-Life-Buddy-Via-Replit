---
name: Phase 2 admin features
description: All 5 Phase 2 features shipped across API server, web admin, and mobile admin. Patterns and endpoint conventions.
---

# Phase 2 Features — Complete

## Endpoints (all in `artifacts/api-server/src/routes/adminFeatures.ts`)
- `POST /v1/psychologist/clients/:id/ai-summary` — Groq llama3-8b-8192, 24h cache in `aiSummaryCache` Map. Falls back to deterministic template.
- `GET/POST /v1/psychologist/clients/:id/notes` — SOAP/progress/free templates stored in `notesStore` Map.
- `GET/POST /v1/psychologist/clients/:id/goals` — Goals with active/achieved/paused; `GET` allows either psychologist OR the client.
- `PATCH /v1/psychologist/clients/:id/goals/:goalId` — Update goal status/title/description/targetDate.
- `GET/POST /v1/psychologist/appointments` — Psychologist appointments; stored in `appointmentsStore` Map.
- `GET /v1/appointments/upcoming` — Next appointment for logged-in user (by clientId).
- `GET /v1/psychologist/reports?range=week|lastweek|month` — Per-client + practice overview.

## Web Admin pages
- `Reports.tsx` — Range selector, practice overview stats, per-client expandable cards with mood bars + AI insight.
- `Schedule.tsx` — Weekly grid (8am–5pm, 7 days), appointment creation modal, upcoming list.
- `ClientProfile.tsx` — Now has 5 tabs: overview/tasks/journal/notes/goals. AI Summary panel, template note editor (SOAP/progress/free), goals CRUD with celebration.
- `Sidebar.tsx` — Added Reports (under Insights) and Schedule (under Practice) nav items.
- `App.tsx` — Page type extended with "reports" | "schedule"; Reports gets `onViewClient` prop.

## Mobile (`artifacts/mobile-user/app/client/[id].tsx`)
- 5 tabs: overview/tasks/journal/notes/goals (horizontal ScrollView tab bar).
- AI button in top bar → panel below top bar with Groq summary.
- Notes tab: SOAP/progress/free template selector, save to API, past notes expandable list.
- Goals tab: create/pause/resume/achieve with celebration Alert.

## User home screen (`app/(tabs)/index.tsx`)
- Upcoming appointment card shown when appointment is within 24h. Fetches `/v1/appointments/upcoming` with raw fetch (no generated hook since endpoint is custom).

**Why:** `useAdminFetch` is for admin role; user home uses raw fetch with token from `(localUser as any).token`.
