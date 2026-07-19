"use client";

import { useEffect } from "react";
import { useChallenges } from "@/hooks/use-challenges";
import { useAuthStore } from "@/stores/auth-store";
import type { Challenge } from "@/types/challenge";
import { ChampionIcon, CheckmarkCircle02Icon } from "hugeicons-react";
import { cn } from "@/lib/utils";

export function WeeklyChallenges() {
  const { data, isLoading } = useChallenges();
  const challenges = data?.challenges ?? [];

  // Challenge progress (and its XP payout) is computed server-side when this
  // loads, so sync the returned xp/level into the header/sidebar store.
  const updateUserStats = useAuthStore((s) => s.updateUserStats);
  const xp = data?.user?.xp;
  const level = data?.user?.level;
  useEffect(() => {
    if (typeof xp === "number" && typeof level === "number") {
      updateUserStats(xp, level);
    }
  }, [xp, level, updateUserStats]);

  if (isLoading) {
    return (
      <div className="border rounded-xl p-5 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          <div className="h-14 bg-muted rounded" />
          <div className="h-14 bg-muted rounded" />
          <div className="h-14 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (challenges.length === 0) return null;

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <section className="border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChampionIcon className="h-4 w-4" />
          <h2 className="text-sm font-medium">Weekly Challenges</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{challenges.length} done
        </span>
      </div>

      <div className="space-y-3">
        {challenges.map((c) => (
          <ChallengeRow key={c._id} challenge={c} />
        ))}
      </div>
    </section>
  );
}

function ChallengeRow({ challenge: c }: { challenge: Challenge }) {
  const pct = Math.min(100, Math.round((c.progress / c.target) * 100));

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2 transition-colors",
        c.completed && "bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate flex items-center gap-1.5">
            {c.completed && <CheckmarkCircle02Icon className="h-3.5 w-3.5 text-success shrink-0" />}
            {c.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
          +{c.xpReward} XP
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", c.completed ? "bg-success" : "bg-foreground")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
          {c.progress}/{c.target}
        </span>
      </div>
    </div>
  );
}
