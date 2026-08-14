# Apple-Premium Product Redesign — Design

**Date:** 2026-08-14
**Status:** Approved (pending spec review)
**Area:** `frontend-next` (Next.js 16 / React 19 / Tailwind v4)
**Supersedes:** the motion layer of [2026-07-17 Landing Editorial Redesign](2026-07-17-landing-editorial-redesign-design.md). Its token and font layers survive intact.

## Problem

Two design languages live in this repo and only one of them was designed.

The landing page was deliberately art-directed in July: editorial voice, Fraunces
display headings, mono micro-labels, clip-path wipe animations on a shared
`--ease-editorial` curve. Twelve files under `components/landing/` speak that
vocabulary.

The product behind the login never caught up. Across the dashboard and the five
tracker modules — 30 component files — **zero** use `display-heading`,
`label-mono`, or `font-heading`. The dashboard sets its greeting as
`text-2xl font-semibold tracking-tight` and its section headings as
`text-lg font-semibold tracking-tight`: stock shadcn defaults, chosen ad hoc.

Separately, and more urgently for launch: across 20 routes there are **zero**
`error.tsx`, `loading.tsx`, and `not-found.tsx` files. An unhandled render error
in any dashboard segment surfaces Next's bare *"Application error: a client-side
exception has occurred."* Empty-state copy appears in 7 files; error handling in
5. Perceived quality is set by the worst screen a reviewer hits, not the best.

The stated goal is to look **credible at launch**, with an **Apple-premium**
feel, and with the landing page's animations removed.

## Goals

- One visual language across landing and product, applied to every route.
- A premium read achieved through typography, spacing, material and restraint —
  the levers that survive scrutiny — rather than through colour.
- Remove the wipe/morph/float animation vocabulary entirely.
- Close the launch-blocking gaps: route-level error, loading and not-found
  states; real empty states; a 375px pass; a focus and keyboard audit.
- Every phase independently shippable and green on typecheck, build and Storybook.

## Non-Goals

- **No colour changes.** The palette is explicitly out of scope — see Decisions.
- No backend work. No API, schema or auth changes.
- No new features. This is a redesign of surfaces that already exist.
- No component library migration. shadcn + Tailwind v4 stay.
- Not a rewrite of the July token architecture — it is reused as-is.

## Decisions

**D1 — The palette does not change.** Considered and rejected: moving to Apple's
neutral grounds (`#ffffff` / `#f5f5f7` / `#1d1d1f`, true-black dark mode) with
vivid system accents. Rejected because premium does not live in the greys. It
lives in type, space, material and restraint — Aesop and Teenage Engineering are
warm *and* unmistakably premium. Keeping `#f7f8f6` / `#eef0ed` / `#14171a` and
the five muted module accents costs nothing against the brief, preserves the
warmth that does real emotional work on journal and mood, avoids re-tuning every
warm hex in the landing components, and carries zero risk. **Not one hex changes.**

**D2 — Module and status colour separate by role, not hue.** The existing
`CLAUDE.md` rule stands: the two families are never aliased. It is now enforced
structurally. Module accents appear **only as data encoding** — rings, chart
series, dots. Status colours appear **only as inline text with an icon**, never
as a surface fill. Same hue can therefore never appear in the same form, so the
families cannot compete. This is Apple's own resolution: green is both an
Activity ring and a success state.

**D3 — Typography splits on a seam: serif speaks, sans measures.** Fraunces is
reserved for marketing and reflection surfaces — landing, journal, mood,
insights. Every measurement surface — dashboard, habits, sleep, water, fitness,
and all charts and stats — is Inter, tightly tracked with tabular numerals.

Two alternatives were rejected. *Sans-only* (drop Fraunces, Inter everywhere) is
the Apple-literal read but removes the last of the editorial voice; warm palette
plus neutral sans reads plain rather than premium. *Serif-everywhere* keeps
Fraunces on display across the product but fights the density a dashboard needs
and reads editorial rather than product.

**D4 — Fraunces loses `SOFT` and `WONK`.** Those axes exist solely to drive the
hero morph. With the morph removed they have no consumer, and they are what made
the face read decorative. Fraunces is retained at `opsz` and `wght` only.

**D5 — Motion is rebuilt as a deliberately tiny vocabulary.** One entrance, one
press feedback, two curves, three durations. Restraint is the mechanism, not a
side effect.

## Architecture — five layers

