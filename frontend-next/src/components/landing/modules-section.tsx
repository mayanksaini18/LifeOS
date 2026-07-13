import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";
import { LANDING_MODULES } from "@/lib/landing-data";

/**
 * ModulesSection — the feature grid of the six wellness modules. Each card is
 * display-only (no link) so there are no dead pre-auth clicks, and closes with
 * a tiny faux meter that echoes the dashboard's GoalBar. Widths are fixed and
 * deterministic (indexed by position) so the markup stays SSR-stable.
 */

// Pleasant, deterministic meter widths — indexed by module position.
const METER_WIDTHS = ["72%", "64%", "80%", "58%", "68%", "85%"];

export function ModulesSection() {
  return (
    <Section id="modules">
      <SectionHeading
        eyebrow="Everything in one place"
        title="One calm home for everything you track."
        subtitle="Mood, sleep, water, habits, fitness, and insights — gently connected, never overwhelming."
      />

      <div className="mt-14 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
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
    </Section>
  );
}
