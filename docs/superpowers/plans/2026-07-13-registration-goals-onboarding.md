# Registration & Goals Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leave the signup form minimal and add a skippable, 3-step goals wizard (sleep / water / exercise) that runs once after a user's first login.

**Architecture:** Backend gains an `onboardingComplete` boolean on `User`, surfaced in the user payload and flipped by a new `PUT /settings/onboarding-complete`. The frontend adds a full-screen `/onboarding` route: a pure presentational `OnboardingWizard` (tested via a Storybook `play` story) wrapped in a thin client container that saves goals through the existing `PUT /settings/goals`, marks onboarding complete, and returns to `/`. The `(dashboard)` server layout redirects not-yet-onboarded users into the wizard.

**Tech Stack:** Node/Express + Mongoose (backend); Next.js App Router + Zustand + Storybook-vitest interaction tests (frontend).

## Global Constraints

- Backend API is mounted under `/api` (e.g. `/api/settings/...`), local dev port `5000`.
- Frontend calls the backend via `fetchApi(path, ...)` from `@/lib/api`, where `path` excludes the `/api` prefix (e.g. `fetchApi("/settings/goals", ...)`).
- `frontend-next` runs on a **modified Next.js** — read `node_modules/next/dist/docs/` before writing framework code if anything looks unfamiliar (per `frontend-next/AGENTS.md`).
- No new test frameworks. Backend = manual smoke checks; frontend = Storybook `.stories.tsx` `play` functions matching the existing `src/components/ui/*.stories.tsx` convention.
- `goals.mood` is intentionally NOT collected by the wizard. Goal defaults: sleep `7`, water `8`, exercise `4`.
- Existing `PUT /settings/goals` validation: `sleep` 1–24, `exercise` 0–7 (int), `mood` 1–5, `water` 1–50 (int). The wizard sends only `{ sleep, exercise, water }`.

---

### Task 1: Backend — add `onboardingComplete` field and include it in the user payload

**Files:**
- Modify: `backend/src/models/User.js` (after line 28, alongside `phoneVerified`)
- Modify: `backend/src/controllers/authController.js` (the `setCookieAndRespond` user object ~line 43-46, and `getMe` ~line 257-268)

**Interfaces:**
- Produces: `User.onboardingComplete` (Boolean, default `false`); the `/api/auth/me` and login/register responses now include `onboardingComplete` in `user`.

- [ ] **Step 1: Add the field to the User schema**

In `backend/src/models/User.js`, add the field right after the `phoneVerified` line:

```js
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  onboardingComplete: { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String, index: true },
```

- [ ] **Step 2: Include the field in `setCookieAndRespond`**

In `backend/src/controllers/authController.js`, inside the `res.json({ ... user: { ... } })` block of `setCookieAndRespond`, add `onboardingComplete`:

```js
    user: {
      id: user._id, email: user.email, phone: user.phone, name: user.name, xp: user.xp, level: user.level,
      goals: user.goals ?? { sleep: 7, exercise: 4, mood: 3, water: 8 },
      reminderTimes: user.reminderTimes ?? { mood: '', sleep: '', water: '', exercise: '' },
      emailReminders: user.emailReminders ?? false,
      onboardingComplete: user.onboardingComplete ?? false,
    }
```

- [ ] **Step 3: Include the field in `getMe`**

In `backend/src/controllers/authController.js`, in `exports.getMe`, add `onboardingComplete` to the returned object:

```js
exports.getMe = async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    xp: req.user.xp,
    level: req.user.level,
    goals: req.user.goals ?? { sleep: 7, exercise: 4, mood: 3, water: 8 },
    reminderTimes: req.user.reminderTimes ?? { mood: '', sleep: '', water: '', exercise: '' },
    emailReminders: req.user.emailReminders ?? false,
    onboardingComplete: req.user.onboardingComplete ?? false,
  });
};
```

- [ ] **Step 4: Verify the model default (no DB required)**

Run from `backend/`:

```bash
node -e "const U=require('./src/models/User'); console.log(new U({name:'x'}).onboardingComplete)"
```

Expected output: `false`

- [ ] **Step 5: Verify `/auth/me` returns the field (dev server running)**

Start the backend (`npm start` in `backend/`), log in through the app UI, and copy the `access_token` cookie value from browser DevTools → Application → Cookies. Then:

```bash
curl -s http://localhost:5000/api/auth/me -H "Cookie: access_token=PASTE_TOKEN_HERE"
```

Expected: JSON that now contains `"onboardingComplete": ...` (true or false). If it's missing, re-check Step 3.

- [ ] **Step 6: Commit**

```bash
git add backend/src/models/User.js backend/src/controllers/authController.js
git commit -m "feat(auth): add onboardingComplete flag to user model and payload"
```

---

