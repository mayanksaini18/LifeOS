import {
  CheckmarkCircle01Icon,
  Fire02Icon,
  Award01Icon,
  Target01Icon,
} from "hugeicons-react";
import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

/**
 * Habits-module intensity ramp for the habit heatmap, mirroring the emerald
 * ramp used by the real `HabitHeatmap` dashboard component — accents stay at
 * low opacity, with empty days falling back to the neutral `bg-muted` token.
 */
const HEATMAP_INTENSITY = [
  "bg-muted",
  "bg-module-habits/25",
  "bg-module-habits/45",
  "bg-module-habits/70",
  "bg-module-habits",
] as const;

const HEATMAP_ROWS = 7; // days of the week
const HEATMAP_COLS = 52; // weeks of the year

/**
 * Deterministic intensity (0–4) from a cell's indices — pure integer math, so
 * server and client render identically with no randomness. The quadratic term
 * breaks up the diagonal banding a purely linear mix would produce.
 */
function intensityAt(row: number, col: number): number {
  const h = (row * 41 + col * 23 + ((row * col * 7) % 13)) % 15;
  if (h < 2) return 0;
  if (h < 5) return 1;
  if (h < 9) return 2;
  if (h < 12) return 3;
  return 4;
}

const HEATMAP: number[][] = Array.from({ length: HEATMAP_ROWS }, (_, r) =>
  Array.from({ length: HEATMAP_COLS }, (_, c) => intensityAt(r, c))
);

interface Challenge {
  label: string;
  done: number;
  total: number;
}

const CHALLENGES: Challenge[] = [
  { label: "Drink 8 glasses", done: 4, total: 5 },
  { label: "Sleep 7h", done: 3, total: 5 },
];

export function GamificationSection() {
  return (
    <Section id="progress" muted>
      <SectionHeading
        eyebrow="Streaks & progress"
        title="Progress that actually feels good."
        subtitle="Small wins, gently rewarded. Streaks, levels, and light weekly challenges keep you coming back."
      />

      <Reveal className="mt-14 md:mt-16">
        <div className="rounded-2xl border bg-card p-6 md:p-8">
          {/* Habit heatmap — full width */}
          <div className="flex flex-wrap items-center gap-2">
            <CheckmarkCircle01Icon className="h-4 w-4 text-module-habits" />
            <span className="text-sm font-medium">Habit consistency</span>
            <span className="text-xs text-muted-foreground">
              last 12 months
            </span>
          </div>

          <div className="mt-4">
            <div className="flex flex-col gap-0.5 sm:gap-1">
              {HEATMAP.map((row, r) => (
                <div key={r} className="flex gap-0.5 sm:gap-1">
                  {row.map((level, c) => (
                    <div
                      key={c}
                      className={`aspect-square min-w-0 flex-1 rounded-sm ${HEATMAP_INTENSITY[level]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1">
              {HEATMAP_INTENSITY.map((cls, i) => (
                <div key={i} className={`size-2.5 rounded-sm ${cls}`} />
              ))}
            </div>
            <span>More</span>
          </div>

          {/* Stat tiles — one row */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Streak */}
            <div className="flex flex-col rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Fire02Icon className="h-5 w-5 text-orange-500" />
                <span className="text-xs text-muted-foreground">Streak</span>
              </div>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                12-day streak
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your longest yet.
              </p>
            </div>

            {/* Level */}
            <div className="flex flex-col rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Award01Icon className="h-5 w-5 text-amber-500" />
                <span className="text-xs text-muted-foreground">Level</span>
              </div>
              <p className="mt-2 text-lg font-semibold tracking-tight">Level 4</p>
              <div className="mt-auto pt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: "60%" }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  240 / 400 XP
                </p>
              </div>
            </div>

            {/* Weekly challenges */}
            <div className="flex flex-col rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Target01Icon className="h-5 w-5 text-emerald-500" />
                <span className="text-xs text-muted-foreground">This week</span>
              </div>
              <div className="mt-3 space-y-3">
                {CHALLENGES.map((c) => {
                  const pct = Math.round((c.done / c.total) * 100);
                  return (
                    <div key={c.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{c.label}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {c.done}/{c.total}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
