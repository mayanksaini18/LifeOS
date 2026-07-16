"use client";

import { useMoodTrends } from "@/hooks/use-mood";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartScaleColors, useModuleChartColors, ENERGY_CHART_COLORS } from "@/lib/chart-theme";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

export function MoodChart() {
  const { data, isLoading } = useMoodTrends();
  const scale = useChartScaleColors();
  const CM = useModuleChartColors().mood;
  const CE = ENERGY_CHART_COLORS;

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;

  const trends = data?.trends ?? [];

  if (trends.length === 0) {
    return (
      <div className="border border-dashed rounded-xl py-12 text-center">
        <img src="/mood.svg" alt="" className="h-24 mx-auto mb-4 select-none opacity-60" draggable={false} />
        <p className="text-sm text-muted-foreground">Log your first mood to see trends here.</p>
      </div>
    );
  }

  const labels = trends.map((t) =>
    new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  const hasEnergy = trends.some((t) => t.energy != null);

  const datasets = [
    {
      label: "Mood",
      data: trends.map((t) => t.score),
      borderColor: CM.line,
      backgroundColor: CM.fill,
      pointBackgroundColor: CM.point,
      pointBorderColor: "transparent",
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
    ...(hasEnergy
      ? [
          {
            label: "Energy",
            data: trends.map((t) => t.energy),
            borderColor: CE.line,
            backgroundColor: CE.fill,
            pointBackgroundColor: CE.point,
            pointBorderColor: "transparent",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ]
      : []),
  ];

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">Mood & energy over time</h3>
        {data && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Avg mood: {data.avgScore}/5</span>
            {data.avgEnergy > 0 && <span>Avg energy: {data.avgEnergy}/5</span>}
          </div>
        )}
      </div>
      <Line
        data={{ labels, datasets }}
        options={{
          responsive: true,
          scales: {
            y: {
              min: 1,
              max: 5,
              ticks: { stepSize: 1, color: scale.tickColor },
              border: { display: false },
              grid: { color: scale.grid },
            },
            x: {
              border: { display: false },
              grid: { display: false },
              ticks: { color: scale.tickColor },
            },
          },
          plugins: {
            legend: {
              display: hasEnergy,
              labels: { boxWidth: 12, usePointStyle: true, pointStyle: "circle" },
            },
          },
        }}
      />
    </div>
  );
}
