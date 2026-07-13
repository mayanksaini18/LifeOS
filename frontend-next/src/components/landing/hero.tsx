import Link from "next/link";
import type { ComponentType, CSSProperties } from "react";
import {
  ArrowRight01Icon,
  ArrowDown01Icon,
  SmileIcon,
  Moon02Icon,
  DropletIcon,
  CheckListIcon,
  Dumbbell01Icon,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { GoogleLogin } from "@/components/auth/google-login";

interface FloatingModule {
  icon: ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  cardColor: string;
  style: CSSProperties;
}

/**
 * Floating badge constellation that hovers around the hero illustration — a
 * gentle preview of the modules, each rendered only as a low-opacity accent.
 */
const modules: FloatingModule[] = [
  {
    icon: SmileIcon,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/15",
    label: "Mood",
    value: "Feeling good",
    cardColor: "bg-violet-500/10 border-violet-500/20",
    style: { top: "4%", left: "2%", animationDelay: "0s", animationDuration: "4.2s" },
  },
  {
    icon: Moon02Icon,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-500/15",
    label: "Sleep",
    value: "7.5h last night",
    cardColor: "bg-sky-500/10 border-sky-500/20",
    style: { top: "8%", right: "0%", animationDelay: "0.8s", animationDuration: "5s" },
  },
  {
    icon: DropletIcon,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/15",
    label: "Water",
    value: "6 / 8 glasses",
    cardColor: "bg-cyan-500/10 border-cyan-500/20",
    style: { bottom: "18%", left: "0%", animationDelay: "1.6s", animationDuration: "4.6s" },
  },
  {
    icon: CheckListIcon,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/15",
    label: "Habits",
    value: "3 / 4 done",
    cardColor: "bg-emerald-500/10 border-emerald-500/20",
    style: { bottom: "8%", right: "2%", animationDelay: "2.4s", animationDuration: "5.4s" },
  },
  {
    icon: Dumbbell01Icon,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/15",
    label: "Fitness",
    value: "240 kcal",
    cardColor: "bg-orange-500/10 border-orange-500/20",
    style: { top: "44%", right: "-2%", animationDelay: "1.2s", animationDuration: "4.8s" },
  },
];

/**
 * Hero — the opening section of the /welcome marketing page. Two columns on
 * large screens: warm copy + sign-up CTAs on the left, a floating module
 * constellation around the illustration on the right. Content fades up on load
 * in a gentle stagger. Renders GoogleLogin (a Client Component) as-is.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-32 lg:flex lg:min-h-[calc(100vh-4rem)] lg:items-center">
      {/* Whisper-faint monochrome glow behind the content. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--muted),transparent_70%)] opacity-60"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-16 px-6 md:px-16 lg:flex-row lg:justify-between">
        {/* Left — copy + CTAs */}
        <div className="w-full max-w-lg shrink-0 space-y-10">
          <div className="space-y-4">
            <h1
              className="animate-fade-in-up text-4xl font-semibold leading-[1.15] tracking-tight md:text-5xl"
              style={{ animationDelay: "0.1s" }}
            >
              A better way to
              <br />
              take care of yourself.
            </h1>
            <p
              className="animate-fade-in-up max-w-md text-base leading-relaxed text-muted-foreground"
              style={{ animationDelay: "0.25s" }}
            >
              Habits, mood, sleep, hydration, fitness, and insights — organized
              in one place.
            </p>
          </div>

          <div
            className="animate-fade-in-up max-w-sm"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              render={<Link href="/register" />}
              nativeButton={false}
              className="h-11 w-full font-medium"
            >
              Create an account
              <ArrowRight01Icon className="ml-2 h-4 w-4" />
            </Button>

            <div className="flex items-center gap-3 py-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GoogleLogin />

            <Button
              render={<Link href="/phone-login" />}
              nativeButton={false}
              variant="outline"
              className="mt-3 flex h-12 w-full items-center justify-center gap-3 border-border hover:bg-accent"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Continue with phone
            </Button>
          </div>

          <p
            className="animate-fade-in text-xs text-muted-foreground"
            style={{ animationDelay: "0.6s" }}
          >
            Free to use. No credit card needed.
          </p>
        </div>

        {/* Right — animated illustration composition */}
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="relative aspect-square w-full max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustration.svg"
              alt="A calm illustration of daily wellness"
              className="h-full w-full select-none object-contain"
              draggable={false}
            />

            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.label}
                  className={`animate-float-sm absolute flex items-center gap-2.5 rounded-xl border px-3 py-2 backdrop-blur-sm ${mod.cardColor}`}
                  style={mod.style}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${mod.iconBg}`}
                  >
                    <Icon className={`h-4 w-4 ${mod.iconColor}`} />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                      {mod.label}
                    </p>
                    <p className="text-xs font-semibold leading-none">
                      {mod.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gentle scroll cue (md and up). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex">
        <ArrowDown01Icon className="h-5 w-5 animate-bounce text-muted-foreground" />
      </div>
    </section>
  );
}
