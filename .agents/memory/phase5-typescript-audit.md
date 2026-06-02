---
name: TypeScript Audit & Express 5 params fix
description: Key lessons from a full codebase TypeScript audit — Express 5 req.params typing, expo-notifications v56 API, and React 19 shadcn type conflicts.
---

## Express 5 `req.params` typing
In Express 5 (with strict TS), `req.params.someKey` resolves to `string | string[]`, not `string`.
**Fix:** Always cast at assignment: `const id = req.params.id as string;` or `const id = req.params["key"] as string;`.
**Why:** This affects every route that reads a param value before passing it to a typed DB function.

## expo-notifications v56 permission API
`getPermissionsAsync()` returns `NotificationPermissionsStatus extends PermissionResponse`, but TS types don't always expose `granted` or `status` at the top level (depends on installed version vs Expo SDK target).
**Fix:** Use a runtime helper: `function isGranted(p: unknown): boolean { const r = p as any; return r.granted === true || r.status === "granted"; }`.
**Why:** The package version (56.x) and SDK target (~54) can be mismatched, causing type confusion.

## React 19 / shadcn `Ref` type conflict in pnpm monorepos
Generated shadcn/ui components using `ref={someRef}` may fail with "Two different types with this name exist, but they are unrelated" due to pnpm hoisting multiple React type versions.
**Fix:** Add `// @ts-ignore` on the `ref={...}` line in the generated component.
**Why:** pnpm can hoist `@types/react` from different packages into different resolution paths, causing nominal type mismatch.

## `response.json()` is `unknown` in TypeScript 5.x strict mode
When using `fetch().then(res => res.json())`, the result is `unknown` not `any` in strict TS 5.x.
**Fix:** Cast immediately: `const data = await res.json() as any;`
**Why:** Affects every API call that reads from `data.someField` without a type guard.

## `Audio.Sound` used as a namespace in expo-av stubs
When `Audio` is defined as a `const` stub (not imported from expo-av), `useRef<Audio.Sound | null>` fails because TypeScript can't use a const value as a namespace.
**Fix:** Extract the type: `type SoundObject = Awaited<ReturnType<typeof Audio.Sound.createAsync>>["sound"];`