### Task 2: Backend — `PUT /settings/onboarding-complete` endpoint + migrate existing users

**Files:**
- Modify: `backend/src/controllers/settingsController.js` (add `completeOnboarding` export, e.g. after `updateGoals`)
- Modify: `backend/src/routes/settings.js` (import + route registration under the `router.use(auth)` section)

**Interfaces:**
- Consumes: `User.onboardingComplete` (Task 1); the existing `auth` middleware which sets `req.user`.
- Produces: `PUT /api/settings/onboarding-complete` (auth-required) → sets flag true → responds `{ onboardingComplete: true }`.

- [ ] **Step 1: Add the controller function**

In `backend/src/controllers/settingsController.js`, add after `exports.updateGoals`:

```js
exports.completeOnboarding = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { onboardingComplete: true } },
      { new: true }
    );
    res.json({ onboardingComplete: user.onboardingComplete });
  } catch (err) { next(err); }
};
```

- [ ] **Step 2: Register the route**

In `backend/src/routes/settings.js`, add `completeOnboarding` to the destructured import from the controller:

```js
const {
  updateGoals, updateReminders,
  subscribePush, unsubscribePush, getVapidPublicKey,
  updateEmailReminders, completeOnboarding,
} = require('../controllers/settingsController');
```

Then, below the existing `router.use(auth);` line (so it is authenticated), add the route near the other `router.put(...)` calls:

```js
router.put('/onboarding-complete', completeOnboarding);
```

- [ ] **Step 3: Verify the endpoint (dev server running)**

Using the same `access_token` cookie as Task 1 Step 5:

```bash
curl -s -X PUT http://localhost:5000/api/settings/onboarding-complete \
  -H "Cookie: access_token=PASTE_TOKEN_HERE"
```

Expected output: `{"onboardingComplete":true}`

Confirm it persisted:

```bash
curl -s http://localhost:5000/api/auth/me -H "Cookie: access_token=PASTE_TOKEN_HERE"
```

Expected: the JSON now shows `"onboardingComplete": true`.

- [ ] **Step 4: Migrate existing users (one-off)**

Existing user documents predate the field and read as `undefined` (falsy → would see the wizard). Set them complete. Run against the dev database with `mongosh` (replace the connection string / DB name as configured in `backend/.env` `MONGODB_URI`):

```bash
mongosh "$MONGODB_URI" --eval 'db.users.updateMany({ onboardingComplete: { $exists: false } }, { $set: { onboardingComplete: true } })'
```

Expected: a result like `{ matchedCount: N, modifiedCount: N }`. New signups still default to `false`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/settingsController.js backend/src/routes/settings.js
git commit -m "feat(settings): add onboarding-complete endpoint"
```

---

### Task 3: Frontend — `OnboardingWizard` presentational component + Storybook test

**Files:**
- Create: `frontend-next/src/components/onboarding/onboarding-wizard.tsx`
- Create: `frontend-next/src/components/onboarding/onboarding-wizard.stories.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`.
- Produces:
  - `export interface GoalValues { sleep: number; exercise: number; water: number }`
  - `export function OnboardingWizard(props: OnboardingWizardProps)` where
    `OnboardingWizardProps = { onFinish: (goals: GoalValues) => void; onSkip: () => void; saving?: boolean; error?: string | null; initial?: GoalValues }`
  - Both exported from `@/components/onboarding/onboarding-wizard`.

- [ ] **Step 1: Write the failing Storybook test**

Create `frontend-next/src/components/onboarding/onboarding-wizard.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { OnboardingWizard } from './onboarding-wizard';

const meta = {
  component: OnboardingWizard,
  tags: ['ai-generated'],
  args: { onFinish: fn(), onSkip: fn() },
} satisfies Meta<typeof OnboardingWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Advancing through all three steps calls onFinish with the default goal values.
export const CompletesWithDefaults: Story = {
  play: async ({ canvas, args }) => {
    // Step 1 (Sleep)
    await expect(canvas.getByText(/sleep/i)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    // Step 2 (Water)
    await expect(canvas.getByText(/water/i)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    // Step 3 (Exercise) — primary button becomes "Finish"
    await expect(canvas.getByText(/exercise/i)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /finish/i }));

    await expect(args.onFinish).toHaveBeenCalledWith({ sleep: 7, water: 8, exercise: 4 });
  },
};

// "Skip for now" is available on the first step and calls onSkip.
export const SkipsFromFirstStep: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /skip for now/i }));
    await expect(args.onSkip).toHaveBeenCalled();
  },
};

