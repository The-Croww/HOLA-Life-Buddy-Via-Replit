---
name: Phase 4 Bug Fixes
description: Auth redirects, sidebar/drawer patterns, sign-in/out persistence, and admin header pattern used during Phase 4 polish session.
---

## Eye icon pattern (mobile)
- Wrap `TextInput` in a `<View style={{ position: "relative" }}>` with `paddingRight: 48` on the input
- Add `<TouchableOpacity style={{ position: "absolute", right: 14, top: 0, bottom: 0, ... }}>` with Feather `eye`/`eye-off`
- State: `const [showPassword, setShowPassword] = useState(false)` → `secureTextEntry={!showPassword}`

## Role-based redirect fix
- `app/login.tsx` `onSuccess`: `router.replace(data.user.role === "psychologist" || role === "admin" ? "/(admin)" : "/(tabs)")`
- `app/index.tsx` MUST be role-aware too — it was redirecting everyone to `/(tabs)`.
  Fixed to check `user?.role` and redirect admins to `/(admin)`.

**Why:** Both the login onSuccess AND the root index.tsx need role checks. Forgetting index.tsx causes a double-redirect flash for psychologists.

## User sidebar (CustomDrawer) — left-side drawer
- Original CustomDrawer had `<backdrop first> <drawer second>` (= right-side drawer)
- Fixed to `<drawer first> <backdrop second>` (= LEFT-side drawer matching the hamburger button position)
- `colors.alert` is a valid key in `constants/colors.ts` = `"#FF6B6B"`

## Admin drawer (AdminDrawer.tsx)
- New component at `components/AdminDrawer.tsx` — dark theme (#111113 background), slide from left
- Shows: HOLA! brand strip, profile card (avatar + name + email + role badge), nav items (Profile, Analytics, Alerts), sign-out
- Sign out uses `Alert.confirm` inside a `setTimeout(300)` AFTER drawer closes (avoid animation conflicts)
- Imported and rendered as overlay in `(admin)/_layout.tsx`

## Admin layout with native header
- Set `headerShown: true` in all admin tabs `screenOptions` to show hamburger (left) + bell (right) via `headerLeft`/`headerRight`
- Profile tab hidden: `tabBarButton: () => null` + `tabBarItemStyle: { display: "none" }` (do NOT use `href: null` — breaks route)
- All 5 admin screens had internal `<Text style={s.title}>ScreenName</Text>` that became redundant — removed from clients, alerts, messages, analytics
- Dashboard (index.tsx) kept its greeting header since content is unique (not a title duplicate)
- `router.navigate("/(admin)/alerts" as any)` in headerRight — works from layout level

## Web admin persistence
- `App.tsx` `user` state was pure in-memory — refreshing the page logged out the admin
- Fixed with `localStorage` keyed at `"hola_admin_session"`: `useState(loadStoredUser)` init, `signIn` saves, `signOut` clears
- Also reset page to "dashboard" on signIn to prevent stale page state

## Admin onboarding overlay
- `AdminOnboarding` inline in `(admin)/_layout.tsx` — renders over the Tabs, gated by `AsyncStorage "adminOnboardingDone_v1"`
- Still works after adding `AdminDrawer` — both are overlays inside the outer `<View style={{ flex: 1 }}>`
