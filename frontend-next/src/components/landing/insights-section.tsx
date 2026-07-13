import {
  Analytics01Icon,
  SparklesIcon,
  AiChat01Icon,
} from "hugeicons-react";
import { Section } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";

/** Deterministic weekly bar heights (% of the track), SSR-stable. */
const BARS: { height: number; day: string; highlight?: boolean }[] = [
  { height: 40, day: "M" },
  { height: 65, day: "T" },
  { height: 50, day: "W" },
  { height: 80, day: "T", highlight: true },
  { height: 55, day: "F" },
  { height: 70, day: "S" },
  { height: 90, day: "S", highlight: true },
];

const FEATURES = [
  {
    icon: AiChat01Icon,
    title: "A companion that answers",
    description: "Ask about your week in plain words and get a plain answer back.",
  },
  {
    icon: Analytics01Icon,
    title: "Weekly insight cards",
    description: "Gentle nudges that connect the dots you would have missed.",
  },
];

/**
 * InsightsSection — the Insights + AI highlight. A split two-column layout: a
 * believable product mock on the left, warm copy on the right. The header is
 * built inline in the copy column rather than using the centered SectionHeading.
 */
export function InsightsSection() {
  return (
    <Section id="insights">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — product mock */}
        <Reveal>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            {/* Header row */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Analytics01Icon className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium">This week</p>
                <p className="text-xs text-muted-foreground">Insights</p>
              </div>
            </div>

            {/* Weekly bar chart */}
            <div className="mt-5">
              <div className="flex items-end justify-between gap-2 h-24">
                {BARS.map((bar, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${
                      bar.highlight ? "bg-indigo-500" : "bg-muted"
                    }`}
                    style={{ height: `${bar.height}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                {BARS.map((bar, i) => (
                  <span
                    key={i}
                    className="flex-1 text-center text-[10px] text-muted-foreground"
                  >
                    {bar.day}
                  </span>
                ))}
              </div>
            </div>

            {/* Insight callout */}
            <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
              <SparklesIcon className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
              <p className="text-sm leading-relaxed">
                You tend to sleep about 20% better on days you finish your water
                goal.
              </p>
            </div>

            {/* AI chat exchange */}
            <div className="mt-5 space-y-2">
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-muted px-3 py-2 text-sm">
                How did I sleep this week?
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border bg-card px-3 py-2 text-sm">
                <span className="flex items-start gap-2">
                  <AiChat01Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <span className="leading-relaxed">
                    Really steady — 7h 20m on average, and your best nights
                    followed your evening walks.
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right — copy */}
        <Reveal delay={80}>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Insights &amp; AI
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15]">
            Your data, gently understood.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            LifeOS turns your small daily logs into quiet, useful patterns — the
            kind you would never spot on your own. It is here to help you notice,
            never to judge.
          </p>

          <div className="mt-8 space-y-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{feature.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
