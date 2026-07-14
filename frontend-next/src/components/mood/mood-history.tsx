"use client";

import { Button } from "@/components/ui/button";
import { Delete02Icon } from "hugeicons-react";
import { useMoods, useDeleteMood } from "@/hooks/use-mood";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const EMOJI_MAP: Record<number, string> = {
  1: "😢", 2: "😞", 3: "😐", 4: "😊", 5: "😄",
};

const SCORE_BG: Record<number, string> = {
  1: "bg-red-500/15 text-red-400",
  2: "bg-orange-500/15 text-orange-400",
  3: "bg-yellow-500/15 text-yellow-400",
  4: "bg-emerald-500/15 text-emerald-400",
  5: "bg-violet-500/15 text-violet-400",
};

export function MoodHistory() {
  const { data: moods, isLoading } = useMoods();
  const deleteMood = useDeleteMood();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!moods?.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No entries yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm mb-3">Recent entries</h3>
      {moods.map((mood) => (
        <div
          key={mood._id}
          className="flex items-center justify-between py-3 border-b last:border-0"
        >
          <div className="flex items-center gap-3">
            <span className={`text-xl w-9 h-9 flex items-center justify-center rounded-full ${SCORE_BG[mood.score]}`}>
              {EMOJI_MAP[mood.score]}
            </span>
            <div>
              <p className="text-sm font-medium">
                {new Date(mood.date).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                })}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {mood.energy != null && (
                  <span className="text-xs text-muted-foreground">⚡ {mood.energy}/5</span>
                )}
                {mood.tags.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {mood.tags.join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={deleteMood.isPending}
            onClick={async () => {
              try {
                await deleteMood.mutateAsync(mood._id);
                toast.success("Deleted");
              } catch {
                toast.error("Failed");
              }
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Delete02Icon className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
