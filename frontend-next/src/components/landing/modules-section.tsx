import { Section, SectionHeading } from "@/components/landing/section";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

/**
 * ModulesSection — the six wellness modules as illustrated cards: an accent
 * badge, a short title, and the blurb, with a module illustration bleeding off
 * the right edge.
 *
 * The /public illustrations are unDraw scenes with baked-in color, so they are
 * normalised to the monochrome brand with a CSS filter: `grayscale` on light,
 * `grayscale + invert` on dark (via `dark:invert`), which flips the dark
 * figures into light ones that read on a dark card.
 */
interface ModuleCard {
  key: string;
  badge: string;
  title: string;
  blurb: string;
  illo: string;
  badgeBg: string;
  badgeText: string;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    key: "mood",
    badge: "Mood",
    title: "Know how you feel",
    blurb: "Notice how you feel and spot what quietly lifts you.",
    illo: "/mood.svg",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "sleep",
    badge: "Sleep",
    title: "Rest, measured",
    blurb: "Track your rest and wake up to gentle, honest trends.",
    illo: "/sleep.svg",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-600 dark:text-sky-400",
  },
  {
    key: "water",
    badge: "Water",
    title: "Stay hydrated",
    blurb: "Stay hydrated with a single tap — one glass at a time.",
    illo: "/water.svg",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-600 dark:text-cyan-400",
  },
  {
    key: "habits",
    badge: "Habits",
    title: "Build better habits",
    blurb: "Build small routines that quietly add up over time.",
    illo: "/healthy-habit.svg",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "fitness",
    badge: "Fitness",
    title: "Move every day",
    blurb: "Log movement and celebrate every active day.",
    illo: "/fitness.svg",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600 dark:text-orange-400",
  },
  {
    key: "insights",
    badge: "Insights",
    title: "See the patterns",
    blurb: "See the patterns your week has been hiding from you.",
    illo: "/dashboard.svg",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-600 dark:text-indigo-400",
  },
];

export function ModulesSection() {
  return (
    <Section id="modules">
      <SectionHeading
        eyebrow="Everything in one place"
        title="One calm home for everything you track."
        subtitle="Mood, sleep, water, habits, fitness, and insights — gently connected, never overwhelming."
      />

      <div className="mt-14 grid grid-cols-1 gap-5 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
        {MODULE_CARDS.map((card, index) => (
          <Reveal key={card.key} delay={index * 70}>
            <div className="group relative flex h-full min-h-70 overflow-hidden rounded-2xl border bg-card p-6 transition-colors hover:bg-muted/40">
              {/* Text column */}
              <div className="relative z-10 flex w-[56%] flex-col">
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    card.badgeBg,
                    card.badgeText
                  )}
                >
                  {card.badge}
                </span>

                <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.blurb}
                </p>
              </div>

              {/* Illustration — bleeds off the bottom-right edge */}
              <div className="pointer-events-none absolute bottom-0 right-0 top-8 flex w-[52%] items-end justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.illo}
                  alt=""
                  draggable={false}
                  className="h-full w-full select-none object-contain object-bottom-right opacity-90 grayscale dark:invert"
                />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