```
Layer 1  Tokens        globals.css — type scale, motion, radius, material
Layer 2  Fonts         lib/fonts.ts — Fraunces axes reduced
Layer 3  Primitives    PageShell, PageHeader, Stat, EmptyState + type classes
Layer 4  Surfaces      landing → product → reflection
Layer 5  Credibility   error/loading/not-found, empty states, mobile, a11y
```

## Layer 1 — Tokens

### Colour

Unchanged. Both `:root` and `.dark` blocks are untouched, including the five
module accents and the separate status family.

### Type scale

Replaces today's ad-hoc `text-2xl` / `text-lg` / `text-sm` usage with a fixed
seven-step ramp. Tracking tightens as size grows; line-height loosens as size
shrinks.

| Step | Size | Tracking | Line-height | Role |
|---|---|---|---|---|
| `display-1` | 3.75rem | −0.035em | 1.02 | landing hero |
| `display-2` | 2.75rem | −0.03em | 1.05 | section openers |
| `title-1` | 1.75rem | −0.03em | 1.1 | page titles |
| `title-2` | 1.25rem | −0.02em | 1.2 | section headings |
| `body` | 0.9375rem | 0 | 1.6 | prose, controls |
| `caption` | 0.8125rem | 0 | 1.5 | secondary text |
| `label-mono` | 0.625rem | 0.14em | 1 | micro-labels (exists) |

Surfaced as `@layer components` classes beside the existing `.label-mono` and
`.display-heading`, so the voice stays consistent and a change lands everywhere.

Every numeric value — stat, streak, XP, duration, count — carries
`font-variant-numeric: tabular-nums`, so digits stop shifting width as they change.

### Motion

Removed: `mask-in`, `morph-serif-in`, `morph-sans-out`, `word-out`, `float`,
`float-sm` keyframes; the `.animate-*` classes bound to them;
`--duration-wipe-in`, `--duration-wipe-out`; and `--ease-editorial` with its
`@theme` block. Verified: the `ease-editorial` utility has **no consumers**
outside `globals.css`, so nothing outside the removed keyframes depends on it.

Added:

| Token | Value |
|---|---|
| `--ease-standard` | `cubic-bezier(.4, 0, .2, 1)` |
| `--ease-entrance` | `cubic-bezier(.16, 1, .3, 1)` |
| `--duration-micro` | `150ms` |
| `--duration-base` | `250ms` |
| `--duration-entrance` | `400ms` |

`--ease-*` is a real Tailwind v4 namespace and belongs in `@theme`. Durations
have no theme namespace and stay plain `:root` custom properties — the same
split the July spec established, for the same reason.

One entrance animation: opacity `0 → 1` with `translateY(12px → 0)` over
`--duration-entrance` on `--ease-entrance`, fired once per element via
`IntersectionObserver`, staggered 60ms across list children. One press
feedback: `scale(.97)` on `:active` over `--duration-micro`.

Under `prefers-reduced-motion: reduce`, reveals collapse to opacity-only and
press feedback is suppressed.

### Material and radius

`--radius` moves `0.625rem → 0.75rem`. Primary CTAs become pills
(`rounded-full`). The nine `shadow-*` usages are removed in favour of hairline
borders and the existing tonal surface step (`--card` on `--background`), which
is already a one-step separation and needs no shadow to read. The two
`shadow-none` usages become unnecessary and go with them.

The translucent nav is an **upgrade, not an introduction**. `layout/header.tsx`
and `landing/landing-nav.tsx` already do `bg-background/80 backdrop-blur-sm`.
`blur-sm` is 4px — too weak to read as material. Both move to
`saturate(180%) blur(20px)`, which is what makes the effect legible as glass
rather than as a slightly hazy bar. It composes with the warm palette unchanged.

Focus rings become `2px` at `2px` offset on `--ring`, replacing `outline-ring/50`.

## Layer 2 — Fonts

`lib/fonts.ts` keeps all three families. Fraunces drops to `axes: ["opsz"]`.
Inter gains `axes: ["opsz"]` for optical sizing, so display text is not merely
body text scaled up. The file remains the single source of truth shared with
Storybook's preview.

Verified against `next/font`'s bundled `font-data.json`: Inter exposes
`["opsz", "wght"]` and Fraunces exposes `["SOFT", "WONK", "opsz", "wght"]`. Both
changes are therefore supported. Note `wght` is always included and must not be
listed in `axes` — the existing comment in `fonts.ts` records this.

## Layer 3 — Primitives

Four new components, each replacing an inline pattern currently improvised per page:

