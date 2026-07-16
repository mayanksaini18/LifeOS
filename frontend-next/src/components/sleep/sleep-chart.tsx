"use client";

import { useSleepStats } from "@/hooks/use-sleep";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartScaleColors, useModuleChartColors } from "@/lib/chart-theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function SleepChart() {
  const { data: stats, isLoading } = useSleepStats();
  const scale = useChartScaleColors();
  const C = useModuleChartColors().sleep;

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (!stats || stats.entries.length === 0) {
    return (
      <div className="border border-dashed rounded-xl py-12 text-center">
        <img src="/sleep.svg" alt="" className="h-24 mx-auto mb-4 select-none opacity-60" draggable={false} />
        <p className="text-sm text-muted-foreground">No sleep data yet.</p>
      </div>
    );
  }

  const labels = stats.entries.map((e) =>
    new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-xl p-4">
          <p className="text-2xl font-semibold">{stats.avgDuration}h</p>
          <p className="text-xs text-muted-foreground mt-1">Avg duration</p>
        </div>
        <div className="border rounded-xl p-4">
          <p className="text-2xl font-semibold">{stats.avgQuality}/5</p>
          <p className="text-xs text-muted-foreground mt-1">Avg quality</p>
        </div>
        <div className="border rounded-xl p-4">
          <p className="text-2xl font-semibold">{stats.totalEntries}</p>
          <p className="text-xs text-muted-foreground mt-1">Entries</p>
        </div>
      </div>

      <div className="border rounded-xl p-6">
        <h3 className="font-medium text-sm mb-4">Sleep duration</h3>
        <Bar
          data={{
            labels,
            datasets: [{
              label: "Hours",
              data: stats.entries.map((e) => e.duration),
              backgroundColor: C.bar,
              hoverBackgroundColor: C.barHover,
              borderRadius: 6,
              borderSkipped: false,
            }],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true, max: 12,
                border: { display: false },
                grid: { color: scale.grid },
                ticks: { color: scale.tickColor },
              },
              x: {
                border: { display: false },
                grid: { display: false },
                ticks: { color: scale.tickColor },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
