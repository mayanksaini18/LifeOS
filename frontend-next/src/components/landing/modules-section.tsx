import Link from "next/link";
import { Section, SectionHeading } from "@/components/landing/section";
import { HorizontalScroll } from "@/components/motion/horizontal-scroll";
import { LANDING_MODULES } from "@/lib/landing-data";
import { cn } from "@/lib/utils";

/**
 * ModulesSection — the six wellness modules as a draggable, snapping
 * horizontal gallery (Task 12). Cards are real links to each module's route;
 * accents come straight from `LANDING_MODULES`'s `--color-module-*` tokens,
 * never hardcoded.
 */
export function ModulesSection() {
  return (
    <Section id="modules">
      <SectionHeading
        eyebrow="Everything in one place"
        title="One calm home for everything you track."
        subtitle="Mood, sleep, water, habits, fitness, and insights — gently connected, never overwhelming."
      />

      <HorizontalScroll className="mt-14 -mx-6 px-6 md:-mx-16 md:px-16">
        {LANDING_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.key}
              href={mod.href}
              className={cn(
                "group snap-start shrink-0 basis-75 rounded-2xl border p-7",
                "transition-colors hover:bg-card",
                mod.ring
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", mod.iconBg)}>
                <Icon className={cn("h-5 w-5", mod.iconColor)} />
              </div>
              <h3 className="mt-6 font-heading text-2xl font-light tracking-[-0.02em]">
                {mod.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {mod.blurb}
              </p>
            </Link>
          );
        })}
      </HorizontalScroll>
    </Section>
  );
}
