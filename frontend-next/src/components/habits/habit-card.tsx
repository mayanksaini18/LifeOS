"use client";

import { useState } from "react";
import { Tick01Icon, SnowIcon, ArrowDown01Icon, ArrowUp01Icon, PencilEdit01Icon } from "hugeicons-react";
import { HabitHeatmap } from "./habit-heatmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useUpdateHabit } from "@/hooks/use-habits";
import { toast } from "sonner";
import type { Habit } from "@/types/habit";

interface HabitCardProps {
  habit: Habit;
  onCheckin: () => void;
  pending?: boolean;
}

export function HabitCard({ habit, onCheckin, pending = false }: HabitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(habit.title);
  const [description, setDescription] = useState(habit.description ?? "");
  const [frequency, setFrequency] = useState(habit.frequency);
  const updateHabit = useUpdateHabit();

  const hasCheckedToday = (habit.checkins || []).some((c) => {
    try {
      const d = new Date(c.date);
      const t = new Date();
      return (
        d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate()
      );
    } catch {
      return false;
    }
  });

  const hasFreezeAvailable = (habit.freezesAvailable ?? 1) > 0;

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setTitle(habit.title);
    setDescription(habit.description ?? "");
    setFrequency(habit.frequency);
    setEditOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await updateHabit.mutateAsync({
        id: habit._id,
        data: {
          title: title.trim(),
          description: description.trim(),
          frequency,
        },
      });
      toast.success("Habit updated!");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update habit");
    }
  }

  return (
    <>
      <div className={`border rounded-xl transition-colors ${hasCheckedToday ? "bg-muted/30" : ""}`}>
        {/* Main row */}
        <div className="p-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-medium truncate">{habit.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">
                {habit.streak > 0 ? `${habit.streak} day streak` : habit.frequency}
              </p>
              {hasFreezeAvailable && !hasCheckedToday && habit.streak > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-xs text-blue-500"
                  title="Streak freeze available — miss a day and your streak is protected"
                >
                  <SnowIcon className="h-3 w-3" />
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Edit button */}
            <button
              type="button"
              onClick={openEdit}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit habit"
            >
              <PencilEdit01Icon className="h-3.5 w-3.5" />
            </button>

            {/* Expand toggle */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {expanded
                ? <ArrowUp01Icon className="h-3.5 w-3.5" />
                : <ArrowDown01Icon className="h-3.5 w-3.5" />}
            </button>

            {/* Check circle */}
            <button
              type="button"
              onClick={hasCheckedToday || pending ? undefined : onCheckin}
              disabled={hasCheckedToday || pending}
              className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                hasCheckedToday
                  ? "bg-foreground border-foreground text-background"
                  : "border-border cursor-pointer hover:border-foreground/50"
              }`}
            >
              {hasCheckedToday && <Tick01Icon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Heatmap (expanded) */}
        {expanded && (
          <div className="px-4 pb-4 border-t pt-4">
            <p className="text-xs text-muted-foreground mb-3">Last {16 * 7} days</p>
            <HabitHeatmap habit={habit} />
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
            <DialogDescription>
              Update your habit details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning run"
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => { if (v) setFrequency(v as Habit["frequency"]); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateHabit.isPending}>
                {updateHabit.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
