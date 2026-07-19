"use client";

import { useWaterHistory } from "@/hooks/use-water";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartScaleColors, useModuleChartColors } from "@/lib/chart-theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function WaterHistory() {
  const { data: entries, isLoading } = useWaterHistory(14);
  const scale = useChartScaleColors();
  const C = useModuleChartColors().water;

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;

  const sorted = [...(entries || [])].reverse();

  if (sorted.length === 0) {
    return (
      <div className="border border-dashed rounded-xl py-12 text-center">
        <img src="/water.svg" alt="" className="h-24 mx-auto mb-4 select-none opacity-60" draggable={false} />
        <p className="text-sm text-muted-foreground">No history yet.</p>
      </div>
    );
  }

  const labels = sorted.map((e) =>
    new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  return (
    <div className="border rounded-xl p-6">
      <h3 className="font-medium text-sm mb-4">Last 14 days</h3>
      <Bar
        data={{
          labels,
          datasets: [{
            label: "Glasses",
            data: sorted.map((e) => e.glasses),
            backgroundColor: sorted.map((e) =>
              e.glasses >= e.goal ? C.barGoal : C.bar
            ),
            hoverBackgroundColor: C.barHover,
            borderRadius: 4,
          }],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
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
  );
}
