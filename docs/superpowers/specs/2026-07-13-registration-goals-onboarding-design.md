# Registration & Goals Onboarding — Design

**Date:** 2026-07-13
**Status:** Approved (pending spec review)
**Area:** `frontend-next` (Next.js) + `backend` (Express/Mongoose)

## Problem

Registration collects only `name` / `email` / `password` (plus Google and phone
sign-in). The `User` model already carries rich per-module goals
(`goals.sleep`, `goals.exercise`, `goals.mood`, `goals.water`) but they are set
to silent defaults and never surfaced to the user. New users get a generic
experience (7h sleep, 8 glasses water, 4 workouts/week) with no chance to make
the app feel like theirs.

We want to personalize goals **without** adding friction to the credential step.

## Goals

- Keep the signup form minimal — credentials only.
- Personalize the three natural per-module goals (sleep, water, exercise) once,
  right after a user's first login.
- Make the whole thing skippable — never block a user from reaching the app.

## Non-Goals

- No changes to the registration form fields or the auth methods.
- No profile/biometric collection (age, gender, weight, units).
- No focus-area / module selection, no reminder/timezone capture. (Considered
  and deliberately deferred — see "Alternatives considered".)
- No mood goal in the wizard — mood stays a tracked metric with its default.

## Decisions

1. **Signup form is unchanged.** `name` / `email` / `password` + Google + phone
   stay exactly as-is.
2. **A skippable, stepped goals wizard** runs **once**, after the user's first
   successful login, at a new `/onboarding` route.
3. **Three steps:** sleep hours, water glasses/day, exercise days/week. Mood is
   dropped from the wizard (remains `goals.mood` default `3`, tunable in
   Settings).
4. **Reuse `PUT /settings/goals`** — no new goals endpoint.
5. **A new `onboardingComplete` flag** on the `User` model gates the wizard.
6. **Existing accounts migrate to `onboardingComplete: true`** so current test
   accounts are never re-onboarded.

## Flow

```
register → verify email → login ──▶ land on app
                                        │
                        onboardingComplete === false?
                             │ yes               │ no
                             ▼                    ▼
                        /onboarding           dashboard (/)
                        (3-step wizard)
                             │
              finish  ──▶ PUT /settings/goals ──▶ mark complete ──▶ /
              skip    ─────────────────────────▶ mark complete ──▶ /
```

The same trigger applies to Google/phone accounts (they also reach the app for
the first time with `onboardingComplete === false`), so behavior is consistent
across all auth methods.

## Backend changes (`backend/src`)

### `models/User.js`
- Add field: `onboardingComplete: { type: Boolean, default: false }`.

### User serialization (`controllers/authController.js`)
- Include `onboardingComplete` in the user object returned by
  `setCookieAndRespond` (and anywhere else the user is serialized to the client,
  e.g. the session/`me` payload) so the client knows whether to show the wizard.

### New endpoint (`controllers/settingsController.js` + `routes/settings.js`)
- `PUT /settings/onboarding-complete` → auth-required; sets
  `onboardingComplete = true` for the current user; returns the updated flag.
- Kept dedicated (not folded into `updateGoals`) to avoid mixing concerns.

### Reused unchanged
- `PUT /settings/goals` — already validates
  `{ sleep: 1–24, exercise: 0–7, mood: 1–5, water: 1–50 }`. The wizard posts the
  three collected values through it.

### Migration
- One-off: set `onboardingComplete: true` on all existing users so pre-existing
  (test) accounts skip the wizard. New accounts default to `false`.

## Frontend changes (`frontend-next/src`)

### Route & layout
- New full-screen route `app/onboarding/page.tsx` with its own minimal layout
  (no app sidebar/dashboard chrome).
- It is a protected (non-public) path, so the existing `proxy.ts` auth guard
  already covers it — no middleware change needed.

### Redirect gate
- In the authenticated app shell, once the user is loaded: if
  `onboardingComplete === false` and the current path is not `/onboarding`,
  redirect to `/onboarding`. If they are already onboarded, no-op.

### `OnboardingWizard` component
- Three steps, each: a friendly prompt, a stepper (±) control pre-filled with
  the model default, progress dots, Back / Next, a per-step "Skip", and an
  overall "Skip for now".
  - Defaults: sleep `7`, water `8`, exercise `4`.
- **Finish** → `PUT /settings/goals` with the three current values →
  `PUT /settings/onboarding-complete` → update the auth store →
  `router.push('/')`.
- **Skip for now** → `PUT /settings/onboarding-complete` only (keeps defaults) →
  redirect. No goals write, so this path cannot fail on goal validation.
- Reuses existing UI primitives (`Button`, etc.) and `fetchApi` / `ApiError`.

### Types & store
- `types/user.ts`: add `onboardingComplete: boolean` to `User`.
- `stores/auth-store.ts`: update the user's `onboardingComplete` on completion
  (via existing `setUser` or a small dedicated setter).

## Error handling & edge cases

- **Goals save fails on finish:** show an inline error and allow retry; do
  **not** mark onboarding complete, so the user isn't pushed past with unsaved
  goals.
- **Tab closed mid-wizard:** flag stays `false` → wizard re-shows on next login
  (goals were never saved). It restarts rather than dead-ending.
- **Individual steps skipped:** that goal keeps its default; finishing writes all
  three current values (unchanged defaults are harmless no-ops server-side).
- **Existing users:** migrated to `true`, so they never see the wizard.

## Testing

- **Backend:**
  - `User` model defaults `onboardingComplete` to `false`.
  - `PUT /settings/onboarding-complete` requires auth and sets the flag true.
  - (Existing `PUT /settings/goals` validation already covered.)
- **Frontend:** (vitest setup already landing on this branch)
  - `OnboardingWizard`: step navigation, per-step skip, finish saves goals +
    marks complete, "Skip for now" marks complete without saving goals.
  - Redirect gate: user with `onboardingComplete === false` is routed to
    `/onboarding`; onboarded user is not.

## Alternatives considered

- **Pack details into the signup form** — rejected; violates the minimal-friction
  requirement.
- **Progressive/contextual capture** (ask each goal when a module is first
  opened) — viable and lower-friction still, but gives no single "make it yours"
  moment; deferred.
- **Optional-in-Settings only** (pure pull) — zero push, but most users never
  personalize; rejected as the primary path.
- **Single-screen goals form** — fastest, but the stepped wizard was chosen for
  a more guided, intentional feel.
- **Include a mood target step** — rejected; "aim for 3/5 mood" is an unusual
  ask and mood is better tracked than targeted.
- **Also collect focus areas / reminders / profile** — out of scope for this
  iteration to keep friction minimal; the wizard is intentionally just the three
  natural goals.
