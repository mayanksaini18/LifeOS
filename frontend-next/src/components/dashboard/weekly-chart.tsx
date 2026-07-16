"use client";

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useWeeklyAnalytics } from "@/hooks/use-habits";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartScaleColors, useModuleChartColors } from "@/lib/chart-theme";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface StatsProps {
  xp: number;
  level: number;
}

export function WeeklyChart({ xp, level }: StatsProps) {
  const { data, isLoading, isError } = useWeeklyAnalytics();
  const scale = useChartScaleColors();
  const C = useModuleChartColors().weekly;

  const chartData = data
    ? {
        labels: data.map((d) => d.day),
        datasets: [{
          label: "Check-ins",
          data: data.map((d) => d.count),
          fill: true,
          borderColor: C.line,
          backgroundColor: C.fill,
          pointBackgroundColor: C.point,
          pointBorderColor: "transparent",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      }
    : null;

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-sm">Check-ins this week</h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Lvl {level}</span>
          <span>{xp} XP</span>
        </div>
      </div>

      <div className="h-52">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : isError ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Failed to load
          </div>
        ) : chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 11 }, color: scale.tickColor },
                  border: { display: false },
                },
                y: {
                  grid: { color: scale.grid },
                  ticks: { stepSize: 1, font: { size: 11 }, color: scale.tickColor },
                  border: { display: false },
                },
              },
              elements: { point: { radius: 4, hoverRadius: 6 } },
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
