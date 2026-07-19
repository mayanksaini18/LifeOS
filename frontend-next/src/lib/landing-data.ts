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
 * Landing modules — the canonical accent system for the marketing page.
 * Accents reference the `--color-module-*` tokens in globals.css, so a retune
 * happens in one place. Structural accents (tiles, borders) stay at /10–/20;
 * the solid `bar` token is reserved for tiny data-viz marks (meters/sparklines),
 * mirroring the dashboard's colored GoalBar.
 */
export interface LandingModule {
  key: string;
  href: string;
  icon: IconType;
  label: string;
  blurb: string;
  /** e.g. "text-module-mood" */
  iconColor: string;
  /** e.g. "bg-module-mood/10" — the icon tile fill */
  iconBg: string;
  /** e.g. "border-module-mood/20" */
  ring: string;
  /** e.g. "bg-module-mood" — solid accent for tiny meters/sparklines */
  bar: string;
}

export const LANDING_MODULES: LandingModule[] = [
  {
    key: "mood",
    href: "/mood",
    icon: SmileIcon,
    label: "Mood",
    blurb: "Notice how you feel and spot what quietly lifts you.",
    iconColor: "text-module-mood",
    iconBg: "bg-module-mood/10",
    ring: "border-module-mood/20",
    bar: "bg-module-mood",
  },
  {
    key: "sleep",
    href: "/sleep",
    icon: Moon02Icon,
    label: "Sleep",
    blurb: "Track your rest and wake up to gentle, honest trends.",
    iconColor: "text-module-sleep",
    iconBg: "bg-module-sleep/10",
    ring: "border-module-sleep/20",
    bar: "bg-module-sleep",
  },
  {
    key: "water",
    href: "/water",
    icon: DropletIcon,
    label: "Water",
    blurb: "Stay hydrated with a single tap — one glass at a time.",
    iconColor: "text-module-water",
    iconBg: "bg-module-water/10",
    ring: "border-module-water/20",
    bar: "bg-module-water",
  },
  {
    key: "habits",
    href: "/habits",
    icon: CheckListIcon,
    label: "Habits",
    blurb: "Build small routines that quietly add up over time.",
    iconColor: "text-module-habits",
    iconBg: "bg-module-habits/10",
    ring: "border-module-habits/20",
    bar: "bg-module-habits",
  },
  {
    key: "fitness",
    href: "/fitness",
    icon: Dumbbell01Icon,
    label: "Fitness",
    blurb: "Log movement and celebrate every active day.",
    iconColor: "text-module-fitness",
    iconBg: "bg-module-fitness/10",
    ring: "border-module-fitness/20",
    bar: "bg-module-fitness",
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
