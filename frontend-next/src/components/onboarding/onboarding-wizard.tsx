"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface GoalValues {
  sleep: number;
  exercise: number;
  water: number;
}

interface StepDef {
  key: keyof GoalValues;
  title: string;
  prompt: string;
  unit: string;
  min: number;
  max: number;
}

const STEPS: StepDef[] = [
  { key: "sleep",    title: "Sleep",    prompt: "How many hours per night are you aiming for?", unit: "hours",     min: 1, max: 24 },
  { key: "water",    title: "Water",    prompt: "How many glasses a day is your goal?",         unit: "glasses",   min: 1, max: 50 },
  { key: "exercise", title: "Exercise", prompt: "How many days a week do you want to move?",   unit: "days / wk", min: 0, max: 7  },
];

const DEFAULTS: GoalValues = { sleep: 7, water: 8, exercise: 4 };

export interface OnboardingWizardProps {
  onFinish: (goals: GoalValues) => void;
  onSkip: () => void;
  saving?: boolean;
  error?: string | null;
  initial?: GoalValues;
}

export function OnboardingWizard({
  onFinish,
  onSkip,
  saving = false,
  error = null,
  initial = DEFAULTS,
}: OnboardingWizardProps) {
  const [values, setValues] = useState<GoalValues>(initial);
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const value = values[step.key];

  function setValue(next: number) {
    const clamped = Math.min(step.max, Math.max(step.min, next));
    setValues((v) => ({ ...v, [step.key]: clamped }));
  }

  function next() {
    if (isLast) onFinish(values);
    else setStepIndex((i) => i + 1);
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex gap-2" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-foreground" : "bg-muted"}`}
          />
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{step.title}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{step.prompt}</h1>
      </div>

      <div className="flex items-center justify-center gap-6 py-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-label="Decrease"
          onClick={() => setValue(value - 1)}
          disabled={saving || value <= step.min}
        >
          −
        </Button>
        <div className="min-w-24 text-center">
          <div className="text-4xl font-semibold tabular-nums">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{step.unit}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-label="Increase"
          onClick={() => setValue(value + 1)}
          disabled={saving || value >= step.max}
        >
          +
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <Button type="button" className="w-full h-10" onClick={next} disabled={saving}>
          {saving ? "Saving…" : isLast ? "Finish" : "Next"}
        </Button>
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={back} disabled={stepIndex === 0 || saving}>
            Back
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onSkip} disabled={saving}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