// Increment then complete: onFinish reflects the adjusted sleep value.
export const AdjustsThenCompletes: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /increase/i })); // sleep 7 -> 8
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    await userEvent.click(canvas.getByRole('button', { name: /finish/i }));
    await expect(args.onFinish).toHaveBeenCalledWith({ sleep: 8, water: 8, exercise: 4 });
  },
};
```

- [ ] **Step 2: Run the story tests to verify they fail**

Run from `frontend-next/`:

```bash
npx vitest run
```

Expected: FAIL — the module `./onboarding-wizard` does not exist / `OnboardingWizard` is not defined.
(If Playwright's Chromium is missing, run `npx playwright install chromium` once, then re-run.)

- [ ] **Step 3: Implement the component**

Create `frontend-next/src/components/onboarding/onboarding-wizard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface GoalValues {
  sleep: number;
  exercise: number;
  water: number;
}

interface StepDef {
  key: keyof GoalValues;
  title: string;
  prompt: string;
  unit: string;
  min: number;
  max: number;
}

const STEPS: StepDef[] = [
  { key: "sleep",    title: "Sleep",    prompt: "How many hours of sleep are you aiming for?", unit: "hours",     min: 1, max: 24 },
  { key: "water",    title: "Water",    prompt: "How many glasses of water a day?",            unit: "glasses",   min: 1, max: 50 },
  { key: "exercise", title: "Exercise", prompt: "How many days a week do you want to move?",   unit: "days / wk", min: 0, max: 7  },
];

const DEFAULTS: GoalValues = { sleep: 7, water: 8, exercise: 4 };

export interface OnboardingWizardProps {
  onFinish: (goals: GoalValues) => void;
  onSkip: () => void;
  saving?: boolean;
  error?: string | null;
  initial?: GoalValues;
}

