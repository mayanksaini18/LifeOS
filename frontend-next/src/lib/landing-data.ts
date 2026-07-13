import type { ComponentType } from "react";
import {
  SmileIcon,
  Moon02Icon,
  DropletIcon,
  CheckListIcon,
  Dumbbell01Icon,
  Analytics01Icon,
} from "hugeicons-react";

export type IconType = ComponentType<{
  className?: string;
  size?: number;
  strokeWidth?: number;
}>;

/**
 * Landing modules — the canonical accent-color system for the marketing page.
 * Tailwind can't derive class names from variables, so every accent is written
 * as a full literal string (matching the pattern used on the dashboard and the
 * original welcome hero). Structural accents (tiles, borders) stay at /10–/20;
 * the solid `bar` token is reserved for tiny data-viz marks (meters/sparklines),
 * mirroring the dashboard's colored GoalBar.
 */
export interface LandingModule {
  key: string;
  href: string;
  icon: IconType;
  label: string;
  blurb: string;
  /** e.g. "text-violet-500" */
  iconColor: string;
  /** e.g. "bg-violet-500/10" — the icon tile fill */
  iconBg: string;
  /** e.g. "border-violet-500/20" */
  ring: string;
  /** e.g. "bg-violet-500" — solid accent for tiny meters/sparklines */
  bar: string;
}

export const LANDING_MODULES: LandingModule[] = [
  {
    key: "mood",
    href: "/mood",
    icon: SmileIcon,
    label: "Mood",
    blurb: "Notice how you feel and spot what quietly lifts you.",
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
    ring: "border-violet-500/20",
    bar: "bg-violet-500",
  },
  {
    key: "sleep",
    href: "/sleep",
    icon: Moon02Icon,
    label: "Sleep",
    blurb: "Track your rest and wake up to gentle, honest trends.",
    iconColor: "text-sky-500",
    iconBg: "bg-sky-500/10",
    ring: "border-sky-500/20",
    bar: "bg-sky-500",
  },
  {
    key: "water",
    href: "/water",
    icon: DropletIcon,
    label: "Water",
    blurb: "Stay hydrated with a single tap — one glass at a time.",
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/10",
    ring: "border-cyan-500/20",
    bar: "bg-cyan-500",
  },
  {
    key: "habits",
    href: "/habits",
    icon: CheckListIcon,
    label: "Habits",
    blurb: "Build small routines that quietly add up over time.",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    ring: "border-emerald-500/20",
    bar: "bg-emerald-500",
  },
  {
    key: "fitness",
    href: "/fitness",
    icon: Dumbbell01Icon,
    label: "Fitness",
    blurb: "Log movement and celebrate every active day.",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    ring: "border-orange-500/20",
    bar: "bg-orange-500",
  },
  {
    key: "insights",
    href: "/insights",
    icon: Analytics01Icon,
    label: "Insights",
    blurb: "See the patterns your week has been hiding from you.",
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    ring: "border-indigo-500/20",
    bar: "bg-indigo-500",
  },
];

export interface LandingStep {
  n: string;
  title: string;
  blurb: string;
}

export const LANDING_STEPS: LandingStep[] = [
  {
    n: "01",
    title: "Track it",
    blurb:
      "Log mood, sleep, water, habits, and workouts in seconds — no fuss, no friction.",
  },
  {
    n: "02",
    title: "Understand it",
    blurb:
      "Clear charts and a gentle AI companion surface what's really going on beneath the day-to-day.",
  },
  {
    n: "03",
    title: "Keep going",
    blurb:
      "Streaks, levels, and light weekly challenges make showing up feel good — so it lasts.",
  },
];

export const NAV_LINKS = [
  { href: "#modules", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#insights", label: "Insights" },
];
