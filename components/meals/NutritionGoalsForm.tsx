"use client";

import type { Profile, UserSettings } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { updateSettings } from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { calculateNutritionRecommendation, type NutritionRecommendation } from "@/lib/recommendations";

type GoalKey = Exclude<keyof NutritionRecommendation, "bmi">;
type GoalValues = Record<GoalKey, number>;
type ProfileValues = { heightFeet: string; heightInchesRemainder: string; weightLb: string; age: string; gender: string };

const goalFields: Array<{ key: GoalKey; label: string; step?: string }> = [
  { key: "dailyCalorieGoal", label: "Calories" }, { key: "dailyProteinGoal", label: "Protein g" },
  { key: "dailyCarbGoal", label: "Carbs g" }, { key: "dailyFatGoal", label: "Fat g" },
  { key: "dailyFiberGoal", label: "Fiber g" }, { key: "dailyWaterGoal", label: "Water oz" },
  { key: "dailyVitaminAGoal", label: "Vitamin A mcg RAE", step: "0.1" },
  { key: "dailyVitaminCGoal", label: "Vitamin C mg", step: "0.1" },
  { key: "dailyVitaminDGoal", label: "Vitamin D mcg", step: "0.1" },
  { key: "dailyVitaminB12Goal", label: "Vitamin B12 mcg", step: "0.1" },
  { key: "dailyCalciumGoal", label: "Calcium mg", step: "0.1" },
  { key: "dailyIronGoal", label: "Iron mg", step: "0.1" },
  { key: "dailyMagnesiumGoal", label: "Magnesium mg", step: "0.1" },
  { key: "dailyPotassiumGoal", label: "Potassium mg", step: "0.1" },
  { key: "dailyZincGoal", label: "Zinc mg", step: "0.1" },
  { key: "dailySodiumLimit", label: "Sodium limit mg", step: "0.1" },
];

function goalsFrom(source: UserSettings | NutritionRecommendation): GoalValues {
  return Object.fromEntries(goalFields.map(({ key }) => [key, source[key]])) as GoalValues;
}

