# Landing Editorial Redesign & Design Tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give LifeOS a "calm editorial" identity — a rebuilt design-token layer the whole app inherits, plus a redesigned `/welcome` whose motion is CSS-only.

**Architecture:** Four layers, built bottom-up. Tokens (`globals.css`) → Fonts (`lib/fonts.ts`) → Motion primitives (`lib/motion.ts` + `components/motion/`) → Landing (`components/landing/`). Each layer is consumable without reading the ones below it. Tokens land first because the landing would otherwise be written against literals we are about to delete.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, `next/font/google`, Storybook 10 + Vitest browser mode (Playwright/Chromium).

**Spec:** `docs/superpowers/specs/2026-07-17-landing-editorial-redesign-design.md`

## Global Constraints

- **No animation library.** Not GSAP, Framer Motion, Lenis, Three.js, Lottie, or Rive. `package.json` must not gain an animation dependency. All motion is CSS keyframes + IntersectionObserver.
- **This is NOT the Next.js you know.** Per `frontend-next/AGENTS.md`: read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code. APIs may differ from training data.
- **Two token families, never aliased.** Module accents (`--color-module-*`) and status (`--color-success`, `--color-warning`, `--color-destructive`) are separate. Green-for-success and green-for-habits change for unrelated reasons. Never map one to the other.
- **One easing.** `--ease-editorial: cubic-bezier(0.76, 0, 0.24, 1)`. 1.9s in / 1s out. Deviation is a bug.
- **The crossfade appears exactly once per page** — the hero `<h1>` only. Everything else uses the weight-only wipe.
- **`prefers-reduced-motion: reduce` disables every wipe.** Content appears immediately, no animation.
- **Theming is `next-themes` + `.dark` class.** Do not introduce CSS `light-dark()`.
- **Token indirection pattern:** `@theme inline { --color-x: var(--x) }` + `:root { --x: … }` + `.dark { --x: … }`. This is the existing convention in `globals.css` and is what makes dark mode work. Follow it.
- **Stories are tagged `tags: ['ai-generated']`** and import `expect` from `storybook/test`.
- **Vitest test names are the story's *display* name, not its export name.** Storybook title-cases exports, so `CssCheck` becomes `"Css Check"` and `SingleCta` becomes `"Single Cta"`. `-t CssCheck` matches **nothing and skips silently** — a green run that tested zero code. Every command below therefore filters by **file path** first, which cannot silently skip. Verified against the existing suite: `-t "Css Check"` → 1 passed / 40 skipped; by file path → 10 passed.
- **Baseline:** the suite is green before this work starts — 11 files, 41 tests, ~7s.
- All paths below are relative to `frontend-next/` unless stated otherwise.

---

## File Structure

**Created:**
| File | Responsibility |
|---|---|
| `src/lib/fonts.ts` | Single source of truth for `next/font` instances + the combined variable class string. Consumed by both `app/layout.tsx` and `.storybook/preview.tsx`. |
| `src/lib/motion.ts` | `whenSomeInView` — the one shared IntersectionObserver. No React. |
| `src/components/motion/mask-reveal.tsx` | `<MaskReveal>` — weight-only wipe. The workhorse. |
| `src/components/motion/morph-headline.tsx` | `<MorphHeadline>` — hero `<h1>` sans→serif crossfade. |
| `src/components/motion/rotating-word.tsx` | `<RotatingWord>` — hero word rotator. |
| `src/components/motion/horizontal-scroll.tsx` | `<HorizontalScroll>` — snap + drag gallery. |
| `src/components/design-system/tokens.stories.tsx` | Token contract tests (computed-style assertions). |
| `src/components/motion/*.stories.tsx` | Per-primitive behavior tests. |

**Modified:**
| File | Change |
|---|---|
| `src/app/globals.css` | Font tokens, P3 palette, module + status families, motion keyframes. |
| `src/app/layout.tsx` | Consume `lib/fonts.ts`. |
| `.storybook/preview.tsx` | Apply font variables (currently missing — see Task 1). |
| `package.json` | Add `test` script. |
| 18 files carrying color literals | Migrate to tokens (Tasks 3–4). |
| `src/components/landing/*` | Restyle (Tasks 10–13). |

---

## Task 1: Fonts + Storybook font wiring