export function OnboardingWizard({
  onFinish,
  onSkip,
  saving = false,
  error = null,
  initial = DEFAULTS,
}: OnboardingWizardProps) {
  const [values, setValues] = useState<GoalValues>(initial);
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const value = values[step.key];

  function setValue(next: number) {
    const clamped = Math.min(step.max, Math.max(step.min, next));
    setValues((v) => ({ ...v, [step.key]: clamped }));
  }

  function next() {
    if (isLast) onFinish(values);
    else setStepIndex((i) => i + 1);
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex gap-2" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-foreground" : "bg-muted"}`}
          />
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{step.title}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{step.prompt}</h1>
      </div>

      <div className="flex items-center justify-center gap-6 py-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-label="Decrease"
          onClick={() => setValue(value - 1)}
          disabled={saving || value <= step.min}
        >
          −
        </Button>
        <div className="min-w-24 text-center">
          <div className="text-4xl font-semibold tabular-nums">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{step.unit}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-label="Increase"
          onClick={() => setValue(value + 1)}
          disabled={saving || value >= step.max}
        >
          +
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <Button type="button" className="w-full h-10" onClick={next} disabled={saving}>
          {saving ? "Saving…" : isLast ? "Finish" : "Next"}
        </Button>
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={back} disabled={stepIndex === 0 || saving}>
            Back
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onSkip} disabled={saving}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the story tests to verify they pass**

Run from `frontend-next/`:

```bash
npx vitest run
```

Expected: PASS — the three `OnboardingWizard` stories (`CompletesWithDefaults`, `SkipsFromFirstStep`, `AdjustsThenCompletes`) pass. Pre-existing UI stories continue to pass.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/components/onboarding/onboarding-wizard.tsx frontend-next/src/components/onboarding/onboarding-wizard.stories.tsx
git commit -m "feat(onboarding): add goals wizard component with story tests"
```

---

### Task 4: Frontend — `onboardingComplete` on the User type + `/onboarding` page container

**Files:**
- Modify: `frontend-next/src/types/user.ts` (add field to `User`)
- Create: `frontend-next/src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `OnboardingWizard`, `GoalValues` (Task 3); `fetchApi`, `ApiError` from `@/lib/api`; `useAuthStore` from `@/stores/auth-store`; `useRouter` from `next/navigation`; endpoints `PUT /settings/goals` and `PUT /settings/onboarding-complete` (Task 2).
- Produces: `User.onboardingComplete: boolean`; a protected route at `/onboarding` that renders the wizard, persists goals + the flag, and navigates to `/`.

- [ ] **Step 1: Add the field to the User type**

In `frontend-next/src/types/user.ts`, add to the `User` interface:

```ts
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  xp: number;
  level: number;
  goals: UserGoals;
  reminderTimes: ReminderTimes;
  emailReminders: boolean;
  onboardingComplete: boolean;
}
```

- [ ] **Step 2: Create the page container**

Create `frontend-next/src/app/onboarding/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard, type GoalValues } from "@/components/onboarding/onboarding-wizard";
import { fetchApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function markLocalComplete(goals?: GoalValues) {
    if (!user) return;
    setUser({
      ...user,
      onboardingComplete: true,
      goals: goals ? { ...user.goals, ...goals } : user.goals,
    });
  }

  async function handleFinish(goals: GoalValues) {
    setSaving(true);
    setError(null);
    try {
      await fetchApi("/settings/goals", { method: "PUT", body: JSON.stringify(goals) });
      await fetchApi("/settings/onboarding-complete", { method: "PUT" });
      markLocalComplete(goals);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your goals. Please try again.");
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    setError(null);
    try {
      await fetchApi("/settings/onboarding-complete", { method: "PUT" });
      markLocalComplete();
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <OnboardingWizard onFinish={handleFinish} onSkip={handleSkip} saving={saving} error={error} />
    </main>
  );
}
```

- [ ] **Step 3: Typecheck / lint**

Run from `frontend-next/`:

```bash
npx tsc --noEmit && npm run lint
```

Expected: no type errors and no new lint errors. (In particular, `types/user.ts` now requires `onboardingComplete`; the backend payloads from Task 1 supply it, so `getSession()` typing stays valid.)

- [ ] **Step 4: Manual smoke — reach the wizard and finish**

With both servers running, temporarily visit `http://localhost:3000/onboarding` while logged in. Confirm: the 3 steps render, ± adjusts values, "Finish" navigates to `/`, and (via DevTools Network) `PUT /api/settings/goals` then `PUT /api/settings/onboarding-complete` both return 200. Then confirm "Skip for now" (on a fresh account) calls only `onboarding-complete` and returns to `/`.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/types/user.ts frontend-next/src/app/onboarding/page.tsx
git commit -m "feat(onboarding): add /onboarding route wiring wizard to settings API"
```

---

### Task 5: Frontend — redirect not-yet-onboarded users into the wizard

**Files:**
- Modify: `frontend-next/src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `getSession()` from `@/lib/auth` (returns `User | null`, now including `onboardingComplete` from Task 1 + Task 4); `redirect` from `next/navigation`.
- Produces: server-side gate — any `(dashboard)` route redirects to `/onboarding` when the logged-in user has `onboardingComplete === false`. Because `/onboarding` lives outside the `(dashboard)` group, it is not gated and cannot loop.

- [ ] **Step 1: Add the redirect gate to the dashboard layout**

Edit `frontend-next/src/app/(dashboard)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { HydrateUser } from "@/components/providers/hydrate-user";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (user && !user.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      <HydrateUser user={user} />
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-6 md:px-10 py-8">{children}</main>
      </div>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Manual smoke — new-account flow end to end**

Register a brand-new account, verify the email, and log in. Expected: landing on `/` immediately redirects to `/onboarding`. Complete (or skip) the wizard → you arrive at `/` and stay there. Reload `/` → no redirect back to `/onboarding` (flag is now true server-side).

- [ ] **Step 3: Manual smoke — existing/onboarded account**

Log in with a migrated existing account (Task 2 Step 4). Expected: `/` renders the dashboard directly, no redirect to `/onboarding`.

- [ ] **Step 4: Commit**

```bash
git add "frontend-next/src/app/(dashboard)/layout.tsx"
git commit -m "feat(onboarding): redirect un-onboarded users to the goals wizard"
```

---

## Self-Review

**Spec coverage:**
- Minimal signup unchanged → no task touches the register form. ✅
- `onboardingComplete` field + serialization → Task 1. ✅
- `PUT /settings/onboarding-complete` + migration → Task 2. ✅
- 3-step wizard (sleep/water/exercise, mood dropped), defaults 7/8/4, "Skip for now" on every step, progress dots, Back/Next → Task 3. ✅
- Reuse `PUT /settings/goals` → Task 4 container. ✅
- `/onboarding` full-screen route (root layout, no sidebar) → Task 4. ✅
- Redirect gate (server-side, no loop since `/onboarding` is outside `(dashboard)`) → Task 5. ✅
- Error path does not mark complete; skip path writes no goals → Task 4 `handleFinish`/`handleSkip`. ✅
- Type + store update → Task 4 Step 1 + `markLocalComplete`. ✅
- Testing: backend node one-liner + curl; frontend Storybook `play` → Tasks 1–3. ✅

**Placeholder scan:** No TBD/TODO; every code step contains complete code; every command has expected output.

**Type consistency:** `GoalValues { sleep, exercise, water }` defined in Task 3, consumed identically in Task 4. `OnboardingWizard` prop names (`onFinish`, `onSkip`, `saving`, `error`) match between the story (Task 3), the component (Task 3), and the container (Task 4). `User.onboardingComplete: boolean` defined in Task 4 Step 1, produced by the backend payloads in Task 1, consumed by the gate in Task 5. Endpoint paths (`/settings/goals`, `/settings/onboarding-complete`) match Task 2's route and Task 4's calls.
