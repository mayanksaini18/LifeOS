"use client";

import type { Habit } from "@/types/habit";

interface Props {
  habit: Habit;
}

const WEEKS = 16;

function getDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function HabitHeatmap({ habit }: Props) {
  const checkinSet = new Set(
    (habit.checkins ?? []).map((c) => getDateKey(new Date(c.date)))
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the start date: go back enough days so that after padding to
  // Sunday the grid has exactly WEEKS columns ending on today's week.
  const todayDay = today.getDay(); // 0=Sun
  const endOfGrid = new Date(today);
  endOfGrid.setDate(today.getDate() + (6 - todayDay)); // Saturday of this week

  const startOfGrid = new Date(endOfGrid);
  startOfGrid.setDate(endOfGrid.getDate() - WEEKS * 7 + 1); // Sunday, WEEKS ago

  const totalCells = WEEKS * 7;

  const cells: { dateKey: string; checked: boolean; isToday: boolean; future: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startOfGrid);
    d.setDate(startOfGrid.getDate() + i);
    const dateKey = getDateKey(d);
    const isToday = dateKey === getDateKey(today);
    const future = d > today;
    cells.push({ dateKey, checked: checkinSet.has(dateKey), isToday, future });
  }

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  for (let col = 0; col < WEEKS; col++) {
    const d = new Date(startOfGrid);
    d.setDate(startOfGrid.getDate() + col * 7);
    if (d.getMonth() !== lastMonth) {
      monthLabels.push({
        label: d.toLocaleDateString("en-US", { month: "short" }),
        col,
      });
      lastMonth = d.getMonth();
    }
  }

  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysShown = cells.filter((c) => !c.future).length;

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div
        className="grid text-[10px] text-muted-foreground"
        style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: WEEKS }).map((_, col) => {
          const label = monthLabels.find((m) => m.col === col);
          return <span key={col}>{label?.label ?? ""}</span>;
        })}
      </div>

      {/* Heatmap grid: 7 rows × WEEKS cols */}
      <div className="flex gap-1">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-1 mr-1">
          {weekLabels.map((d, i) => (
            <span
              key={d}
              className="text-[9px] text-muted-foreground leading-none"
              style={{ height: 12, lineHeight: "12px", visibility: i % 2 === 0 ? "hidden" : "visible" }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Columns (weeks) */}
        <div
          className="grid gap-1 flex-1"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: WEEKS }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const cell = cells[weekIdx * 7 + dayIdx];
                if (!cell || cell.future) {
                  return <div key={dayIdx} className="aspect-square rounded-sm" />;
                }
                return (
                  <div
                    key={dayIdx}
                    title={cell.dateKey}
                    className={`aspect-square rounded-sm transition-colors ${
                      cell.checked
                        ? "bg-module-habits"
                        : cell.isToday
                        ? "bg-muted-foreground/20 ring-1 ring-muted-foreground/40"
                        : "bg-muted"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-muted" />
        <div className="w-2.5 h-2.5 rounded-sm bg-module-habits/40" />
        <div className="w-2.5 h-2.5 rounded-sm bg-module-habits" />
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