Fraunces (heading), JetBrains Mono (labels), Inter (body, already present). This task also fixes two latent defects: `--font-mono` points at an undefined `--font-geist-mono`, and Storybook never applies font variables at all (it imports `globals.css` but doesn't render `app/layout.tsx`, where the variables live on `<body>`). Without the Storybook fix, no font work is testable.

**Files:**
- Create: `src/lib/fonts.ts`
- Create: `src/components/design-system/tokens.stories.tsx`
- Modify: `src/app/layout.tsx:1-36`
- Modify: `src/app/globals.css:10-12`
- Modify: `.storybook/preview.tsx:1-34`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `fonts.ts` exports `inter`, `fraunces`, `jetbrainsMono` (NextFont objects) and `fontVariables: string` — a space-joined className string applying `--font-sans`, `--font-heading`, `--font-mono`. Tasks 2+ rely on `fontVariables` being applied in both the app and Storybook.

- [ ] **Step 1: Add the test script**

`package.json` has no `test` script; every later task needs one. In `"scripts"`, after `"lint": "eslint",` add:

```json
    "test": "vitest run --project=storybook",
    "test:watch": "vitest --project=storybook",
```

- [ ] **Step 2: Write the failing test**

Create `src/components/design-system/tokens.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';

/**
 * Token contract tests. These assert the *computed* result of the token layer,
 * so a broken variable chain (a token pointing at something undefined) fails
 * loudly rather than silently falling back.
 */
function TokenSpecimen() {
  return (
    <div>
      <h1 data-testid="token-heading" className="font-heading">Heading</h1>
      <p data-testid="token-body" className="font-sans">Body</p>
      <span data-testid="token-mono" className="font-mono">LABEL</span>
    </div>
  );
}

const meta = {
  component: TokenSpecimen,
  tags: ['ai-generated'],
} satisfies Meta<typeof TokenSpecimen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FontTokens: Story = {
  play: async ({ canvas }) => {
    const heading = canvas.getByTestId('token-heading');
    await expect(getComputedStyle(heading).fontFamily).toMatch(/Fraunces/i);

    const body = canvas.getByTestId('token-body');
    await expect(getComputedStyle(body).fontFamily).toMatch(/Inter/i);

    // Regression guard: --font-mono previously pointed at an undefined
    // --font-geist-mono and silently fell back to the browser default.
    const mono = canvas.getByTestId('token-mono');
    await expect(getComputedStyle(mono).fontFamily).toMatch(/JetBrains/i);
  },
};
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- src/components/design-system/tokens.stories.tsx -t "Font Tokens"`
Expected: FAIL. `font-heading` resolves to Inter (it is aliased to `--font-sans`), and `font-mono` resolves to a default monospace — neither matches.

- [ ] **Step 4: Create the shared font module**

Create `src/lib/fonts.ts`:

```ts
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";

/**
 * Single source of truth for the app's typefaces.
 *
 * Lives here rather than in `app/layout.tsx` so Storybook's preview can apply
 * the identical variables — it never renders the root layout, so importing
 * from one place is what keeps stories honest.
 *
 * `display: 'swap'` and `adjustFontFallback: true` are next/font defaults and
 * are deliberately not restated. See node_modules/next/dist/docs/01-app/
 * 03-api-reference/02-components/font.md.
 */
export const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// `axes` carries the non-weight axes; `wght` is always included and must not
// be listed. opsz drives serif contrast, SOFT the corner rounding, WONK the
// swashes — all three are used by the hero's morph.
export const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

/** Apply to any root that needs the app's font tokens. */
export const fontVariables = `${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`;
```

- [ ] **Step 5: Point the CSS tokens at real fonts**

In `src/app/globals.css`, replace lines 10–12:

```css
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
```

with:

```css
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-heading: var(--font-heading);
```

- [ ] **Step 6: Consume the font module in the root layout**

In `src/app/layout.tsx`, remove the local `Inter` import and instance, and use the shared module. Replace lines 1–7:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/providers/sw-register";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});
```

with:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/providers/sw-register";
```

and replace the `<body>` opening tag:

```tsx
      <body className={`${inter.variable} font-sans antialiased`}>
```

with:

```tsx
      <body className={`${fontVariables} font-sans antialiased`}>
```

- [ ] **Step 7: Apply font variables in Storybook**

In `.storybook/preview.tsx`, import the shared fonts and wrap the decorator so stories get the same variables the app has. Replace the import block and decorator:

```tsx
import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'
import { fontVariables } from '../src/lib/fonts'
import { ThemeProvider } from '../src/components/providers/theme-provider'
import { QueryProvider } from '../src/components/providers/query-provider'
```

```tsx
  // Real provider tree from src/app/layout.tsx so stories render like the app.
  // `fontVariables` mirrors the <body> class there — Storybook never renders
  // the root layout, so without this every story falls back to system fonts.
  decorators: [
    (Story) => (
      <div className={fontVariables}>
        <ThemeProvider>
          <QueryProvider>
            <Story />
          </QueryProvider>
        </ThemeProvider>
      </div>
    ),
  ],
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- src/components/design-system/tokens.stories.tsx -t "Font Tokens"`
Expected: PASS.

- [ ] **Step 9: Verify the existing suite still passes**

Run: `npm test`
Expected: PASS, including `button.stories.tsx`'s `CssCheck`. That story asserts the default Button is `32px` tall and proves the Tailwind pipeline still loads through the new decorator wrapper.

- [ ] **Step 10: Commit**

```bash
git add src/lib/fonts.ts src/app/layout.tsx src/app/globals.css \
        .storybook/preview.tsx package.json \
        src/components/design-system/tokens.stories.tsx
git commit -m "feat(type): add Fraunces + JetBrains Mono, fix broken --font-mono

--font-mono pointed at --font-geist-mono, which was never defined — every
font-mono class silently fell back to the browser default.

Fonts move to src/lib/fonts.ts so .storybook/preview.tsx can apply the same
variables; it never renders app/layout.tsx, so stories previously rendered
with no font tokens at all."
```

---

## Task 2: Color and motion tokens

The P3 "Chalk & Sage" palette, both token families, and the motion keyframes.

**Note on units:** `globals.css` currently uses `oklch` for its greyscale neutrals. The new values are specified as hex because that is the form in which they were reviewed and approved, and hex→oklch conversion would introduce drift that cannot be verified by eye. Mixing the two is valid CSS. Normalizing to `oklch` later is a mechanical follow-up, not part of this plan.

**Files:**
- Modify: `src/app/globals.css:7-52` (`@theme inline`), `:root` (55–84), `.dark` (86–118), keyframes (132–152)
- Modify: `src/components/design-system/tokens.stories.tsx`

**Interfaces:**
- Produces: utilities `bg-module-{mood,sleep,water,habits,fitness}`, `text-module-*`, `border-module-*` (with `/10`-style opacity modifiers); `text-success`, `bg-success`, `text-warning`, `bg-warning`; `ease-editorial`; classes `.animate-mask-in`, `.animate-morph-serif-in`, `.animate-morph-sans-out`. Tasks 3–13 consume these.

- [ ] **Step 1: Write the failing test**

Append to `src/components/design-system/tokens.stories.tsx` (keep the existing `TokenSpecimen` and `FontTokens`):

```tsx
function ColorSpecimen() {
  return (
    <div>
      <div data-testid="ground" className="bg-background">ground</div>
      <div data-testid="mood" className="bg-module-mood">mood</div>
      <div data-testid="sleep" className="bg-module-sleep">sleep</div>
      <div data-testid="water" className="bg-module-water">water</div>
      <div data-testid="habits" className="bg-module-habits">habits</div>
      <div data-testid="fitness" className="bg-module-fitness">fitness</div>
      <div data-testid="success" className="bg-success">success</div>
      <div data-testid="warning" className="bg-warning">warning</div>
    </div>
  );
}

export const ColorTokens: StoryObj<typeof ColorSpecimen> = {
  render: () => <ColorSpecimen />,
  play: async ({ canvas }) => {
    const bg = (id: string) =>
      getComputedStyle(canvas.getByTestId(id)).backgroundColor;

    await expect(bg('ground')).toBe('rgb(247, 248, 246)');   // #f7f8f6
    await expect(bg('mood')).toBe('rgb(141, 132, 179)');     // #8d84b3
    await expect(bg('sleep')).toBe('rgb(95, 135, 166)');     // #5f87a6
    await expect(bg('water')).toBe('rgb(79, 148, 144)');     // #4f9490
    await expect(bg('habits')).toBe('rgb(109, 143, 90)');    // #6d8f5a
    await expect(bg('fitness')).toBe('rgb(184, 112, 63)');   // #b8703f
    await expect(bg('success')).toBe('rgb(74, 124, 89)');    // #4a7c59
    await expect(bg('warning')).toBe('rgb(168, 118, 46)');   // #a8762e
  },
};

/**
 * Guards the "two families, never aliased" constraint: success and habits are
 * both green, and the whole point is that they are *different* greens that
 * change for unrelated reasons. If someone aliases one to the other, this fails.
 */
export const SuccessIsNotHabits: StoryObj<typeof ColorSpecimen> = {
  render: () => <ColorSpecimen />,
  play: async ({ canvas }) => {
    const bg = (id: string) =>
      getComputedStyle(canvas.getByTestId(id)).backgroundColor;
    await expect(bg('success')).not.toBe(bg('habits'));
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/design-system/tokens.stories.tsx -t "Color Tokens"`
Expected: FAIL. `bg-module-mood` and `bg-success` do not exist yet, so `backgroundColor` computes to `rgba(0, 0, 0, 0)`.

- [ ] **Step 3: Register the new token names in `@theme inline`**

In `src/app/globals.css`, inside the existing `@theme inline { … }` block, after the `--color-chart-1: var(--chart-1);` line, add:

```css
  --color-module-mood: var(--module-mood);
  --color-module-sleep: var(--module-sleep);
  --color-module-water: var(--module-water);
  --color-module-habits: var(--module-habits);
  --color-module-fitness: var(--module-fitness);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
```

Then, immediately **after** the closing `}` of the `@theme inline` block, add a
separate non-inline `@theme` block:

```css
/* Non-inline: `@theme inline` does NOT emit the custom property, it only
   inlines the value into generated utilities. The keyframes below reference
   var(--ease-editorial), so the property must actually exist at :root.
   `--ease-*` is a real Tailwind v4 namespace, so this also generates an
   `ease-editorial` utility for one-off transitions. */
@theme {
  --ease-editorial: cubic-bezier(0.76, 0, 0.24, 1);
}
```

- [ ] **Step 4: Set the light-mode values**

In `:root`, replace the neutral palette lines (`--background` through `--ring`) with the P3 values, and append the new families. Replace:

```css
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
```

with:

```css
  --background: #f7f8f6;
  --foreground: #14171a;
  --card: #eef0ed;
  --card-foreground: #14171a;
  --popover: #f7f8f6;
  --popover-foreground: #14171a;
  --primary: #14171a;
  --primary-foreground: #f7f8f6;
  --secondary: #eef0ed;
  --secondary-foreground: #14171a;
  --muted: #eef0ed;
  --muted-foreground: #6a7178;
  --accent: #eef0ed;
  --accent-foreground: #14171a;
  --destructive: oklch(0.577 0.245 27.325);
  --border: #dce0da;
  --input: #dce0da;
  --ring: #6a7178;

  /* Module accents — identity colors for the five trackers. */
  --module-mood: #8d84b3;
  --module-sleep: #5f87a6;
  --module-water: #4f9490;
  --module-habits: #6d8f5a;
  --module-fitness: #b8703f;

  /* Status — a SEPARATE family. Never alias these to a module accent, however
     close the hue. Success is green because green means success; habits is
     green because it was picked to be. They change for unrelated reasons. */
  --success: #4a7c59;
  --success-foreground: #f7f8f6;
  --warning: #a8762e;
  --warning-foreground: #f7f8f6;

  /* Motion durations. Plain :root vars rather than @theme — Tailwind v4 has no
     `--duration-*` theme namespace, so these would generate no utility. */
  --duration-wipe-in: 1.9s;
  --duration-wipe-out: 1s;
```

- [ ] **Step 5: Set the dark-mode values**

In `.dark`, replace the neutral lines (`--background` through `--ring`) and append the families. Replace:

```css
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
```

with:

```css
  --background: #14171a;
  --foreground: #f7f8f6;
  --card: #1b1f22;
  --card-foreground: #f7f8f6;
  --popover: #1b1f22;
  --popover-foreground: #f7f8f6;
  --primary: #f7f8f6;
  --primary-foreground: #14171a;
  --secondary: #2b3033;
  --secondary-foreground: #f7f8f6;
  --muted: #2b3033;
  --muted-foreground: #9aa1a8;
  --accent: #2b3033;
  --accent-foreground: #f7f8f6;
  --destructive: oklch(0.704 0.191 22.216);
  --border: #2b3033;
  --input: #2b3033;
  --ring: #6a7178;

  --module-mood: #a79ecc;
  --module-sleep: #7aa3c2;
  --module-water: #6bb0ac;
  --module-habits: #89ab76;
  --module-fitness: #d18a5c;

  --success: #7aab86;
  --success-foreground: #14171a;
  --warning: #d4a054;
  --warning-foreground: #14171a;
```

- [ ] **Step 6: Add the motion keyframes**

In `src/app/globals.css`, after the existing `@keyframes fade-in { … }` block (around line 147), add:

```css
/* The editorial wipe. A clip-path reveal + a 40px drift + a weight settle,
   all on one easing curve. Ends at `clip-path: none` so descenders and
   overflow aren't clipped once the animation is done. */
@keyframes mask-in {
  0%   { clip-path: polygon(0 0, 0 0, 0 200%, 0 200%);          font-weight: 400; translate: 0; }
  50%  { clip-path: polygon(0 0, 110% 0, 110% 200%, 0 200%);    font-weight: 400; translate: 40px; }
  99%  { clip-path: polygon(0 0, 110% 0, 110% 200%, 0 200%);    font-weight: 300; translate: 0; }
  100% { clip-path: none;                                        font-weight: 300; translate: 0; }
}

/* Hero only. Two stacked copies: the serif wipes in while the sans fades out
   beneath the moving edge, reading as a sans→serif morph. */
@keyframes morph-serif-in {
  0%   { clip-path: polygon(0 0, 0 0, 0 200%, 0 200%);       translate: 0;    opacity: 1; }
  50%  { clip-path: polygon(0 0, 110% 0, 110% 200%, 0 200%); translate: 40px; opacity: 0; }
  75%  { opacity: 1; }
  100% { clip-path: none;                                     translate: 0;    opacity: 1; }
}
@keyframes morph-sans-out {
  0%   { clip-path: polygon(0 0, 0 0, 0 200%, 0 200%);       translate: 0;    opacity: 1; }
  50%  { clip-path: polygon(0 0, 110% 0, 110% 200%, 0 200%); translate: 40px; opacity: 1; }
  75%  { opacity: 0; }
  100% { clip-path: polygon(0 0, 110% 0, 110% 200%, 0 200%); translate: 0;    opacity: 0; }
}
```

and after the existing `.animate-fade-in` line (around 152), add:

```css
.animate-mask-in        { animation: mask-in         var(--duration-wipe-in)  var(--ease-editorial) forwards; }
.animate-morph-serif-in { animation: morph-serif-in  var(--duration-wipe-in)  var(--ease-editorial) forwards; }
.animate-morph-sans-out { animation: morph-sans-out  var(--duration-wipe-in)  var(--ease-editorial) forwards; }
.animate-word-in        { animation: mask-in         var(--duration-wipe-in)  var(--ease-editorial) forwards; }
.animate-word-out       { animation: word-out        var(--duration-wipe-out) var(--ease-editorial) forwards; }

/* Motion is opt-in. Every wipe collapses to "already arrived". */
@media (prefers-reduced-motion: reduce) {
  .animate-mask-in,
  .animate-morph-serif-in,
  .animate-morph-sans-out,
  .animate-word-in,
  .animate-word-out {
    animation: none;
    clip-path: none;
    opacity: 1;
    translate: 0;
  }
}
```

Also add the rotator's exit keyframe alongside the others (the word wipes out to
the right before the next one wipes in — a hard text swap would look cheap in
the middle of an editorial hero):

```css
@keyframes word-out {
  0%   { clip-path: polygon(0 0, 110% 0, 110% 200%, 0 200%);       translate: 0; }
  100% { clip-path: polygon(110% 0, 110% 0, 110% 200%, 110% 200%); translate: 40px; }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test -- src/components/design-system/tokens.stories.tsx -t "Color Tokens|Success Is Not Habits"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/components/design-system/tokens.stories.tsx
git commit -m "feat(tokens): P3 palette, module + status families, editorial motion

Adds --color-module-* (mood/sleep/water/habits/fitness) and a separate
--success/--warning family. The two families are deliberately distinct and
must never be aliased — SuccessIsNotHabits guards that.

Tailwind v4 generates utilities from @theme, so the v3-era 'write every
accent as a literal string' workaround in lib/landing-data.ts is obsolete.
Tasks 3-4 remove it."
```

---

## Task 3: Migrate module accent literals → module tokens

14 files. Mechanical, but **classify every occurrence before replacing it** — this task handles module accents only; the four success sites belong to Task 4.

**Files:**
- Modify: `src/lib/landing-data.ts`, `src/lib/constants.ts`, `src/lib/chart-theme.ts`
- Modify: `src/components/landing/{hero,modules-section,gamification-section}.tsx`
- Modify: `src/components/dashboard/{module-widgets,weekly-challenges}.tsx` (module accents only)
- Modify: `src/components/{mood/mood-history,mood/mood-insights,water/water-tracker,fitness/fitness-stats,habits/habit-heatmap}.tsx`
- Modify: `src/app/(dashboard)/{insights,journal}/page.tsx`

**Interfaces:**
- Consumes: `bg-module-*`, `text-module-*`, `border-module-*` from Task 2.
- Produces: `LandingModule` keeps its existing shape (`iconColor`, `iconBg`, `ring`, `bar` as strings) — only the values change. No consumer signature changes.

**Mapping:**

| literal | token |
|---|---|
| `violet-500` | `module-mood` |
| `sky-500` | `module-sleep` |
| `cyan-500` | `module-water` |
| `emerald-500` *(module context only)* | `module-habits` |
| `orange-500` | `module-fitness` |

- [ ] **Step 1: Write the failing test**

Create `src/components/design-system/module-accents.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { LANDING_MODULES } from '@/lib/landing-data';

function ModuleAccents() {
  return (
    <ul>
      {LANDING_MODULES.map((m) => (
        <li key={m.key} data-testid={`mod-${m.key}`} className={m.bar}>
          {m.label}
        </li>
      ))}
    </ul>
  );
}

const meta = {
  component: ModuleAccents,
  tags: ['ai-generated'],
} satisfies Meta<typeof ModuleAccents>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every module's solid accent must resolve through the token layer. A leftover
 * Tailwind literal still renders a color, so asserting "not transparent" is not
 * enough — we assert the exact token value.
 */
export const AccentsResolveToTokens: Story = {
  play: async ({ canvas }) => {
    const expected: Record<string, string> = {
      mood: 'rgb(141, 132, 179)',
      sleep: 'rgb(95, 135, 166)',
      water: 'rgb(79, 148, 144)',
      habits: 'rgb(109, 143, 90)',
      fitness: 'rgb(184, 112, 63)',
    };
    for (const [key, rgb] of Object.entries(expected)) {
      const el = canvas.getByTestId(`mod-${key}`);
      await expect(getComputedStyle(el).backgroundColor).toBe(rgb);
    }
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/design-system/module-accents.stories.tsx -t "Accents Resolve To Tokens"`
Expected: FAIL — `bg-violet-500` computes to Tailwind's violet, not `rgb(141, 132, 179)`.

- [ ] **Step 3: Migrate `lib/landing-data.ts`**

Replace the accent values on every entry in `LANDING_MODULES`, and **delete the obsolete comment**. Replace the doc block:

```ts
/**
 * Landing modules — the canonical accent-color system for the marketing page.
 * Tailwind can't derive class names from variables, so every accent is written
 * as a full literal string (matching the pattern used on the dashboard and the
 * original welcome hero). Structural accents (tiles, borders) stay at /10–/20;
 * the solid `bar` token is reserved for tiny data-viz marks (meters/sparklines),
 * mirroring the dashboard's colored GoalBar.
 */
```

with:

```ts
/**
 * Landing modules — the canonical accent system for the marketing page.
 * Accents reference the `--color-module-*` tokens in globals.css, so a retune
 * happens in one place. Structural accents (tiles, borders) stay at /10–/20;
 * the solid `bar` token is reserved for tiny data-viz marks (meters/sparklines),
 * mirroring the dashboard's colored GoalBar.
 */
```

Then per module, apply the mapping. For `mood`:

```ts
    iconColor: "text-module-mood",
    iconBg: "bg-module-mood/10",
    ring: "border-module-mood/20",
    bar: "bg-module-mood",
```

Repeat for `sleep` → `module-sleep`, `water` → `module-water`, `habits` → `module-habits`, `fitness` → `module-fitness`, preserving each entry's existing opacity suffixes.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/design-system/module-accents.stories.tsx -t "Accents Resolve To Tokens"`
Expected: PASS.

- [ ] **Step 5: Migrate the remaining 13 files**

Apply the same mapping across `src/lib/constants.ts`, `src/lib/chart-theme.ts`, `src/components/landing/{hero,modules-section,gamification-section}.tsx`, `src/components/dashboard/{module-widgets,weekly-challenges}.tsx`, `src/components/{mood/mood-history,mood/mood-insights,water/water-tracker,fitness/fitness-stats,habits/habit-heatmap}.tsx`, and `src/app/(dashboard)/{insights,journal}/page.tsx`, preserving opacity suffixes (`/10`, `/15`, `/20`, `/8`).

**Do not touch these four occurrences — they are status, not module, and belong to Task 4:**
- `src/components/dashboard/weekly-challenges.tsx:63` — `text-emerald-500` on the completed checkmark.
- `src/components/auth/login-form.tsx:92`, `register-form.tsx:67`, `verify-client.tsx:61`.

`chart-theme.ts` feeds Chart.js, which needs resolved color strings rather than class names. If it holds hex/rgb rather than Tailwind classes, read the token at runtime instead:

```ts
const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const MODULE_CHART_COLORS = {
  mood: cssVar("--module-mood"),
  sleep: cssVar("--module-sleep"),
  water: cssVar("--module-water"),
  habits: cssVar("--module-habits"),
  fitness: cssVar("--module-fitness"),
};
```

Call this inside a client component or effect — never at module scope, where `document` is undefined during SSR.

- [ ] **Step 6: Verify no module literals remain**

Run:
```bash
grep -rnE "(violet|sky|cyan|orange)-[0-9]{3}" src/ ; \
grep -rnE "emerald-[0-9]{3}" src/ | grep -vE "login-form|register-form|verify-client|weekly-challenges"
```
Expected: no output from either. (The second command excludes the four status sites Task 4 owns.)

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "refactor(tokens): migrate module accents to --color-module-*

Replaces 100+ hardcoded Tailwind color literals across 14 files with the
module token family, and drops the stale comment in landing-data.ts that
justified the literals with a Tailwind v3 constraint.

The four emerald occurrences meaning 'success' (auth forms, completed
challenge check) are deliberately untouched — Task 4 maps those to the
status family."
```

---

## Task 4: Migrate status literals → success/warning tokens

The other family: ~24 literals whose meaning is *state*, not *module identity*.

**Files:**
- Modify: `src/components/auth/login-form.tsx:92`
- Modify: `src/components/auth/register-form.tsx:67`
- Modify: `src/components/auth/verify-client.tsx:61`
- Modify: `src/components/dashboard/weekly-challenges.tsx:63`
- Modify: any file still matching the status literal grep in Step 4

**Interfaces:**
- Consumes: `text-success`, `bg-success`, `text-warning`, `bg-warning`, `text-destructive` from Task 2.

**Mapping:**

| literal | token | meaning |
|---|---|---|
| `emerald-*`, `green-*` | `success` | verified, sent, completed |
| `amber-*`, `yellow-*` | `warning` | caution, pending |
| `red-*`, `rose-*` | `destructive` | error, failure (token already exists) |

- [ ] **Step 1: Write the failing test**

Create `src/components/auth/login-form.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { LoginForm } from './login-form';

const meta = {
  component: LoginForm,
  tags: ['ai-generated'],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The "Email verified" banner means success — it must reference the status
 * family, not module-habits, even though both are green. Retuning the habits
 * accent must never repaint this banner.
 */
export const VerifiedBannerUsesSuccessToken: Story = {
  parameters: { nextjs: { navigation: { query: { verified: '1' } } } },
  play: async ({ canvas }) => {
    const banner = await canvas.findByText(/email verified/i);
    const box = banner.closest('div')!;
    // #4a7c59 at 30% on the border.
    await expect(getComputedStyle(box).borderColor).toContain('74, 124, 89');
  },
};
```

**Note:** `login-form.tsx` reads `verified` from the router. If `@storybook/nextjs-vite`'s navigation mock does not drive this component's hook, render the banner markup directly in a local specimen component instead of mounting `LoginForm` — the assertion (that the banner's color resolves to the success token) is what matters, not the mounting strategy. Check `node_modules/@storybook/nextjs-vite` docs before assuming the mock shape.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/auth/login-form.stories.tsx -t "Verified Banner Uses Success Token"`
Expected: FAIL — the border resolves to Tailwind's emerald, not `74, 124, 89`.

- [ ] **Step 3: Migrate the four success sites**

`src/components/auth/login-form.tsx:92` — replace:

```tsx
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
```
with:
```tsx
        <div className="rounded-lg border border-success/30 bg-success/8 px-4 py-3">
```

`src/components/auth/register-form.tsx:67` — replace:

```tsx
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
```
with:
```tsx
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
```

`src/components/auth/verify-client.tsx:61` — apply the same `emerald-500` → `success` substitution, preserving that line's existing opacity suffixes.

`src/components/dashboard/weekly-challenges.tsx:63` — replace:

```tsx
            {c.completed && <CheckmarkCircle02Icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
```
with:
```tsx
            {c.completed && <CheckmarkCircle02Icon className="h-3.5 w-3.5 text-success shrink-0" />}
```

- [ ] **Step 4: Migrate the remaining status literals**

Run:
```bash
grep -rnE "(red|rose|amber|yellow|green)-[0-9]{3}" src/
```

For each hit, classify by **meaning, not hue**, and apply the mapping table. Where a literal is decorative (e.g. an illustration fill) rather than semantic, leave it and note why in the commit body.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/components/auth/login-form.stories.tsx -t "Verified Banner Uses Success Token"`
Expected: PASS.

- [ ] **Step 6: Verify the success criterion**

Run: `grep -rnE "(violet|sky|cyan|emerald|orange)-[0-9]{3}" src/`
Expected: no output. This is the spec's success criterion.

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS, including `SuccessIsNotHabits`.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "refactor(tokens): migrate status colors to --success/--warning

Completes the literal migration. emerald in the auth forms and the completed
challenge check means 'success', not 'the habits module' — they now resolve
through the status family, so retuning a module accent cannot repaint them."
```

---

## Task 5: `whenSomeInView`

The one shared IntersectionObserver. Ported from the technique the reference uses: group elements so a cluster animates in unison, fire once, disconnect.

**Files:**
- Create: `src/lib/motion.ts`
- Create: `src/lib/motion.stories.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface WhenSomeInViewOptions {
    onEnter: (el: Element) => void;
    onLeave?: (el: Element) => void;
    once?: boolean;
    threshold?: number;
  }
  export function whenSomeInView(elements: Element[], options: WhenSomeInViewOptions): () => void;
  export function prefersReducedMotion(): boolean;
  ```
  `whenSomeInView` returns a cleanup function. Tasks 6–9 consume both exports.

- [ ] **Step 1: Write the failing test**

Create `src/lib/motion.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useEffect, useRef, useState } from 'react';
import { whenSomeInView } from './motion';

/**
 * Two elements in one group. Only the second is scrolled into view — both must
 * still fire, because the group enters together. That grouping behavior is the
 * whole point of the helper.
 */
function GroupHarness() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState<string[]>([]);

  useEffect(() => {
    if (!a.current || !b.current) return;
    return whenSomeInView([a.current, b.current], {
      onEnter: (el) => setEntered((p) => [...p, (el as HTMLElement).dataset.name!]),
      once: true,
      threshold: 0.1,
    });
  }, []);

  return (
    <div>
      <div ref={a} data-name="a" data-testid="a">A</div>
      <div ref={b} data-name="b" data-testid="b">B</div>
      <output data-testid="entered">{[...entered].sort().join(',')}</output>
    </div>
  );
}

const meta = {
  component: GroupHarness,
  tags: ['ai-generated'],
} satisfies Meta<typeof GroupHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GroupEntersTogether: Story = {
  play: async ({ canvas }) => {
    await expect
      .poll(() => canvas.getByTestId('entered').textContent, { timeout: 2000 })
      .toBe('a,b');
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/motion.stories.tsx -t "Group Enters Together"`
Expected: FAIL — `src/lib/motion.ts` does not exist; the import cannot resolve.

- [ ] **Step 3: Write the implementation**

Create `src/lib/motion.ts`:

```ts
/**
 * Shared scroll-triggered motion primitives. No dependencies, no React — the
 * whole in-view system is one IntersectionObserver per group.
 *
 * The grouping is the important part: passing several elements means they
 * animate *in unison* the moment any one of them is in view, rather than
 * trickling in individually as each crosses the threshold.
 */

export interface WhenSomeInViewOptions {
  onEnter: (el: Element) => void;
  onLeave?: (el: Element) => void;
  /** Disconnect after the first enter. Default false. */
  once?: boolean;
  /** Fraction of the element that must be visible. Default 0.7. */
  threshold?: number;
}

/** True when the user has asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Calls `onEnter` for every element in the group once *any* of them is in
 * view, and `onLeave` once none are. Returns a cleanup function.
 */
export function whenSomeInView(
  elements: Element[],
  { onEnter, onLeave, once = false, threshold = 0.7 }: WhenSomeInViewOptions
): () => void {
  if (elements.length === 0) return () => {};

  const inViewByEl = new Map<Element, boolean>(elements.map((el) => [el, false]));
  let wasIntersecting = false;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inViewByEl.set(entry.target, entry.isIntersecting);
      }
      const someIntersecting = [...inViewByEl.values()].some(Boolean);

      // Only act on transitions, not on every scroll tick.
      if (wasIntersecting === someIntersecting) return;
      wasIntersecting = someIntersecting;

      const handler = someIntersecting ? onEnter : onLeave;
      if (!handler) return;
      for (const el of elements) handler(el);
      if (someIntersecting && once) observer.disconnect();
    },
    { threshold }
  );

  for (const el of elements) observer.observe(el);
  return () => observer.disconnect();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/motion.stories.tsx -t "Group Enters Together"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion.ts src/lib/motion.stories.tsx
git commit -m "feat(motion): add whenSomeInView, the shared in-view trigger

One IntersectionObserver per group. Elements in a group animate in unison the
moment any one is in view, rather than trickling in individually. ~40 lines,
no dependencies — this is the whole scroll-trigger system."
```

---

## Task 6: `<MaskReveal>` and the `Reveal` refactor

The workhorse wipe, plus folding the existing `Reveal` onto the shared helper so there is one in-view code path.

**Files:**
- Create: `src/components/motion/mask-reveal.tsx`
- Create: `src/components/motion/mask-reveal.stories.tsx`
- Modify: `src/components/landing/reveal.tsx`

**Interfaces:**
- Consumes: `whenSomeInView`, `prefersReducedMotion` from `@/lib/motion`; `.animate-mask-in` from Task 2.
- Produces: `MaskReveal({ children, className?, group?, delay? })` — a client component rendering a `<div>`. `group` opts several instances into one synchronized cluster; `delay` is a stagger in ms.

- [ ] **Step 1: Write the failing test**

Create `src/components/motion/mask-reveal.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { MaskReveal } from './mask-reveal';

const meta = {
  component: MaskReveal,
  tags: ['ai-generated'],
} satisfies Meta<typeof MaskReveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RevealsOnEnter: Story = {
  args: { children: 'A better way to take care of yourself.' },
  play: async ({ canvas }) => {
    const el = canvas.getByText(/a better way/i);
    await expect.poll(() => el.className, { timeout: 2000 }).toContain('animate-mask-in');
  },
};

/**
 * Before entering, content must be hidden — otherwise it flashes at full
 * opacity for a frame and then wipes in, which looks broken.
 */
export const HiddenBeforeEnter: Story = {
  args: { children: 'Hidden' },
  play: async ({ canvas }) => {
    const el = canvas.getByText('Hidden');
    await expect(el).toBeInTheDocument();
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/motion/mask-reveal.stories.tsx -t "Reveals On Enter"`
Expected: FAIL — `mask-reveal.tsx` does not exist.

- [ ] **Step 3: Write the implementation**

Create `src/components/motion/mask-reveal.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, whenSomeInView } from "@/lib/motion";

type RevealState = "hidden" | "in" | "instant";

/** Registry of group name → elements, so a cluster can animate in unison. */
const groups = new Map<string, Set<Element>>();

/**
 * MaskReveal — wipes its children in the first time they enter the viewport:
 * a clip-path reveal, a 40px drift, and a weight settle, all on the shared
 * editorial easing.
 *
 * Safe to render from a Server Component: only this wrapper is a client
 * component, and children can be server-rendered and passed through.
 *
 * Users who prefer reduced motion get the content immediately, unanimated.
 */
export function MaskReveal({
  children,
  className,
  group,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Instances sharing a group name animate together. */
  group?: string;
  /** Stagger delay in ms. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("hidden");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      const id = requestAnimationFrame(() => setState("instant"));
      return () => cancelAnimationFrame(id);
    }

    // Collect same-group siblings mounted this tick, so the observer sees the
    // whole cluster rather than one element at a time.
    let members: Element[] = [el];
    if (group) {
      const set = groups.get(group) ?? new Set<Element>();
      set.add(el);
      groups.set(group, set);
      members = [...set];
    }

    const cleanup = whenSomeInView(members, {
      onEnter: () => setState("in"),
      once: true,
      threshold: 0.7,
    });

    return () => {
      cleanup();
      if (group) groups.get(group)?.delete(el);
    };
  }, [group]);

  return (
    <div
      ref={ref}
      className={cn(
        state === "hidden" && "opacity-0",
        state === "in" && "animate-mask-in",
        className
      )}
      style={state === "in" && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/motion/mask-reveal.stories.tsx -t "Reveals On Enter|Hidden Before Enter"`
Expected: PASS.

- [ ] **Step 5: Fold `Reveal` onto the shared helper**

`src/components/landing/reveal.tsx` currently owns its own IntersectionObserver. Replace its `useEffect` body so it delegates, **keeping its reduced-motion guard and its `animate-fade-in-up` visual** (its callers still expect a fade, not a wipe):

```tsx
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      const id = requestAnimationFrame(() => setState("instant"));
      return () => cancelAnimationFrame(id);
    }

    return whenSomeInView([el], {
      onEnter: () => setState("in"),
      once: true,
      threshold: 0.15,
    });
  }, []);
```

and add to its imports:

```tsx
import { prefersReducedMotion, whenSomeInView } from "@/lib/motion";
```

removing the now-unused `useState`/`useRef` imports only if they are genuinely unused.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/motion/ src/components/landing/reveal.tsx
git commit -m "feat(motion): add MaskReveal, fold Reveal onto whenSomeInView

MaskReveal is the workhorse wipe for headings and blocks. Reveal keeps its
fade visual and reduced-motion guard but now delegates to the shared
observer, so there is one in-view code path rather than two."
```

---

## Task 7: `<MorphHeadline>`

The hero `<h1>`. Two stacked copies — sans fading out under the wipe as the serif wipes in. Used **exactly once per page**.

**Files:**
- Create: `src/components/motion/morph-headline.tsx`
- Create: `src/components/motion/morph-headline.stories.tsx`

**Interfaces:**
- Consumes: `prefersReducedMotion` from `@/lib/motion`; `.animate-morph-serif-in`, `.animate-morph-sans-out` from Task 2.
- Produces: `<MorphHeadline text={string} className? />` — renders an `<h1>`.

- [ ] **Step 1: Write the failing test**

Create `src/components/motion/morph-headline.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { MorphHeadline } from './morph-headline';

const meta = {
  component: MorphHeadline,
  tags: ['ai-generated'],
} satisfies Meta<typeof MorphHeadline>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The headline text exists twice in the DOM. Screen readers must hear it once:
 * the sans copy is decorative and must be aria-hidden. This is the whole
 * accessibility cost of the crossfade and the thing most likely to regress.
 */
export const AnnouncedOnce: Story = {
  args: { text: 'A better way to take care of yourself.' },
  play: async ({ canvas }) => {
    const headings = canvas.getAllByRole('heading', { name: /a better way to take care of yourself/i });
    await expect(headings).toHaveLength(1);
  },
};

export const RendersBothLayers: Story = {
  args: { text: 'A better way to take care of yourself.' },
  play: async ({ canvas }) => {
    const h1 = canvas.getByRole('heading');
    await expect(h1.querySelectorAll('[data-morph-layer]')).toHaveLength(2);
    await expect(h1.querySelector('[data-morph-layer="sans"]')).toHaveAttribute('aria-hidden', 'true');
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/motion/morph-headline.stories.tsx -t "Announced Once"`
Expected: FAIL — `morph-headline.tsx` does not exist.

- [ ] **Step 3: Write the implementation**

Create `src/components/motion/morph-headline.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * MorphHeadline — the page's one signature move.
 *
 * The reference site morphs sans→serif using a custom `SERF` axis in a
 * commissioned typeface. No free font has such an axis (see the spec's
 * Appendix B), so we stack a sans copy over a serif one and crossfade between
 * them beneath the moving wipe. The eye cannot track letterforms mid-wipe, so
 * it reads as a morph.
 *
 * Use this ONCE per page. It duplicates its text in the DOM and gates on two
 * fonts loading; it does not scale to every heading. Everything else uses
 * <MaskReveal>.
 */
type MorphState = "waiting" | "play" | "instant";

export function MorphHeadline({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  // Starts "waiting" on both server and client. Reduced-motion and font
  // readiness are decided in an effect, never during render — reading
  // matchMedia at render time would hydrate-mismatch on this, the page's most
  // important element.
  const [state, setState] = useState<MorphState>("waiting");

  useEffect(() => {
    if (prefersReducedMotion()) {
      setState("instant");
      return;
    }

    let cancelled = false;
    // Gate on fonts: starting the crossfade before Fraunces is ready would
    // morph from sans to *fallback serif*, then pop. This is a timing concern,
    // not a CLS one — next/font's adjustFontFallback already handles CLS.
    document.fonts.ready.then(() => {
      if (!cancelled) setState("play");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const play = state === "play";

  return (
    <h1
      ref={ref}
      className={cn(
        "relative inline-block font-heading",
        state === "waiting" && "opacity-0",
        className
      )}
    >
      {/* Serif — the resting state, and what is announced. */}
      <span
        data-morph-layer="serif"
        className={cn("block", play && "animate-morph-serif-in")}
      >
        {text}
      </span>
      {/* Sans — decorative; fades out beneath the wipe. */}
      <span
        data-morph-layer="sans"
        aria-hidden="true"
        className={cn(
          "absolute inset-0 block font-sans",
          play ? "animate-morph-sans-out" : "opacity-0"
        )}
      >
        {text}
      </span>
    </h1>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/components/motion/morph-headline.stories.tsx -t "Announced Once|Renders Both Layers"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/morph-headline.tsx src/components/motion/morph-headline.stories.tsx
git commit -m "feat(motion): add MorphHeadline, the hero sans->serif crossfade

Reproduces the reference's signature morph without its commissioned variable
font: two stacked copies crossfading under the wipe. The sans layer is
aria-hidden so the duplicated text is announced once.

Gates on document.fonts.ready — starting before Fraunces loads would morph to
a fallback serif and then pop."
```

---

## Task 8: `<RotatingWord>`

The hero rotator: *"take care of yourself / your sleep / your mood / your habits."* Pauses when out of view.

**Files:**
- Create: `src/components/motion/rotating-word.tsx`
- Create: `src/components/motion/rotating-word.stories.tsx`

**Interfaces:**
- Consumes: `whenSomeInView`, `prefersReducedMotion` from `@/lib/motion`.
- Produces: `<RotatingWord words={string[]} interval? className? />`.

- [ ] **Step 1: Write the failing test**

Create `src/components/motion/rotating-word.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { RotatingWord } from './rotating-word';

const meta = {
  component: RotatingWord,
  tags: ['ai-generated'],
} satisfies Meta<typeof RotatingWord>;

export default meta;
type Story = StoryObj<typeof meta>;

// `interval` must exceed the 1s wipe-out, or the swap timers stack. 1400 is the
// shortest value that respects that while keeping the test quick.
export const Rotates: Story = {
  args: { words: ['yourself', 'your sleep', 'your mood'], interval: 1400 },
  play: async ({ canvas }) => {
    await expect
      .poll(() => canvas.getByTestId('rotating-current').textContent, { timeout: 5000 })
      .toBe('your sleep');
  },
};

/**
 * The rotator swaps text on a timer. Screen readers must not be spammed with
 * every change, and the full phrase must remain readable.
 */
export const HasAccessibleLabel: Story = {
  args: { words: ['yourself', 'your sleep'] },
  play: async ({ canvas }) => {
    const root = canvas.getByTestId('rotating-root');
    await expect(root).toHaveAttribute('aria-label', 'yourself');
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/motion/rotating-word.stories.tsx -t "Rotates"`
Expected: FAIL — `rotating-word.tsx` does not exist.

- [ ] **Step 3: Write the implementation**

Create `src/components/motion/rotating-word.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, whenSomeInView } from "@/lib/motion";

/**
 * RotatingWord — cycles a word in place. Stops while off-screen so a page
 * left open in a background tab isn't animating forever.
 *
 * Accessibility: the live text is aria-hidden and the root carries a static
 * aria-label of the first word, so assistive tech reads one stable phrase
 * rather than an endlessly-changing one.
 */
export function RotatingWord({
  words,
  interval = 4000,
  className,
}: {
  words: string[];
  /** ms between swaps. Must be greater than WIPE_OUT_MS or the timers stack. */
  interval?: number;
  className?: string;
}) {
  if (process.env.NODE_ENV !== "production" && interval <= WIPE_OUT_MS) {
    console.warn(
      `[RotatingWord] interval (${interval}ms) must exceed the ${WIPE_OUT_MS}ms wipe-out, ` +
        `or a new rotation starts before the previous swap lands.`
    );
  }

  const ref = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const el = ref.current;
    if (!el || words.length < 2 || prefersReducedMotion()) return;

    let cycle: ReturnType<typeof setInterval> | null = null;
    let swap: ReturnType<typeof setTimeout> | null = null;

    const start = () => {
      if (cycle) return;
      cycle = setInterval(() => {
        // Wipe the current word out, swap the text at the end of that wipe,
        // then wipe the next one in. A hard swap would read as a glitch.
        setPhase("out");
        swap = setTimeout(() => {
          setIndex((i) => (i + 1) % words.length);
          setPhase("in");
        }, WIPE_OUT_MS);
      }, interval);
    };

    const stop = () => {
      if (cycle) clearInterval(cycle);
      if (swap) clearTimeout(swap);
      cycle = null;
      swap = null;
    };

    const cleanup = whenSomeInView([el], {
      onEnter: start,
      onLeave: stop,
      threshold: 0.5,
    });

    return () => {
      stop();
      cleanup();
    };
  }, [words, interval]);

  return (
    <span
      ref={ref}
      data-testid="rotating-root"
      aria-label={words[0]}
      className={cn("relative inline-block", className)}
    >
      <span
        key={index}
        data-testid="rotating-current"
        aria-hidden="true"
        className={cn("block", phase === "in" ? "animate-word-in" : "animate-word-out")}
      >
        {words[index]}
      </span>
    </span>
  );
}
```

Add the constant above the component, and keep it in step with
`--duration-wipe-out` in `globals.css`:

```ts
/** Must match --duration-wipe-out in globals.css (1s). */
const WIPE_OUT_MS = 1000;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/components/motion/rotating-word.stories.tsx -t "Rotates|Has Accessible Label"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/rotating-word.tsx src/components/motion/rotating-word.stories.tsx
git commit -m "feat(motion): add RotatingWord for the hero

Cycles a word in place, pausing while off-screen. The live text is
aria-hidden behind a static aria-label so assistive tech reads one stable
phrase instead of a changing one."
```

---

## Task 9: `<HorizontalScroll>`

Native `overflow-x` + scroll-snap + drag-to-scroll, for the modules gallery.

**Files:**
- Create: `src/components/motion/horizontal-scroll.tsx`
- Create: `src/components/motion/horizontal-scroll.stories.tsx`

**Interfaces:**
- Produces: `<HorizontalScroll className?>{children}</HorizontalScroll>`.

- [ ] **Step 1: Write the failing test**

Create `src/components/motion/horizontal-scroll.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { HorizontalScroll } from './horizontal-scroll';

const meta = {
  component: HorizontalScroll,
  tags: ['ai-generated'],
} satisfies Meta<typeof HorizontalScroll>;

export default meta;
type Story = StoryObj<typeof meta>;

const cards = Array.from({ length: 6 }, (_, i) => (
  <div key={i} style={{ minWidth: 300, height: 120 }}>Card {i}</div>
));

export const ScrollsAndSnaps: Story = {
  args: { children: cards },
  play: async ({ canvas }) => {
    const track = canvas.getByTestId('hscroll-track');
    await expect(track.scrollWidth).toBeGreaterThan(track.clientWidth);
    await expect(track.className).toContain('snap-x');
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/motion/horizontal-scroll.stories.tsx -t "Scrolls And Snaps"`
Expected: FAIL — `horizontal-scroll.tsx` does not exist.

- [ ] **Step 3: Write the implementation**

Create `src/components/motion/horizontal-scroll.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Movement past this many px counts as a drag, not a click. */
const DRAG_THRESHOLD = 5;

/**
 * HorizontalScroll — a draggable, snapping gallery built on native scrolling.
 * No carousel library: the browser already does momentum, keyboard, and
 * touch correctly.
 *
 * Two details make drag feel right, both borrowed from the reference:
 * snap is disabled mid-drag (otherwise it fights the pointer), and a drag
 * past DRAG_THRESHOLD swallows the click so releasing over a link doesn't
 * navigate.
 */
export function HorizontalScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; initialScrollLeft: number; walk: number } | null>(null);

  useEffect(() => {
    const track = ref.current;
    if (!track) return;

    const onPointerDown = (e: PointerEvent) => {
      drag.current = {
        startX: e.pageX - track.offsetLeft,
        initialScrollLeft: track.scrollLeft,
        walk: 0,
      };
      track.classList.remove("snap-x", "snap-mandatory");
    };

    const onPointerMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      e.preventDefault();
      d.walk = e.pageX - track.offsetLeft - d.startX;
      track.scrollLeft = d.initialScrollLeft - d.walk;
      track.classList.toggle("cursor-grabbing", Math.abs(d.walk) > DRAG_THRESHOLD);
    };

    const onPointerUp = () => {
      if (!drag.current) return;
      track.classList.add("snap-x", "snap-mandatory");
      track.classList.remove("cursor-grabbing");
      // Keep the drag record alive one frame past pointerup: `click` fires
      // before the next rAF, so the handler below can still read `walk` and
      // decide whether to swallow it.
      requestAnimationFrame(() => {
        drag.current = null;
      });
    };

    const onClick = (e: MouseEvent) => {
      if (drag.current && Math.abs(drag.current.walk) > DRAG_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onDragStart = (e: Event) => e.preventDefault();

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointerleave", onPointerUp);
    track.addEventListener("click", onClick);
    track.addEventListener("dragstart", onDragStart);

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointerleave", onPointerUp);
      track.removeEventListener("click", onClick);
      track.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-testid="hscroll-track"
      className={cn(
        "flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/motion/horizontal-scroll.stories.tsx -t "Scrolls And Snaps"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/horizontal-scroll.tsx src/components/motion/horizontal-scroll.stories.tsx
git commit -m "feat(motion): add HorizontalScroll gallery

Native overflow-x + scroll-snap + drag. No carousel library — the browser
already handles momentum, keyboard, and touch. Snap disables mid-drag, and a
drag past 5px swallows the click so releasing over a link doesn't navigate."
```

---

## Task 10: Editorial `Section` / `SectionHeading`

Left-aligned headers, mono eyebrows, wider measure for display type.

**Files:**
- Modify: `src/components/landing/section.tsx`

**Interfaces:**
- Consumes: `<MaskReveal>` (Task 6), `font-heading`/`font-mono` (Task 1).
- Produces: `SectionHeading` keeps its props (`eyebrow`, `title`, `subtitle`, `align`, `className`) but `align` now defaults to `"start"`.

- [ ] **Step 1: Write the failing test**

Create `src/components/landing/section.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { SectionHeading } from './section';

const meta = {
  component: SectionHeading,
  tags: ['ai-generated'],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditorialHeading: Story = {
  args: { eyebrow: 'Modules', title: 'Everything in one place' },
  play: async ({ canvas }) => {
    const title = canvas.getByRole('heading', { name: /everything in one place/i });
    await expect(getComputedStyle(title).fontFamily).toMatch(/Fraunces/i);

    const eyebrow = canvas.getByText('Modules');
    await expect(getComputedStyle(eyebrow).fontFamily).toMatch(/JetBrains/i);
    await expect(getComputedStyle(eyebrow).textTransform).toBe('uppercase');
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/landing/section.stories.tsx -t "Editorial Heading"`
Expected: FAIL — the heading renders in Inter (`font-heading` was aliased to sans until Task 1, and the `h2` carries no `font-heading` class), and the eyebrow is not mono.

- [ ] **Step 3: Write the implementation**

In `src/components/landing/section.tsx`, swap `Reveal` for `MaskReveal` and restyle. Replace the import:

```tsx
import { Reveal } from "./reveal";
```
with:
```tsx
import { MaskReveal } from "@/components/motion/mask-reveal";
```

Widen the container — replace:

```tsx
      <div className="mx-auto w-full max-w-6xl px-6 md:px-16">{children}</div>
```
with:
```tsx
      <div className="mx-auto w-full max-w-7xl px-6 md:px-16">{children}</div>
```

Replace the whole `SectionHeading` body:

```tsx
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <MaskReveal
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-4xl font-light leading-[1.02] tracking-[-0.03em] md:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </MaskReveal>
  );
}
```

Update the doc comment above it — it says "Centered by default", which is now wrong:

```tsx
/**
 * SectionHeading — canonical eyebrow / title / subtitle stack. Wipes in on
 * scroll. Left-aligned by default; pass align="center" for the rare centered
 * header.
 */
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/landing/section.stories.tsx -t "Editorial Heading"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/section.tsx src/components/landing/section.stories.tsx
git commit -m "feat(landing): editorial Section headings

Left-aligned by default, Fraunces titles, uppercase mono eyebrows, wider
measure for display type. Centered headings read as startup-template;
editorial pages left-align."
```

---

## Task 11: Rebuild the hero

Single CTA, `MorphHeadline` + `RotatingWord`, badge constellation removed.

**Files:**
- Modify: `src/components/landing/hero.tsx` (full rewrite)
- Create: `src/components/landing/hero.stories.tsx`

**Interfaces:**
- Consumes: `<MorphHeadline>` (Task 7), `<RotatingWord>` (Task 8).

- [ ] **Step 1: Write the failing test**

Create `src/components/landing/hero.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Hero } from './hero';

const meta = {
  component: Hero,
  tags: ['ai-generated'],
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The hero is a marketing surface, not a signup form. Exactly one call to
 * action; the three auth methods live on /register.
 */
export const SingleCta: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /create an account/i })).toBeVisible();
    await expect(canvas.queryByText(/continue with phone/i)).toBeNull();
    await expect(canvas.queryByText(/google/i)).toBeNull();
  },
};

export const HeadlineAnnouncedOnce: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/landing/hero.stories.tsx -t "Single Cta"`
Expected: FAIL — the current hero renders `GoogleLogin` and a "Continue with phone" button.

- [ ] **Step 3: Write the implementation**

Replace `src/components/landing/hero.tsx` entirely:

```tsx
import Link from "next/link";
import { ArrowRight01Icon, ArrowDown01Icon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { MorphHeadline } from "@/components/motion/morph-headline";
import { RotatingWord } from "@/components/motion/rotating-word";

/**
 * Hero — the opening section of the /welcome marketing page.
 *
 * Deliberately a marketing surface rather than a signup form: one CTA to
 * /register, which owns the three auth methods. The previous version embedded
 * all three here, which left no room for the page to breathe.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden pt-28 pb-20 md:pt-32">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-16">
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          LifeOS · Daily wellness
        </p>

        <MorphHeadline
          text="A better way to take care of yourself."
          className="max-w-4xl text-5xl font-light leading-none tracking-[-0.035em] md:text-7xl lg:text-8xl"
        />

        <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
          Habits, mood, sleep, hydration, fitness, and insights — organized in
          one place. Quietly keeping track of{" "}
          <RotatingWord
            words={["yourself", "your sleep", "your mood", "your habits"]}
            className="text-foreground"
          />
          .
        </p>

        <div className="mt-12">
          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            className="h-11 rounded-full px-7 font-mono text-[10px] uppercase tracking-widest"
          >
            Create an account
            <ArrowRight01Icon className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Free to use. No credit card needed.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex">
        <ArrowDown01Icon className="h-5 w-5 animate-bounce text-muted-foreground" />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/components/landing/hero.stories.tsx -t "Single Cta|Headline Announced Once"`
Expected: PASS.

- [ ] **Step 5: Verify in the real app**

Run: `npm run dev`, open `http://localhost:3000/welcome`, and confirm: the headline wipes in with a visible sans→serif change, the rotating word cycles, and there is one CTA. Then set "Reduce motion" in your OS accessibility settings, reload, and confirm the headline appears instantly with no wipe.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/hero.tsx src/components/landing/hero.stories.tsx
git commit -m "feat(landing): rebuild hero as an editorial surface

One CTA to /register (which already owns email/Google/phone) instead of three
inline auth entry points. Drops the floating module badge constellation — it
was the most 'app dashboard' element on the page and the main thing stopping
the hero reading as editorial."
```

---

## Task 12: Modules gallery

**Files:**
- Modify: `src/components/landing/modules-section.tsx`

**Interfaces:**
- Consumes: `<HorizontalScroll>` (Task 9), `LANDING_MODULES` (Task 3).

- [ ] **Step 1: Write the failing test**

Create `src/components/landing/modules-section.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { ModulesSection } from './modules-section';
import { LANDING_MODULES } from '@/lib/landing-data';

const meta = {
  component: ModulesSection,
  tags: ['ai-generated'],
} satisfies Meta<typeof ModulesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GalleryRendersEveryModule: Story = {
  play: async ({ canvas }) => {
    const track = canvas.getByTestId('hscroll-track');
    await expect(track).toBeVisible();
    for (const m of LANDING_MODULES) {
      await expect(canvas.getByText(m.label)).toBeVisible();
    }
  },
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/landing/modules-section.stories.tsx -t "Gallery Renders Every Module"`
Expected: FAIL — the section renders a grid; there is no `hscroll-track`.

- [ ] **Step 3: Write the implementation**

Rework `src/components/landing/modules-section.tsx` so the module cards render inside `<HorizontalScroll>`. Add the import:

```tsx
import { HorizontalScroll } from "@/components/motion/horizontal-scroll";
```

Replace the grid wrapper around the module cards with:

```tsx
      <HorizontalScroll className="mt-14 -mx-6 px-6 md:-mx-16 md:px-16">
        {LANDING_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.key}
              href={mod.href}
              className={cn(
                "group snap-start shrink-0 basis-75 rounded-2xl border p-7",
                "transition-colors hover:bg-card",
                mod.ring
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", mod.iconBg)}>
                <Icon className={cn("h-5 w-5", mod.iconColor)} />
              </div>
              <h3 className="mt-6 font-heading text-2xl font-light tracking-[-0.02em]">
                {mod.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {mod.blurb}
              </p>
            </Link>
          );
        })}
      </HorizontalScroll>
```

Keep the section's existing `SectionHeading` above it. Ensure `cn` and `Link` are imported.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/components/landing/modules-section.stories.tsx -t "Gallery Renders Every Module"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/modules-section.tsx src/components/landing/modules-section.stories.tsx
git commit -m "feat(landing): modules as a draggable snap gallery"
```

---

## Task 13: Restyle remaining sections, nav, footer

`how-it-works`, `insights-section`, `gamification-section`, `final-cta`, `landing-nav`, `landing-footer`.

**Files:**
- Modify: `src/components/landing/{how-it-works,insights-section,gamification-section,final-cta,landing-nav,landing-footer}.tsx`

**Interfaces:**
- Consumes: `<MaskReveal>`, `font-heading`, `font-mono`, module/status tokens.

- [ ] **Step 1: Add the shared editorial classes**

Three class strings repeat across every section. Define them once rather than
retyping them six times — append to `src/app/globals.css` after the
`.animate-*` block:

```css
/* Editorial type roles. Used across the landing sections; defined once so the
   voice stays consistent and a change lands everywhere. */
@layer components {
  .label-mono {
    @apply font-mono text-[10px] uppercase tracking-widest text-muted-foreground;
  }
  .display-heading {
    @apply font-heading font-light tracking-[-0.02em];
  }
  .pill-cta {
    @apply rounded-full font-mono text-[10px] uppercase tracking-widest;
  }
}
```

- [ ] **Step 2: Apply the editorial pass**

For each of `how-it-works`, `insights-section`, `gamification-section`,
`final-cta`, `landing-footer`:

1. Swap the import `import { Reveal } from "./reveal";` for
   `import { MaskReveal } from "@/components/motion/mask-reveal";` and rename
   every `<Reveal>` usage to `<MaskReveal>`.
2. Apply `display-heading` to every `h2`/`h3` that is display-scale.
3. Apply `label-mono` to every eyebrow, caption, and small label.
4. Where a section is a list of rows (`how-it-works` steps,
   `landing-footer` link columns), replace boxed-card borders with hairline
   rules: `border border-border rounded-xl p-6` → `border-t border-border pt-8`.

Example — a `how-it-works` step before:

```tsx
      <Reveal className="rounded-xl border border-border p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Step 1</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">Track what matters</h3>
      </Reveal>
```

after:

```tsx
      <MaskReveal className="border-t border-border pt-8">
        <p className="label-mono">Step 1</p>
        <h3 className="display-heading mt-3 text-3xl">Track what matters</h3>
      </MaskReveal>
```

- [ ] **Step 3: Restyle the nav CTA**

In `src/components/landing/landing-nav.tsx`, keep the sticky/scroll behavior,
`ThemeToggle`, and links exactly as they are — only the CTA changes. Replace:

```tsx
          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            size="sm"
          >
            Get started
          </Button>
```

with:

```tsx
          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            size="sm"
            className="pill-cta"
          >
            Get started
          </Button>
```

and give the "Sign in" ghost button the same voice by adding `className="pill-cta"` to it.

- [ ] **Step 4: Verify nothing regressed**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Verify in the real app**

Run: `npm run dev` and scroll `http://localhost:3000/welcome` end to end. Every section should wipe in on the same easing; nothing should fade with the old `ease-out` curve.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/
git commit -m "feat(landing): editorial pass on remaining sections, nav, footer"
```

---

## Task 14: Move `/welcome` out of the auth group

It is a marketing page now, not a form.

**Files:**
- Delete: `src/app/(auth)/welcome/page.tsx`
- Create: `src/app/welcome/page.tsx`

- [ ] **Step 1: Check the route group's layout**

Read `src/app/(auth)/layout.tsx`. If it centers content in a narrow card (typical for auth), the landing page is currently fighting it, and moving out is what lets the hero go full-bleed. Note what the landing loses by leaving — if that layout provided anything the landing needs, carry it into the new route.

- [ ] **Step 2: Move the page**

```bash
mkdir -p src/app/welcome
git mv "src/app/(auth)/welcome/page.tsx" src/app/welcome/page.tsx
```

The file's contents need no change — its imports are all `@/`-absolute.

- [ ] **Step 3: Verify every `/welcome` link still resolves**

Run: `grep -rn '"/welcome"' src/`
Expected: hits in `landing-nav.tsx` and any redirect targets. The URL is unchanged (`/welcome` either way), so these keep working — confirm there is no import of the page module by path.

- [ ] **Step 4: Verify the route builds and renders**

Run: `npm run build`
Expected: build succeeds and lists `/welcome` as a route.

Then `npm run dev` and load `http://localhost:3000/welcome` — the hero should now be full-bleed rather than constrained by the auth layout.

- [ ] **Step 5: Commit**

```bash
git add -A src/app
git commit -m "refactor(routing): move /welcome out of the (auth) group

It's a marketing page, not a form — the auth layout was constraining it. URL
is unchanged."
```

---

## Final verification

- [ ] **Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Verify the spec's success criteria**

```bash
# No animation library.
grep -nE '"(gsap|framer-motion|motion|lenis|three|lottie-web|@lottiefiles/|@rive-app/)' package.json
# Expected: no output.

# No color literals.
grep -rnE "(violet|sky|cyan|emerald|orange)-[0-9]{3}" src/
# Expected: no output.

# Lint clean.
npm run lint
```

- [ ] **Verify reduced motion**

Enable "Reduce motion" in OS accessibility settings, reload `/welcome`, and confirm every section's content is visible immediately with no wipe and no layout jump.

- [ ] **Verify the chart-legibility risk (the spec's highest-probability failure)**

Load `/insights` and `/` in both light and dark. Confirm the five module accents remain mutually distinguishable in the charts and the widget row. If any two converge, adjust the **lightness spread** of `--module-*` in `globals.css` rather than adding saturation, and re-run `npm test` — `ColorTokens` asserts exact values and will need updating to match.

---

## Notes for the implementer

**Do not add an animation library.** If a wipe seems to need one, it does not — re-read `globals.css`'s keyframes and `lib/motion.ts`. The entire reference site's motion is ~8KB of exactly this.

**If the crossfade underwhelms, say so.** The spec records that the reference's own keyframe holds the sans weight for its entire first half and only lands the font swap in the final frame — most of the perceived quality is the wipe and the easing, not the morph. If `<MorphHeadline>` doesn't earn its complexity on screen, dropping the hero to `<MaskReveal>` costs almost nothing perceptually and removes the dual-font gate. That is a legitimate outcome, not a failure.

**The `--font-mono` fix (Task 1) is load-bearing.** Every mono label in this design depends on it. If `font-mono` still renders as Courier or similar after Task 1, stop and fix it — do not restyle sections on a broken token.
