import {
  CheckListIcon,
  Analytics01Icon,
  Fire02Icon,
} from "hugeicons-react";
import { Section, SectionHeading } from "@/components/landing/section";
import { MaskReveal } from "@/components/motion/mask-reveal";
import { LANDING_STEPS, type IconType } from "@/lib/landing-data";

/**
 * Step icons, paired to LANDING_STEPS by index. Kept monochrome — they read as
 * quiet punctuation beside each number, not as accent color.
 */
const STEP_ICONS: IconType[] = [CheckListIcon, Analytics01Icon, Fire02Icon];

/**
 * HowItWorks — the three-step explainer. A subtle muted band gives the page
 * rhythm; each step reads as a numbered row under its own hairline rule
 * rather than a boxed card.
 */
export function HowItWorks() {
  return (
    <Section id="how" muted>
      <SectionHeading
        eyebrow="How it works"
        title="Three steps. That is the whole thing."
        subtitle="No setup, no spreadsheets. Just show up and let LifeOS keep the thread."
      />

      <div className="mt-14 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
        {LANDING_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index];
          return (
            <MaskReveal
              key={step.n}
              delay={index * 80}
              className="border-t border-border pt-8"
            >
              <p className="label-mono">{step.n}</p>

              <h3 className="display-heading mt-3 flex items-center gap-2 text-3xl">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.blurb}
              </p>
            </MaskReveal>
          );
        })}
      </div>
    </Section>
  );
}