- **`PageShell`** — max-width, page padding, section rhythm. Replaces the
  per-page `max-w-5xl mx-auto space-y-12`.
- **`PageHeader`** — title, optional description, optional action slot.
  Standardizes the greeting/title-plus-button pattern.
- **`Stat`** — a value with a mono label, tabular numerals, optional module accent.
- **`EmptyState`** — icon, headline, body, action. Standardizes the seven ad-hoc variants.

Spacing is restricted to `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.

Per the house rule, each ships with a `.stories.tsx` sibling.

## Layer 4 — Surfaces

Applied in dependency order: **landing** (rebuilt without the motion
components), then **product** (dashboard, habits, sleep, water, fitness), then
**reflection** (journal, mood, insights, chat), then **auth and onboarding**.

The four motion components — `mask-reveal`, `morph-headline`, `rotating-word`,
`horizontal-scroll` — are deleted along with their stories. Nine files reference
the vocabulary they provide and must be rewritten, not merely unhooked.

## Layer 5 — Credibility

- `error.tsx` for the `(dashboard)` and `(auth)` route groups; `global-error.tsx`
  at the root; `not-found.tsx` at the root; `loading.tsx` per dashboard segment.
- Real empty states on all five trackers plus journal and insights.
- A 375px pass across every route.
- A focus and keyboard audit: visible rings, logical tab order, hit targets ≥44px.

## Migration — the actual work

| Phase | Scope | Ships when |
|---|---|---|
| 1 | Tokens, type scale, motion tokens; delete old keyframes and motion components | typecheck + build + Storybook green |
| 2 | `PageShell`, `PageHeader`, `Stat`, `EmptyState`, nav material, focus rings | + stories for all four |
| 3 | Landing rebuilt on the new primitives, de-animated | `/welcome` still statically prerendered |
| 4 | Dashboard + habits, sleep, water, fitness | tracker stories updated |
| 5 | Journal, mood, insights, chat (serif side of the seam) | — |
| 6 | Credibility sweep | all routes have error/loading/not-found |

Phase 1 deletes components that phase 3 depends on having replaced, so phases 1
and 3 must not be split across long-lived branches.

## Risks

- **`/welcome` must stay statically prerendered.** `scripts/verify-static-routes.mjs`
  fails `npm test` if it drops out of the prerender manifest. Phase 3 touches
  that route directly. Moving it under a layout that calls `cookies()` or adding
  `dynamic = "force-dynamic"` breaks it silently — Storybook cannot catch it.
- **Story coverage is 27 of 64 components.** The house rule says every component
  gets one. The redesign touches far more than 27, so the gap becomes visible as
  untested surface exactly when the most churn is happening.
- **The Storybook suite is not in CI.** `.github/workflows/ci.yml` runs backend
  tests plus frontend typecheck and build only. `npm test` must be run locally
  before each phase lands or visual regressions ship unnoticed.
- **Deleting the motion components is irreversible in review terms.** Nine files
  reference them; a partial sweep leaves dangling imports that typecheck catches
  but Storybook does not.
- **Scope.** Six phases across 20 routes and 64 components is the largest change
  the frontend has taken. Phases are ordered so that stopping after any one
  leaves the app coherent, not half-restyled.

## Success criteria

- No `.animate-mask-in`, `.animate-morph-*`, `.animate-word-*`, `.animate-float*`
  usage remains; the keyframes and their tokens are gone from `globals.css`.
- `components/motion/` is deleted.
- Fraunces is loaded with `opsz` only; no `SOFT` or `WONK` anywhere.
- Every route renders an intentional error, loading and empty state.
- Every numeric display uses tabular numerals.
- No page defines its own max-width or section rhythm; all use `PageShell`.
- Module accents appear only as data encoding; status colours only as inline
  text with an icon.
- `npx tsc --noEmit`, `npm run build`, and `npm test` all pass at every phase.
- `/welcome` remains in `.next/prerender-manifest.json`.

## Alternatives considered

**Apple-neutral palette.** Rejected as D1. The warm palette is a considered
asset, not debt, and replacing it carries real risk for no gain against the brief.

**Sans-only typography.** Rejected as D3. Apple-literal but voiceless.

**Polish pass instead of redesign.** Rejected during brainstorming: tightening
spacing and contrast on the current screens would not close the gap between a
designed landing page and an undesigned product.

**Credibility sweep first.** Considered as a reordering. Rejected because the
error, loading and empty states would then be built twice — once in the current
idiom and again in the new one. It runs last so it is built once, correctly.
