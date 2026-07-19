"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export interface ChartScaleColors {
  grid: string;
  tickColor: string;
}

const DARK: ChartScaleColors = {
  grid:      "rgba(255, 255, 255, 0.07)",
  tickColor: "rgba(255, 255, 255, 0.4)",
};

const LIGHT: ChartScaleColors = {
  grid:      "rgba(0, 0, 0, 0.06)",
  tickColor: "rgba(0, 0, 0, 0.4)",
};

export function useChartScaleColors(): ChartScaleColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartScaleColors>(LIGHT);

  useEffect(() => {
    setColors(resolvedTheme === "dark" ? DARK : LIGHT);
  }, [resolvedTheme]);

  return colors;
}

// Chart.js needs resolved color strings, not CSS custom properties, so the
// `--module-*` tokens are read at runtime rather than referenced by class
// name. `document` doesn't exist during SSR, so this must only ever run
// client-side (inside a component or effect) — never at module scope.
const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export interface ModuleChartColors {
  mood: { line: string; fill: string; point: string };
  sleep: { bar: string; barHover: string };
  // "Check-ins this week" (dashboard) is fed by `useWeeklyAnalytics` from
  // `use-habits` — it's the habits module's chart, just a different shape.
  weekly: { line: string; fill: string; point: string };
  water: { bar: string; barHover: string; barGoal: string };
}

// Rendered on the first frame, before the effect below can read the live
// custom properties. Matches the light-theme token values in globals.css so
// there's no visible color flash on mount.
const FALLBACK: ModuleChartColors = {
  mood:   { line: "#8d84b3", fill: "rgba(141, 132, 179, 0.12)", point: "#8d84b3" },
  sleep:  { bar: "rgba(95, 135, 166, 0.55)", barHover: "rgba(95, 135, 166, 0.85)" },
  weekly: { line: "#6d8f5a", fill: "rgba(109, 143, 90, 0.1)", point: "#6d8f5a" },
  water:  {
    bar:      "rgba(79, 148, 144, 0.55)",
    barHover: "rgba(79, 148, 144, 0.85)",
    barGoal:  "rgba(79, 148, 144, 0.85)",
  },
};

/** Live `--color-module-*` values, converted into the rgba variants each chart needs. */
export function useModuleChartColors(): ModuleChartColors {
  const [colors, setColors] = useState<ModuleChartColors>(FALLBACK);

  useEffect(() => {
    const readColors = () => {
      const mood = cssVar("--module-mood");
      const sleep = cssVar("--module-sleep");
      const water = cssVar("--module-water");
      const habits = cssVar("--module-habits");

      setColors({
        mood: {
          line: mood,
          fill: `rgba(${hexToRgbTriplet(mood)}, 0.12)`,
          point: mood,
        },
        sleep: {
          bar: `rgba(${hexToRgbTriplet(sleep)}, 0.55)`,
          barHover: `rgba(${hexToRgbTriplet(sleep)}, 0.85)`,
        },
        weekly: {
          line: habits,
          fill: `rgba(${hexToRgbTriplet(habits)}, 0.1)`,
          point: habits,
        },
        water: {
          bar: `rgba(${hexToRgbTriplet(water)}, 0.55)`,
          barHover: `rgba(${hexToRgbTriplet(water)}, 0.85)`,
          barGoal: `rgba(${hexToRgbTriplet(water)}, 0.85)`,
        },
      });
    };

    // Read once immediately: covers first mount, where next-themes' blocking
    // inline script has already applied `.dark` (if applicable) before
    // hydration runs, so the DOM is already correct.
    readColors();

    // `next-themes` toggles the `.dark` class on `document.documentElement`
    // inside its *own* effect. This hook's consumer is nested under
    // `ThemeProvider`, and React flushes passive effects child-first within
    // a commit, so a read keyed on `resolvedTheme` (the previous approach)
    // fired *before* next-themes had applied the class — capturing the
    // outgoing theme's colors a render early. Because `resolvedTheme` had
    // already changed, the effect wouldn't re-run on the next render either,
    // so the stale colors persisted until the *next* toggle.
    //
    // Observing the `class` attribute directly reacts to the actual state
    // this hook depends on (the class being applied), not a same-commit
    // proxy for it, so it's immune to effect ordering between components.
    const observer = new MutationObserver(readColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}

// The mood chart's "Energy" line is a mood sub-metric (energy level logged
// alongside a mood entry), not a module identity — it has no corresponding
// `--color-module-*` token, so it stays a literal rather than being aliased
// to the (same-hue, different-meaning) fitness accent.
export const ENERGY_CHART_COLORS = {
  line:  "#fb923c",                       // orange-400
  fill:  "rgba(251, 146, 60, 0.12)",
  point: "#fb923c",
} as const;
