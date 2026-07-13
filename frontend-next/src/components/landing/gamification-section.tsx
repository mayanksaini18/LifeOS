import {
  CheckmarkCircle01Icon,
  Fire02Icon,
  Award01Icon,
  Target01Icon,
} from "hugeicons-react";
import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

/**
 * Emerald intensity ramp for the habit heatmap. Written as full literal
 * class strings so Tailwind keeps them — accents stay at low opacity, with
 * empty days falling back to the neutral `bg-muted` token.
 */
const HEATMAP_INTENSITY = [
  "bg-muted",
  "bg-emerald-500/25",
  "bg-emerald-500/45",
  "bg-emerald-500/70",
  "bg-emerald-500",
] as const;

/**
 * Deterministic 7-row × 14-column consistency grid (rows are days of the
 * week, columns are weeks). Fixed values keep server and client render in
 * sync — no randomness. Each cell is an intensity level 0–4.
 */
const HEATMAP: number[][] = [
  [2, 3, 4, 3, 2, 4, 3, 4, 2, 3, 4, 3, 2, 4],
  [3, 4, 2, 4, 3, 3, 4, 2, 3, 4, 2, 4, 3, 3],
  [1, 2, 3, 4, 4, 2, 3, 4, 3, 2, 4, 3, 4, 2],
  [4, 3, 4, 2, 3, 4, 4, 3, 2, 4, 3, 4, 2, 4],
  [2, 4, 3, 4, 2, 3, 4, 4, 3, 4, 2, 3, 4, 3],
  [0, 1, 2, 3, 4, 3, 2, 4, 3, 4, 3, 2, 3, 4],
  [1, 0, 2, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 4],
];

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left — GitHub-style habit heatmap */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <CheckmarkCircle01Icon className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Habit consistency</span>
                <span className="text-xs text-muted-foreground">
                  last 10 weeks
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="inline-flex flex-col gap-1">
                  {HEATMAP.map((row, r) => (
                    <div key={r} className="flex gap-1">
                      {row.map((level, c) => (
                        <div
                          key={c}
                          className={`size-3 rounded-sm ${HEATMAP_INTENSITY[level]}`}
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
            </div>

            {/* Right — stat tiles */}
            <div className="lg:col-span-1 space-y-4">
              {/* Streak */}
              <div className="rounded-xl border p-4">
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
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Award01Icon className="h-5 w-5 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Level</span>
                </div>
                <p className="mt-2 text-lg font-semibold tracking-tight">
                  Level 4
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: "60%" }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  240 / 400 XP
                </p>
              </div>

              {/* Weekly challenges */}
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Target01Icon className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">
                    This week
                  </span>
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
                        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
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
        </div>
      </Reveal>
    </Section>
  );
}