export function NutritionGoalsForm({ settings, profile, recommendation, showProfileMetrics = false }: {
  settings: UserSettings; profile?: Profile; recommendation?: NutritionRecommendation | null; showProfileMetrics?: boolean;
}) {
  const [profileValues, setProfileValues] = useState<ProfileValues>({
    heightFeet: profile?.heightInches ? String(Math.floor(profile.heightInches / 12)) : "",
    heightInchesRemainder: profile?.heightInches ? String(Math.round(profile.heightInches % 12)) : "",
    weightLb: profile?.weightLb ? String(profile.weightLb) : "", age: profile?.age ? String(profile.age) : "", gender: profile?.gender ?? "",
  });
  const [estimate, setEstimate] = useState<NutritionRecommendation | null>(recommendation ?? null);
  const [goals, setGoals] = useState<GoalValues>(() => goalsFrom(settings.useRecommendedGoals && recommendation ? recommendation : settings));
  const [goalMode, setGoalMode] = useState<"recommended" | "custom">(settings.useRecommendedGoals ? "recommended" : "custom");
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [hasChanges, setHasChanges] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    setSaveState("saving");
    const timer = setTimeout(async () => {
      const data = new FormData();
      data.set("includeProfileMetrics", String(showProfileMetrics));
      Object.entries(profileValues).forEach(([key, value]) => data.set(key, value));
      Object.entries(goals).forEach(([key, value]) => data.set(key, String(value)));
      data.set("goalMode", goalMode);
      await updateSettings(data);
      setSaveState("saved");
    }, 500);
    return () => clearTimeout(timer);
  }, [goalMode, goals, profileValues, showProfileMetrics]);

  useEffect(() => {
    if (!hasChanges) return;
    const summary = () => `Confirm your saved settings before leaving:\nHeight: ${profileValues.heightFeet || "–"} ft ${profileValues.heightInchesRemainder || "–"} in\nWeight: ${profileValues.weightLb || "–"} lb\nAge: ${profileValues.age || "–"}\nGender: ${profileValues.gender || "–"}\nNutrition targets: ${goalMode === "recommended" ? "estimated from profile" : "manually customized"}`;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const confirmNavigation = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a");
      if (anchor && !window.confirm(summary())) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", confirmNavigation, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", confirmNavigation, true); };
  }, [goalMode, hasChanges, profileValues]);

  function updateProfile(key: keyof ProfileValues, value: string) {
    const next = { ...profileValues, [key]: value };
    setProfileValues(next);
    setHasChanges(true);
    const calculated = calculateNutritionRecommendation({
      heightInches: (Number(next.heightFeet) || 0) * 12 + (Number(next.heightInchesRemainder) || 0),
      weightLb: Number(next.weightLb) || null, age: Number(next.age) || null, gender: next.gender || null,
    });
    setEstimate(calculated);
    if (calculated) { setGoals(goalsFrom(calculated)); setGoalMode("recommended"); }
  }

  function updateGoal(key: GoalKey, value: string) {
    setGoals((current) => ({ ...current, [key]: Number(value) || 0 }));
    setGoalMode("custom");
    setHasChanges(true);
  }

  const macroFields = goalFields.slice(0, 6);
  const microFields = goalFields.slice(6);

  return (
    <Card>
      <CardHeader title="Body profile and nutrition targets" description="Profile changes replace every target with a fresh estimate. Editing any target afterwards saves it as a custom value." />
      <div className="mb-4 flex justify-end text-xs text-muted" aria-live="polite">{saveState === "saving" ? "Saving changes…" : `All changes saved · ${goalMode === "recommended" ? "Estimated targets" : "Custom targets"}`}</div>
      <div className="grid gap-4 xl:grid-cols-2">
        {showProfileMetrics ? <>
          <div className="rounded-md border border-line bg-black/15 p-3">
            <h3 className="text-sm font-semibold">Profile metrics</h3>
            <p className="mt-1 text-sm text-muted">Completing these fields recalculates and saves all nutrition targets.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Height ft"><Input type="number" min="0" value={profileValues.heightFeet} onChange={(e) => updateProfile("heightFeet", e.target.value)} /></Field>
              <Field label="Height in"><Input type="number" min="0" max="11" value={profileValues.heightInchesRemainder} onChange={(e) => updateProfile("heightInchesRemainder", e.target.value)} /></Field>
              <Field label="Weight lb"><Input type="number" min="0" step="0.1" value={profileValues.weightLb} onChange={(e) => updateProfile("weightLb", e.target.value)} /></Field>
              <Field label="Age"><Input type="number" min="0" value={profileValues.age} onChange={(e) => updateProfile("age", e.target.value)} /></Field>
              <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink">Gender</span><select value={profileValues.gender} onChange={(e) => updateProfile("gender", e.target.value)} className="min-h-11 w-full rounded-md border border-line bg-black/20 px-3 text-sm text-ink"><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option></select></label>
            </div>
          </div>
          <div className="rounded-md border border-line bg-black/15 p-3">
            <h3 className="text-sm font-semibold">Recommended estimate</h3>
            {estimate ? <><p className="mt-1 text-sm text-muted">Live estimate based on BMI {estimate.bmi}. These values are already populated below.</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{goalFields.map(({ key, label }) => <span key={key}>{label}: {estimate[key]}</span>)}</div></> : <p className="mt-3 text-sm text-muted">Enter height, weight, age, and gender to generate estimates.</p>}
          </div>
        </> : null}
        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">{macroFields.map(({ key, label, step }) => <Field key={key} label={label}><Input type="number" step={step} value={goals[key]} onChange={(e) => updateGoal(key, e.target.value)} /></Field>)}</div>
        <div className="content-start"><h3 className="mb-3 text-sm font-semibold">Daily micronutrient goals</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{microFields.map(({ key, label, step }) => <Field key={key} label={label}><Input type="number" step={step} value={goals[key]} onChange={(e) => updateGoal(key, e.target.value)} /></Field>)}</div></div>
      </div>
    </Card>
  );
}
