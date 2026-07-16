"use client";

import { SmileIcon, Moon02Icon, DropletIcon, Dumbbell01Icon, Sad01Icon, UnhappyIcon, NeutralIcon, Happy01Icon } from "hugeicons-react";
import type { ComponentType } from "react";
import { useMoods } from "@/hooks/use-mood";
import { useSleepHistory } from "@/hooks/use-sleep";
import { useWaterToday } from "@/hooks/use-water";
import { useFitnessStats } from "@/hooks/use-fitness";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";

const MOOD_ICON: Record<number, ComponentType<{ className?: string }>> = {
  1: Sad01Icon,
  2: UnhappyIcon,
  3: NeutralIcon,
  4: SmileIcon,
  5: Happy01Icon,
};

const MOOD_COLOR: Record<number, string> = {
  1: "text-red-400",
  2: "text-orange-400",
  3: "text-yellow-400",
  4: "text-emerald-400",
  5: "text-violet-400",
};

function GoalBar({ value, max, colorClass = "bg-foreground" }: { value: number; max: number; colorClass?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-400" : colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ModuleWidgets() {
  const { data: moods } = useMoods(1);
  const { data: sleeps } = useSleepHistory(1);
  const { data: water } = useWaterToday();
  const { data: fitness } = useFitnessStats();
  const goals = useAuthStore((s) => s.user?.goals);

  const latestMood = moods?.[0];
  const latestSleep = sleeps?.[0];
  const glasses = water?.glasses ?? 0;
  const waterGoal = goals?.water ?? water?.goal ?? 8;
  const sleepGoal = goals?.sleep ?? 7;
  const exerciseGoal = goals?.exercise ?? 4;
  const moodGoal = goals?.mood ?? 3;
  const activeDays = fitness?.activeDays ?? 0;

  const widgets = [
    {
      href: "/mood",
      icon: (() => {
        const Icon = latestMood ? (MOOD_ICON[latestMood.score] ?? SmileIcon) : SmileIcon;
        const color = latestMood ? (MOOD_COLOR[latestMood.score] ?? "text-muted-foreground") : "text-muted-foreground";
        return <Icon className={`h-4 w-4 ${color}`} />;
      })(),
      label: "Mood",
      value: latestMood ? `${latestMood.score}/5` : "No entry",
      bar: latestMood ? <GoalBar value={latestMood.score} max={moodGoal} colorClass="bg-module-mood" /> : null,
      subtext: latestMood
        ? latestMood.energy
          ? `⚡ Energy ${latestMood.energy}/5 · Goal ≥ ${moodGoal}/5`
          : `Goal ≥ ${moodGoal}/5`
        : null,
    },
    {
      href: "/sleep",
      icon: <Moon02Icon className="h-4 w-4 text-muted-foreground" />,
      label: "Sleep",
      value: latestSleep ? `${latestSleep.duration}h` : "No entry",
      bar: latestSleep ? <GoalBar value={latestSleep.duration} max={sleepGoal} colorClass="bg-module-sleep" /> : null,
      subtext: latestSleep ? `Goal ${sleepGoal}h` : null,
    },
    {
      href: "/water",
      icon: <DropletIcon className="h-4 w-4 text-muted-foreground" />,
      label: "Water",
      value: `${glasses}/${waterGoal}`,
      // NOTE: this bar has always rendered in the sleep module's hue, not
      // water's cyan (likely a copy-paste artifact from the widget above).
      // Preserved verbatim as module-sleep during this literal-to-token
      // migration rather than silently reassigning it. Flag for a follow-up
      // fix if unintentional.
      bar: <GoalBar value={glasses} max={waterGoal} colorClass="bg-module-sleep" />,
      subtext: `Goal ${waterGoal} glasses`,
    },
    {
      href: "/fitness",
      icon: <Dumbbell01Icon className="h-4 w-4 text-muted-foreground" />,
      label: "Fitness",
      value: `${activeDays}/${exerciseGoal} days`,
      // NOTE: this bar has always rendered in the habits module's hue, not
      // fitness's orange (likely a copy-paste artifact). Preserved verbatim
      // as module-habits during this literal-to-token migration rather than
      // silently reassigning it. Flag for a follow-up fix if unintentional.
      bar: <GoalBar value={activeDays} max={exerciseGoal} colorClass="bg-module-habits" />,
      subtext: `Goal ${exerciseGoal} days/week`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
      {widgets.map((w) => (
        <Link key={w.href} href={w.href} className="h-full">
          <div className="h-full border rounded-xl p-4 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              {w.icon}
              <span className="text-xs text-muted-foreground">{w.label}</span>
            </div>
            <p className="text-lg font-semibold tracking-tight">{w.value}</p>
            {w.bar}
            <p className="text-[10px] text-muted-foreground mt-1 min-h-[14px]">
              {w.subtext ?? ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
