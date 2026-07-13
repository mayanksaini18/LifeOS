import {
  CheckListIcon,
  Analytics01Icon,
  Fire02Icon,
} from "hugeicons-react";
import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";
import { LANDING_STEPS, type IconType } from "@/lib/landing-data";

/**
 * Step icons, paired to LANDING_STEPS by index. Kept monochrome — they read as
 * quiet punctuation beside each number, not as accent color.
 */
const STEP_ICONS: IconType[] = [CheckListIcon, Analytics01Icon, Fire02Icon];

/**
 * HowItWorks — the three-step explainer. A subtle muted band gives the page
 * rhythm; a faint hairline threads the number badges together on wider screens.
 */
export function HowItWorks() {
  return (
    <Section id="how" muted>
      <SectionHeading
        eyebrow="How it works"
        title="Three steps. That is the whole thing."
        subtitle="No setup, no spreadsheets. Just show up and let LifeOS keep the thread."
      />

      <div className="relative mt-14 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
        {/* Connective hairline — threads the badge centers, masked by their
            bg-background. Hidden on mobile; sits behind the content. */}
        <div
          aria-hidden
          className="absolute inset-x-[16.666%] top-6 hidden border-t border-border md:block -z-10"
        />

        {LANDING_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index];
          return (
            <Reveal key={step.n} delay={index * 80} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-background text-sm font-semibold text-muted-foreground">
                {step.n}
              </div>

              <h3 className="mt-5 flex items-center justify-center gap-2 font-semibold tracking-tight">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {step.title}
              </h3>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.blurb}
              </p>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
