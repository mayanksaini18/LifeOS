import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";
import { LANDING_MODULES } from "@/lib/landing-data";

/**
 * ModulesSection — the six wellness modules. The layout is theme-aware:
 *
 *  - Light theme keeps the card grid (each card closes with a tiny meter that
 *    echoes the dashboard's GoalBar).
 *  - Dark theme swaps to a calmer editorial index list — two typographic
 *    columns with hairline dividers and no cards.
 *
 * Both layouts are rendered and toggled purely with CSS `dark:` variants, so
 * there is no theme-guessing on the server and no hydration mismatch.
 */

// Pleasant, deterministic meter widths — indexed by module position.
const METER_WIDTHS = ["72%", "64%", "80%", "58%", "68%", "85%"];

// Split the modules into two balanced columns for the dark editorial list.
const LIST_COLUMNS = [LANDING_MODULES.slice(0, 3), LANDING_MODULES.slice(3, 6)];

export function ModulesSection() {
  return (
    <Section id="modules">
      <SectionHeading
        eyebrow="Everything in one place"
        title="One calm home for everything you track."
        subtitle="Mood, sleep, water, habits, fitness, and insights — gently connected, never overwhelming."
      />

      {/* Light theme — card grid */}
      <div className="mt-14 grid grid-cols-1 gap-4 items-stretch sm:grid-cols-2 lg:grid-cols-3 md:mt-16 dark:hidden">
        {LANDING_MODULES.map((mod, index) => (
          <Reveal key={mod.key} delay={index * 60}>
            <div className="group h-full rounded-2xl border bg-card p-6 transition-colors hover:bg-muted/50">
              <div
                className={
                  "flex h-11 w-11 items-center justify-center rounded-xl border " +
                  mod.iconBg +
                  " " +
                  mod.ring
                }
              >
                <mod.icon className={"h-5 w-5 " + mod.iconColor} />
              </div>

              <h3 className="mt-5 font-semibold tracking-tight">{mod.label}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {mod.blurb}
              </p>

              <div className="mt-5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={"h-full rounded-full " + mod.bar}
                  style={{ width: METER_WIDTHS[index] ?? "70%" }}
                />
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Dark theme — editorial index list */}
      <div className="mt-14 hidden grid-cols-1 gap-x-16 md:mt-16 lg:grid-cols-2 dark:grid">
        {LIST_COLUMNS.map((column, ci) => (
          <div key={ci} className="flex flex-col">
            {column.map((mod, ri) => (
              <Reveal
                key={mod.key}
                delay={(ci * 3 + ri) * 60}
                className="border-b border-border/60 last:border-b-0"
              >
                <div className="group flex items-start gap-4 py-6">
                  <div
                    className={
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border " +
                      mod.iconBg +
                      " " +
                      mod.ring
                    }
                  >
                    <mod.icon className={"h-4 w-4 " + mod.iconColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-medium tracking-tight">
                      {mod.label}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {mod.blurb}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}
