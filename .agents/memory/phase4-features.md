---
name: Phase 4 Polish Features
description: Phase 4 polish and launch prep — onboarding, empty states, micro-interactions, accessibility, app.json config
---

## Onboarding (`app/onboarding.tsx`)
- 4-slide carousel replacing image-based 3-slide version
- Slide 1: logo animation (spring scale + sequential opacity fades for title/subtitle)
- Slides 2–3: large emoji illustrations, no image requires
- Slide 4: name input (saved to AsyncStorage `preferredName`, passed to `/register` as `prefillName` param)
- Skip button top-right navigates directly to slide 4
- Last slide: two buttons — "Create account" → `/register`, "I already have an account" → `/login`
- Brand accent color: `#3DD68C` (not from `colors.primary` — hardcoded for consistent green)

## Admin Onboarding (`app/(admin)/_layout.tsx`)
- Inline `AdminOnboarding` component renders as full-screen overlay over Tabs
- AsyncStorage key: `adminOnboardingDone_v1`
- 2-slide FlatList (scrollEnabled=false), fade-out animation on completion
- Wraps the entire Tabs in a `<View style={{ flex: 1 }}>` to allow overlay

**Why:** Admin onboarding must NOT use navigation (would break tab layout initialization); modal overlay approach is stable.

## Empty States Added
| Screen | Emoji | Title | Subtitle |
|--------|-------|-------|---------|
| Home tasks | 📋 | No tasks assigned yet | Your psychologist will send tasks here. |
| Journal | ✍️ | No entries yet | Writing even 2 sentences can help. ✍️ (+ CTA button) |
| Mood progress | 📊 | No progress data yet | Start logging your mood… (+ CTA button) |
| User messages | 👋 | No messages yet | Say hello — your psychologist will see your message here. |
| Admin messages | 👋 | No messages yet | Say hello to get the conversation started |

## Micro-interactions
- Mood score pills: `Animated.View` wrapping `TouchableOpacity`, single shared `scoreAnim` ref, springs from 0.82→1 on selection
- **Why single shared anim:** avoids creating 10 Animated.Values in a list; only selected pill animates

## App.json Changes
- Bundle IDs: `com.holalifebuddy.user` (was `com.holalifebuddy.app`)
- Splash background: `#3DD68C` (brand green)
- Android adaptive icon background: `#3DD68C`

## Register Prefill
- `useLocalSearchParams<{ prefillName?: string }>()` — name field prefilled from onboarding slide 4
- Uses `useEffect` in addition to `useState(prefillName ?? "")` to handle param changes
