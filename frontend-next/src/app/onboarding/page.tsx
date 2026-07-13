"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard, type GoalValues } from "@/components/onboarding/onboarding-wizard";
import { fetchApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.onboardingComplete) router.replace("/");
  }, [user, router]);

  function markLocalComplete(goals?: GoalValues) {
    if (!user) return;
    setUser({
      ...user,
      onboardingComplete: true,
      goals: goals ? { ...user.goals, ...goals } : user.goals,
    });
  }

  async function handleFinish(goals: GoalValues) {
    setSaving(true);
    setError(null);
    try {
      await fetchApi("/settings/goals", { method: "PUT", body: JSON.stringify(goals) });
      await fetchApi("/settings/onboarding-complete", { method: "PUT" });
      markLocalComplete(goals);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your goals. Please try again.");
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    setError(null);
    try {
      await fetchApi("/settings/onboarding-complete", { method: "PUT" });
      markLocalComplete();
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <OnboardingWizard onFinish={handleFinish} onSkip={handleSkip} saving={saving} error={error} />
    </main>
  );
}
