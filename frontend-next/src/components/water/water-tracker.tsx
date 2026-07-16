"use client";

import { Button } from "@/components/ui/button";
import { PlusSignIcon, MinusSignIcon } from "hugeicons-react";
import { useWaterToday, useLogWater, useSetWaterGoal } from "@/hooks/use-water";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function WaterTracker() {
  const { data: water, isLoading } = useWaterToday();
  const logWater = useLogWater();
  const setGoal = useSetWaterGoal();

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const glasses = water?.glasses ?? 0;
  const goal = water?.goal ?? 8;
  const percentage = Math.min(Math.round((glasses / goal) * 100), 100);

  async function handleAdd() {
    try {
      await logWater.mutateAsync({});
      if (glasses + 1 >= goal) toast.success("Daily goal reached!");
    } catch { toast.error("Failed"); }
  }

  async function handleGoalChange(newGoal: number) {
    if (newGoal < 1 || newGoal > 50) return;
    try { await setGoal.mutateAsync(newGoal); } catch { toast.error("Failed"); }
  }

  return (
    <div className="space-y-8">
      <div className="text-center py-4">
        <p className="text-6xl font-semibold tracking-tight">{glasses}</p>
        <p className="text-muted-foreground mt-2">of {goal} glasses</p>
        <p className="text-xs text-muted-foreground mt-1">{percentage}%</p>
        <div className="w-full h-2 bg-muted rounded-full mt-3 max-w-xs mx-auto">
          <div
            // NOTE: this fill has always rendered in the sleep module's hue,
            // not water's cyan (same pre-existing mismatch as the dashboard
            // water widget). Preserved verbatim as module-sleep during this
            // literal-to-token migration. Flag for a follow-up fix if unintentional.
            className={`h-full rounded-full transition-all duration-300 ${percentage >= 100 ? "bg-success" : "bg-module-sleep"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <Button
        onClick={handleAdd}
        disabled={logWater.isPending}
        className="w-full h-10"
      >
        <PlusSignIcon className="h-4 w-4 mr-2" />
        Add glass
      </Button>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-muted-foreground">Daily goal</span>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" onClick={() => handleGoalChange(goal - 1)} disabled={goal <= 1}>
            <MinusSignIcon className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium w-6 text-center">{goal}</span>
          <Button variant="outline" size="icon-sm" onClick={() => handleGoalChange(goal + 1)} disabled={goal >= 50}>
            <PlusSignIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
