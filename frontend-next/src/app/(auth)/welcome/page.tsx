import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleLogin } from "@/components/auth/google-login";
import { ArrowRight01Icon } from "hugeicons-react";
import {
  SmileIcon,
  Moon02Icon,
  DropletIcon,
  CheckListIcon,
  Dumbbell01Icon,
} from "hugeicons-react";
import type { ComponentType } from "react";

interface Module {
  icon: ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  cardColor: string;
  style: React.CSSProperties;
}

const modules: Module[] = [
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

export default function WelcomePage() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 animate-fade-in">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lifeos-logo.svg" alt="" className="h-8 w-auto" />
          <span className="text-lg font-semibold tracking-tight">LifeOS</span>
        </div>
        <Link href="/login">
          <Button variant="ghost" size="sm">Sign in</Button>
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center px-6 md:px-16">
        <div className="flex items-center justify-between w-full gap-16">

          {/* Left — Copy */}
          <div className="w-full max-w-lg space-y-10 shrink-0">
            <div className="space-y-4">
              <h1
                className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.15] animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                A better way to
                <br />
                take care of yourself.
              </h1>
              <p
                className="text-muted-foreground text-base leading-relaxed max-w-md animate-fade-in-up"
                style={{ animationDelay: "0.25s" }}
              >
                Habits, mood, sleep, hydration, fitness, and insights
                — organized in one place.
              </p>
            </div>

            <div
              className="space-y-0 max-w-sm animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <Link href="/register">
                <Button className="w-full h-11 font-medium">
                  Create an account
                  <ArrowRight01Icon className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <div className="flex items-center gap-3 py-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <GoogleLogin />

              <Button
                render={<Link href="/phone-login" />}
                variant="outline"
                className="w-full h-12 mt-3 border-border hover:bg-accent flex items-center justify-center gap-3"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Continue with phone
              </Button>
            </div>

            <p
              className="text-xs text-muted-foreground animate-fade-in"
              style={{ animationDelay: "0.6s" }}
            >
              Free to use. No credit card needed.
            </p>
          </div>

          {/* Right — Animated illustration composition */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="relative w-full max-w-md aspect-square">

              {/* Main illustration — static */}
              <img
                src="/illustration.svg"
                alt="Wellness illustration"
                className="w-full h-full object-contain select-none"
                draggable={false}
              />

              {/* Floating module badges */}
              {modules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.label}
                    className={`animate-float-sm absolute flex items-center gap-2.5 px-3 py-2 rounded-xl border backdrop-blur-sm ${mod.cardColor}`}
                    style={mod.style}
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${mod.iconBg}`}>
                      <Icon className={`h-4 w-4 ${mod.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">{mod.label}</p>
                      <p className="text-xs font-semibold leading-none">{mod.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-6 animate-fade-in" style={{ animationDelay: "0.7s" }}>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LifeOS
        </p>
      </footer>
    </div>
  );
}
