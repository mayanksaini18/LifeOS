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
