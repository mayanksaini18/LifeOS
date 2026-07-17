import { HabitGrid } from "@/components/habits/habit-grid";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { ModuleWidgets } from "@/components/dashboard/module-widgets";
import { WeeklyChallenges } from "@/components/dashboard/weekly-challenges";
import { Button } from "@/components/ui/button";
import { PlusSignIcon } from "hugeicons-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";

function greetingFor(timeZone?: string) {
  // Hour in the user's timezone (falls back to server time if unknown/invalid).
  let hour: number;
  try {
    hour = Number(
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: timeZone || "UTC" }).format(new Date())
    );
  } catch {
    hour = new Date().getHours();
  }
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

export default async function DashboardPage() {
  const user = await getSession();

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good {greetingFor(user?.timezone)}, {user?.name?.split(" ")[0] || "there"}.
          </h1>
          <p className="text-muted-foreground mt-1">Here&apos;s your overview for today.</p>
        </div>
        <img
          src="/dashboard.svg"
          alt=""
          className="hidden md:block h-24 select-none opacity-80"
          draggable={false}
        />
      </div>

      <ModuleWidgets />

      <WeeklyChallenges />

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight">Habits</h2>
          <Link href="/habits/new">
            <Button variant="outline" size="sm">
              <PlusSignIcon className="w-3.5 h-3.5 mr-1.5" /> New habit
            </Button>
          </Link>
        </div>
        <HabitGrid />
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight mb-6">Weekly progress</h2>
        <WeeklyChart xp={user?.xp ?? 0} level={user?.level ?? 1} />
      </section>
    </div>
  );
}
