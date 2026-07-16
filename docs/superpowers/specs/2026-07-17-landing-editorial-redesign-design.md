# Landing Page Editorial Redesign & Design Tokens — Design

**Date:** 2026-07-17
**Status:** Approved (pending spec review)
**Area:** `frontend-next` (Next.js 16 / React 19 / Tailwind v4)
**Reference:** [aptosnetwork.com](https://aptosnetwork.com/) — teardown in Appendix A

## Problem

The `/welcome` landing page works but has no art direction. It uses shadcn's
default neutral greys, `text-4xl/5xl` headings with no typographic voice, and
generic float animations. It reads as a competent template rather than a
product with a point of view.

The instinct after seeing a site like Aptos is "install GSAP and Lenis." That
is the wrong lesson. **`/welcome` already uses the same architecture Aptos
does** — CSS keyframes driven by an IntersectionObserver
(`components/landing/reveal.tsx`). No animation library is missing. The gap is
entirely **art direction and craft**.

Two latent defects surfaced while scoping this, both of which block the
direction:

1. **`--font-mono` is broken.** `globals.css:11` sets
   `--font-mono: var(--font-geist-mono)`, but `app/layout.tsx` only loads
   Inter — `--font-geist-mono` is never defined. Every `font-mono` class
   silently falls back to the browser default monospace. The editorial
   direction depends on uppercase mono labels, so this must be fixed first.
2. **Accent colors are hardcoded 114 times across 18 files.**
   `lib/landing-data.ts` documents the reason: *"Tailwind can't derive class
   names from variables, so every accent is written as a full literal string."*
   That was true in Tailwind v3. **This project is on Tailwind v4**, where
   `@theme { --color-module-mood: … }` generates `text-module-mood` and
   `bg-module-mood/10` automatically. The constraint is obsolete, and lifting
   it is what makes a token layer possible at all.

   **These 114 literals are not all the same kind of thing**, and conflating
   them is the main trap in this migration. `emerald-500` in
   `components/auth/login-form.tsx:92` ("Email verified"),
   `register-form.tsx:67`, `verify-client.tsx:61`, and
   `weekly-challenges.tsx:63` (a completed checkmark) means **success** — it has
   nothing to do with the habits module, which merely happens to also be green.
   Mapping those to `module-habits` would mean a future retune of the habits
   accent silently repaints the "Email verified" banner. The migration therefore
   produces **two token families**, and a further ~24 status literals (amber,
   red, yellow, rose, green) exist beyond the module five.

## Goals

- Give LifeOS a coherent visual identity: **calm editorial** — precise, quiet,
  unhurried; the opposite of a gamified habit app.
- Rebuild the token layer so color, type, and motion each have exactly one
  source of truth, and the dashboard inherits the new identity for free.
- Port the *techniques* that make the reference feel expensive (clip-path
  reveals, disciplined easing, grouped in-view triggers) without adding an
  animation dependency.
- Fix `--font-mono` and eliminate the 114 color literals.

## Non-Goals

- **No animation library.** Not GSAP, Framer Motion, Lenis, Three.js, or
  Lottie. The reference ships zero and so do we (see Appendix A).
- **No dashboard screen redesign.** Dashboard, habits, mood, sleep, water,
  fitness, journal, insights, and chat inherit the new tokens but keep their
  current layouts. A product pass is a separate project.
- **No marquee.** Deliberately cut — see Decisions §7.
- **No CMS.** Landing content stays in `lib/landing-data.ts`.
- **No `light-dark()` migration.** The reference uses it; this project uses
  `next-themes` with a `.dark` class. Keep the existing override pattern.
- **No new landing sections.** The existing seven are sound; this is a restyle.

## Decisions

1. **Scope is landing + design tokens.** Full redesign of `/welcome`, plus a
   rebuilt token layer that the dashboard inherits without per-screen work.

2. **Art direction: calm editorial.** Large variable serif headings, uppercase
   mono labels, hairline rules, generous whitespace, left-aligned headers.

3. **Palette: P3 "Chalk & Sage"** — a cool near-white ground with muted, earthy
   module accents. Chosen with eyes open: it is the *least warm* of the options
   considered, so the result will read precise-and-quiet rather than
   human-and-warm. It was picked partly because it is the smallest migration
   from the current neutrals. Tokens must be structured so the ground can be
   warmed later without touching component code.

4. **Type: Fraunces (heading) + Inter (body) + JetBrains Mono (labels).**
   `globals.css:12` already declares `--font-heading: var(--font-sans)`, so
   pointing it at Fraunces is a one-line flip the whole app inherits.

5. **Hero headline uses a two-font crossfade wipe.** The reference's signature
   move is a clip-path wipe plus a genuine sans→serif morph, driven by a custom
   `SERF` axis in their commissioned "Season" typeface. **No free font has such
   an axis** — this was verified by parsing the `fvar` tables of Amstelvar
   (current and alpha builds) directly; contrary to widely-cited documentation,
   `YTSE` is not present. See Appendix B. We reproduce the *illusion* by
   stacking a sans and a serif copy and crossfading between them beneath the
   moving wipe; the eye cannot track letterforms mid-wipe, so it reads as a
   morph.

6. **Every other reveal uses a weight-only wipe** (clip-path + 40px drift +
   slight weight settle). The crossfade appears **exactly once per page**, on
   the hero `<h1>` — it duplicates its text in the DOM and blocks on two fonts,
   so it does not scale to every heading.

7. **The marquee is cut.** It is the reference's most recognizable move and a
   trap here. A giant scrolling wordmark is a *shouty* gesture that projects
   scale — right for a blockchain foundation, wrong for a wellness product
   whose entire chosen direction is calm. Cheap to add later.

8. **The hero's floating badge constellation is cut.** The five animated module
   cards in `hero.tsx` are the most "app dashboard" element on the page and are
   precisely what prevents the hero reading as editorial.

9. **The hero gets a single CTA.** `hero.tsx` currently embeds three auth entry
   points (register button, `GoogleLogin`, phone login). An editorial hero and
   an embedded signup form want opposite things. The hero gets one "Create an
   account" pill linking to `/register`, which already handles all three
   methods. Costs one click; buys the whole direction.

10. **`/welcome` moves out of the `(auth)` route group** into a marketing
    route, now that it is no longer a form.

## Architecture — four layers

Each layer is consumable without reading the ones below it.

```
Layer 1 · Tokens         globals.css @theme
                         The only place a color/type/motion value exists.
                              ▲
Layer 2 · Fonts          app/layout.tsx — next/font/google
                         Fraunces + JetBrains Mono alongside Inter.
                              ▲
Layer 3 · Motion         lib/motion.ts + components/motion/*
                         whenSomeInView + 4 primitives + CSS keyframes.
                              ▲
Layer 4 · Landing        components/landing/*
                         Consumes 1–3. Owns no motion logic.
```

## Layer 1 — Tokens

### Color (light)

```
--background         #f7f8f6      --foreground          #14171a
--card               #eef0ed      --muted-foreground    #6a7178
--border             #dce0da      --ring                #6a7178
```

### Color (dark)

```
--background         #14171a      --foreground          #f7f8f6
--card               #1b1f22      --muted-foreground    #9aa1a8
--border             #2b3033
```

### Module accents — new, and the crux of the migration

```
                       light        dark
--color-module-mood    #8d84b3      #a79ecc
--color-module-sleep   #5f87a6      #7aa3c2
--color-module-water   #4f9490      #6bb0ac
--color-module-habits  #6d8f5a      #89ab76
--color-module-fitness #b8703f      #d18a5c
```

Declared in `@theme`, these generate `text-module-mood`, `bg-module-mood/10`,
`border-module-mood/20` and friends — the exact utility shapes the current
literals use, so the migration is mechanical.

**Open item for implementation:** these five are muted into a narrow range and
must stay mutually distinguishable in `insights` charts and the module widget
row. Verify perceptual separation (and contrast against both grounds) before
finalizing; adjust lightness spread rather than adding saturation.

### Status — a separate family, deliberately

```
                       light        dark
--color-success        #4a7c59      #7aab86
--color-warning        #a8762e      #d4a054
--color-destructive    (exists — unchanged)
```

Module accents and status colors are **different token families and must never
be aliased to each other**, however close they sit on the color wheel. Success
is green because green means success; habits is green because it was picked to
be. They change for unrelated reasons. `--destructive` already exists in
`globals.css`; `--success` and `--warning` are new and cover the ~24 status
literals (amber, red, yellow, rose, green) currently scattered across `src/`.

### Motion

```
--ease-editorial      cubic-bezier(.76, 0, .24, 1)
--duration-wipe-in    1.9s
--duration-wipe-out   1s
```

One easing curve, applied consistently, is doing more perceptual work on the
reference than any individual effect. Treat deviation from it as a bug.

## Layer 2 — Fonts

`app/layout.tsx` loads, via `next/font/google`:

- **Inter** → `--font-sans` (already present, unchanged)
- **Fraunces** → `--font-heading` (variable; `opsz` 9–144, `wght`, `SOFT`, `WONK`)
- **JetBrains Mono** → `--font-mono` (**fixes the broken `--font-geist-mono`
  reference**)

`globals.css` flips `--font-heading` from `var(--font-sans)` to the Fraunces
variable.

**Risk:** the hero crossfade blocks on *both* Inter and Fraunces. Use
`display: swap` and tune `adjustFontFallback`/`size-adjust`, or the highest-value
element on the page will shift on load.

## Layer 3 — Motion primitives

| Unit | Purpose | Depends on |
|---|---|---|
| `whenSomeInView` | One shared IntersectionObserver (threshold 0.7). Groups elements by id so a cluster animates in unison; disconnects after firing. ~40 lines. | — |
| `<MaskReveal>` | Weight-only wipe. The workhorse for every heading and block. | `whenSomeInView` |
| `<MorphHeadline>` | Hero `<h1>` only. Two stacked copies, sans crossfading to serif under the wipe. Sans copy is `aria-hidden` so the headline is announced once. | `whenSomeInView` |
| `<RotatingWord>` | Hero word rotator: *"take care of yourself / your sleep / your mood / your habits."* Pauses when scrolled out of view. | `whenSomeInView` |
| `<HorizontalScroll>` | Modules gallery. Native `overflow-x` + scroll-snap + drag-to-scroll; snap disables mid-drag, and a movement threshold swallows the click so a drag never fires a link. | — |

`components/landing/reveal.tsx` becomes a thin consumer of `whenSomeInView`,
**keeping its existing `prefers-reduced-motion` guard** — that logic is already
correct and must survive the refactor. All wipes are skipped under reduced
motion; content appears immediately.

## Layer 4 — Landing

The seven existing sections stay. Changes are stylistic:

- **Hero** — `<MorphHeadline>` + `<RotatingWord>`, single CTA, badge
  constellation removed.
- **Section/SectionHeading** — headers go left-aligned (centered headings read
  as "startup template"; editorial pages left-align). Eyebrows become uppercase
  mono. `max-w` widens so display-scale type has room.
- **Modules** — `<HorizontalScroll>` gallery.
- **Nav** — retains the existing sticky/scroll-aware behavior and `ThemeToggle`.

## Migration — the actual work

**The token migration is the bulk of this project, not the landing page.** The
114 literals span auth forms, `lib/chart-theme.ts`, `lib/constants.ts`,
insights charts, and dashboard widgets. **Each literal must be classified before
it is replaced** — module accent or status:

*→ module accents* (`text-module-*`, `bg-module-*/10`, …)

```
app/(dashboard)/insights/page.tsx        components/landing/modules-section.tsx
app/(dashboard)/journal/page.tsx         components/mood/mood-history.tsx
components/dashboard/module-widgets.tsx  components/mood/mood-insights.tsx
components/fitness/fitness-stats.tsx     components/water/water-tracker.tsx
components/habits/habit-heatmap.tsx      lib/chart-theme.ts
components/landing/gamification-section.tsx  lib/constants.ts
components/landing/hero.tsx              lib/landing-data.ts
```

*→ status* (`text-success`, `bg-success/10`, …) — **not** module tokens

```
components/auth/login-form.tsx:92        (emerald = "Email verified")
components/auth/register-form.tsx:67     (emerald = mail-sent confirmation)
components/auth/verify-client.tsx:61     (emerald = verified)
components/dashboard/weekly-challenges.tsx:63  (emerald = completed check)
```

Files carrying both kinds (`weekly-challenges.tsx` has a completed check *and*
module accents) need per-occurrence judgement, not a find-and-replace.

Sequence: **tokens and fonts land first** (mechanical, verifiable, touches
everything), **then** motion primitives, **then** the landing restyle. Doing the
landing first would mean writing components against literals we are about to
delete.

`lib/landing-data.ts`'s comment explaining the literal-string workaround must be
deleted along with the workaround — a stale comment justifying an obsolete
constraint is worse than none.

## Risks

- **Chart legibility.** Five muted accents in a narrow range may not separate in
  `insights`. Highest-probability failure. Verify before finalizing.
- **Layout shift on the hero.** Two fonts gate the page's most important element.
- **Scope creep into the dashboard.** Tokens will make some dashboard screens
  look subtly off (a neutral tuned for one palette rarely lands in another).
  Resist fixing them here; log them.
- **`font-variation-settings` is not GPU-accelerated** — it relayouts per frame.
  Acceptable on one headline; do not use it broadly. (Largely sidestepped by
  choosing crossfade over axis morph, but the weight settle in `<MaskReveal>`
  still applies — keep it on headings only.)

## Success criteria

- No animation library in `package.json`.
- Zero `(violet|sky|cyan|emerald|orange)-[0-9]{3}` literals in `src/` — with
  each former occurrence resolved to the *semantically correct* family, not
  merely the nearest hue. Spot-check: the "Email verified" banner must reference
  `success`, and retuning `--color-module-habits` must leave it untouched.
- `font-mono` resolves to a real loaded font.
- `prefers-reduced-motion` disables every wipe.
- The five module accents remain distinguishable in the insights charts and the
  widget row, in both light and dark.
- The hero headline does not shift on load.

## Alternatives considered

- **Fraunces axis morph** (`opsz` 9→144, `SOFT`, `WONK`, `wght`) — one font, a
  genuine morph, no DOM duplication. Rejected: it stays a serif throughout, so
  the change is subtler than the crossfade.
- **Weight-only wipe for the hero too.** Rejected for the hero, adopted
  everywhere else. Worth noting the reference's own keyframe holds the sans
  weight for its entire first half and only lands the font swap in the final
  frame — most of the perceived quality is the *wipe and the easing*, not the
  morph. If the crossfade disappoints in practice, dropping to the weight-only
  wipe costs almost nothing perceptually and removes the dual-font load risk.
- **P1 "Cream & Mint"** (closest to the reference) — rejected: cream carries an
  institutional-crypto connotation, and its sand hairlines are low-contrast on
  cream.
- **P2 "Bone & Clay"** (warm paper, terracotta anchor) — the recommendation;
  not chosen. Remains the natural destination if P3 reads too cold.
- **Landing-only scope** — rejected: leaves the landing and product looking like
  two different companies.

---

## Appendix A — aptosnetwork.com teardown

Verified by loading the page in headless Chromium (the site sits behind a Vercel
bot checkpoint that blocks plain fetches), probing `window` globals, and reading
every script it ships.

**Stack:** Astro (islands) · Tailwind CSS v4 · DatoCMS · Vercel · Sentry ·
Partytown (moves GTM off the main thread). Not Next.js, not React.

**Animation libraries: none.** No GSAP, Framer Motion, Lenis, Locomotive,
Three.js, Lottie, Rive, Swiper, or Splitting. Total motion JS ≈ **8KB** across
five modules (`AnimatedAppear` is 744 bytes).

**How it works:**

- `whenSomeInView` — one IntersectionObserver (threshold 0.7), groups elements
  by `data-*-group`, fires `onEnter`/`onLeave` for the whole group, `once`
  disconnects. Reveals are *just a class being added*; all animation is CSS.
- Signature keyframe:
  ```css
  @keyframes text-mask-in {
    0%   { clip-path: polygon(0 0, 0 0, 0 200%, 0 200%);
           font-variation-settings: var(--font-sans--font-variation-settings);
           font-weight: 375; translate: 0 }
    50%  { clip-path: polygon(0 0, 110% 0, 110% 200%, 0 200%);
           font-weight: 375; translate: 50px }
    to   { clip-path: polygon(0 0, 110% 0, 110% 200%, 0 200%);
           font-variation-settings: var(--font-serif--font-variation-settings) }
  }
  ```
  with `--font-sans--font-variation-settings: "SERF" 0` and
  `--font-serif--font-variation-settings: "SERF" 70`. Their bespoke "Season"
  variable font has a custom `SERF` axis — the text grows serifs as it wipes in.
  `appear-mask-in-from-right` ends at `clip-path: none` so descenders aren't
  clipped afterward.
- **Scroll-driven CSS**: `animation-timeline: view()` behind `@supports`, driving
  `parallax-in` and a `stackable-shrink` card stack. Zero JS.
- **Marquee**: pure CSS `translate(100%)` linear infinite; JS only sets
  `animationDuration = width / speed` via ResizeObserver, keeping px/sec constant
  regardless of content length.
- **Horizontal gallery**: native `overflow-x` + scroll-snap; drag toggles snap
  off; 5px threshold suppresses the click after a drag.
- **Easing**: `cubic-bezier(.76, 0, .24, 1)` nearly everywhere; 1s out / 2s in.

**Art direction:** cream `#f9f9f0` ground, mint `#d5fad3`, blue `#badbee`, coral
`#f86`, graphite `#2f2d28`, themed with CSS `light-dark()`. 120px serif `h1` at
weight 335, `-3.6px` tracking, 0.95 line-height. Uppercase mono (Akkurat Mono)
for every label, caption, and button. Hairline rules, line-art SVG diagrams,
B&W photography, floating pill nav, dark cards on mint.

## Appendix B — the variable-font finding

Aptos's morph needs a typeface with a sans↔serif axis. **No freely available
font has one.** Verified by parsing `fvar` tables directly:

- **Amstelvar** (current, 12 axes): `wght wdth opsz GRAD XTRA XOPQ YOPQ YTLC
  YTUC YTAS YTDE YTFI` — **no `YTSE`**.
- **Amstelvar** (old alpha VF, 12 axes): identical set — **no `YTSE`**.
- **Roboto Flex** (13 axes): parametric, but a sans throughout.

`YTSE` ("serif height") appears in Berlow's parametric-axis *writing* and in
third-party summaries, but is **not in the shipped font**. Any plan built on it
would have failed at implementation.

**Fraunces** is confirmed available through the Google Fonts API with `opsz`
9–144, `wght` 100–900, `SOFT` 0–100, and `WONK` 0–1 — enough for a genuine
in-font morph, but not a sans→serif one. Hence the crossfade.
