"use client";

import type { Profile, UserSettings } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateSettings } from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { calculateNutritionRecommendation, type NutritionRecommendation } from "@/lib/recommendations";

type GoalKey = Exclude<keyof NutritionRecommendation, "bmi">;
type GoalValues = Record<GoalKey, number>;
type ProfileValues = { heightFeet: string; heightInchesRemainder: string; weightLb: string; age: string; gender: string; activityLevel: string };

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
    weightLb: profile?.weightLb ? String(profile.weightLb) : "", age: profile?.age ? String(profile.age) : "", gender: profile?.gender ?? "", activityLevel: profile?.activityLevel ?? "moderate",
  });
  const [estimate, setEstimate] = useState<NutritionRecommendation | null>(recommendation ?? null);
  const [goals, setGoals] = useState<GoalValues>(() => goalsFrom(settings.useRecommendedGoals && recommendation ? recommendation : settings));
  const [goalMode, setGoalMode] = useState<"recommended" | "custom">(settings.useRecommendedGoals ? "recommended" : "custom");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error" | "conflict">("saved");
  const [saveMessage, setSaveMessage] = useState("All changes saved.");
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const initialized = useRef(false);
  const versionRef = useRef(settings.updatedAt.toISOString());
  const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const latestRef = useRef({ profileValues, goals, goalMode });
  latestRef.current = { profileValues, goals, goalMode };

  const performPersist = useCallback(async (values: typeof latestRef.current) => {
    setSaveState("saving"); setSaveMessage("Saving changes…");
    const data = new FormData();
    data.set("includeProfileMetrics", String(showProfileMetrics));
    data.set("expectedUpdatedAt", versionRef.current);
    Object.entries(values.profileValues).forEach(([key, value]) => data.set(key, value));
    Object.entries(values.goals).forEach(([key, value]) => data.set(key, String(value)));
    data.set("goalMode", values.goalMode);
    const result = await updateSettings(data);
    if (result.status === "saved" && result.updatedAt) {
      versionRef.current = result.updatedAt; setSaveState("saved"); setSaveMessage(result.message);
      if (JSON.stringify(latestRef.current) === JSON.stringify(values)) setHasChanges(false);
      return true;
    }
    setSaveState(result.status); setSaveMessage(result.message); setHasChanges(true); return false;
  }, [showProfileMetrics]);

  const persist = useCallback((values: typeof latestRef.current) => {
    const queued = saveQueueRef.current.then(() => performPersist(values));
    saveQueueRef.current = queued;
    return queued;
  }, [performPersist]);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    const snapshot = { profileValues, goals, goalMode };
    const timer = setTimeout(() => { void persist(snapshot); }, 650);
    return () => clearTimeout(timer);
  }, [goalMode, goals, persist, profileValues]);

  useEffect(() => {
    if (!hasChanges) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const confirmNavigation = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (anchor && anchor.target !== "_blank" && anchor.href !== window.location.href) { event.preventDefault(); setPendingHref(anchor.href); }
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
      weightLb: Number(next.weightLb) || null, age: Number(next.age) || null, gender: next.gender || null, activityLevel: next.activityLevel || "moderate",
    });
    setEstimate(calculated);
    if (calculated) { setGoals(goalsFrom(calculated)); setGoalMode("recommended"); }
  }

  function updateGoal(key: GoalKey, value: string) {
    setGoals((current) => ({ ...current, [key]: Number(value) || 0 }));
    setGoalMode("custom");
    setHasChanges(true);
  }

  function restoreRecommendation(key?: GoalKey) {
    if (!estimate) return;
    if (key) { setGoals((current) => ({ ...current, [key]: estimate[key] })); setGoalMode("custom"); }
    else { setGoals(goalsFrom(estimate)); setGoalMode("recommended"); }
    setHasChanges(true);
  }

  const macroFields = goalFields.slice(0, 6);
  const microFields = goalFields.slice(6);

  return (
    <Card>
      <CardHeader title="Body profile and nutrition targets" description="Profile changes replace every target with a fresh estimate. Editing any target afterwards saves it as a custom value." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs" aria-live="polite"><span className={saveState === "error" || saveState === "conflict" ? "text-ember" : "text-muted"}>{saveMessage}</span><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 font-semibold ${goalMode === "recommended" ? "bg-core/15 text-core" : "bg-pulse/15 text-pulse"}`}>{goalMode === "recommended" ? "Recommended estimates active" : "Custom targets active"}</span>{estimate ? <button type="button" onClick={() => restoreRecommendation()} className="min-h-9 rounded-md border border-line px-3 text-ink">Restore all recommendations</button> : null}</div></div>
      <div className="grid gap-4 xl:grid-cols-2">
        {showProfileMetrics ? <>
          <div className="rounded-md border border-line bg-ink/[0.025] p-3">
            <h3 className="text-sm font-semibold">Profile metrics</h3>
            <p className="mt-1 text-sm text-muted">Completing these fields recalculates and saves all nutrition targets.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Height ft"><Input type="number" min="0" value={profileValues.heightFeet} onChange={(e) => updateProfile("heightFeet", e.target.value)} /></Field>
              <Field label="Height in"><Input type="number" min="0" max="11" value={profileValues.heightInchesRemainder} onChange={(e) => updateProfile("heightInchesRemainder", e.target.value)} /></Field>
              <Field label="Weight lb"><Input type="number" min="0" step="0.1" value={profileValues.weightLb} onChange={(e) => updateProfile("weightLb", e.target.value)} /></Field>
              <Field label="Age"><Input type="number" min="0" value={profileValues.age} onChange={(e) => updateProfile("age", e.target.value)} /></Field>
              <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink">Gender</span><select value={profileValues.gender} onChange={(e) => updateProfile("gender", e.target.value)} className="min-h-11 w-full rounded-md border border-line bg-ink/[0.04] px-3 text-sm text-ink"><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option></select></label>
              <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-medium text-ink">Activity level</span><select value={profileValues.activityLevel} onChange={(e) => updateProfile("activityLevel", e.target.value)} className="min-h-11 w-full rounded-md border border-line bg-ink/[0.04] px-3 text-sm text-ink"><option value="sedentary">Mostly sedentary</option><option value="light">Light activity (1–3 days/week)</option><option value="moderate">Moderate activity (3–5 days/week)</option><option value="very_active">Very active (6–7 days/week)</option></select></label>
            </div>
          </div>
          <div className="rounded-md border border-line bg-ink/[0.025] p-3">
            <h3 className="text-sm font-semibold">Recommended estimate</h3>
            {estimate ? <><p className="mt-1 text-sm text-muted">Live maintenance estimate using height, weight, age, sex, and activity; BMI {estimate.bmi} is context only. Micronutrient references primarily vary by age and sex.</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{goalFields.map(({ key, label }) => <span key={key}>{label}: {estimate[key]}</span>)}</div></> : <p className="mt-3 text-sm text-muted">Enter height, weight, age, and gender to generate estimates.</p>}
          </div>
        </> : null}
        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">{macroFields.map(({ key, label, step }) => <div key={key}><Field label={label}><Input type="number" min="0" step={step} value={goals[key]} onChange={(e) => updateGoal(key, e.target.value)} /></Field>{estimate && goals[key] !== estimate[key] ? <button type="button" onClick={() => restoreRecommendation(key)} className="mt-1 text-xs text-core">Restore recommended {estimate[key]}</button> : null}</div>)}</div>
        <div className="content-start"><h3 className="mb-3 text-sm font-semibold">Daily micronutrient goals</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{microFields.map(({ key, label, step }) => <div key={key}><Field label={label}><Input type="number" min="0" step={step} value={goals[key]} onChange={(e) => updateGoal(key, e.target.value)} /></Field>{estimate && goals[key] !== estimate[key] ? <button type="button" onClick={() => restoreRecommendation(key)} className="mt-1 text-xs text-core">Restore {estimate[key]}</button> : null}</div>)}</div></div>
      </div>
      {pendingHref ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="settings-leave-title"><div className="w-full max-w-lg rounded-lg border border-line bg-panel p-5 shadow-2xl"><h3 id="settings-leave-title" className="text-lg font-semibold">Unsaved settings</h3><p className="mt-2 text-sm text-muted">Review the profile information, then stay here or retry saving before continuing.</p><dl className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-line bg-ink/[0.025] p-3 text-sm"><dt className="text-muted">Height</dt><dd>{profileValues.heightFeet || "–"} ft {profileValues.heightInchesRemainder || "–"} in</dd><dt className="text-muted">Weight</dt><dd>{profileValues.weightLb || "–"} lb</dd><dt className="text-muted">Age</dt><dd>{profileValues.age || "–"}</dd><dt className="text-muted">Gender</dt><dd>{profileValues.gender || "–"}</dd><dt className="text-muted">Targets</dt><dd>{goalMode === "recommended" ? "Recommended estimates" : "Customized"}</dd></dl>{saveState === "error" || saveState === "conflict" ? <p className="mt-3 text-sm text-ember">{saveMessage}</p> : null}<div className="mt-5 flex justify-end gap-2"><button type="button" className="min-h-11 rounded-md border border-line px-4 text-sm" onClick={() => setPendingHref(null)}>Stay on page</button><button type="button" disabled={saveState === "saving"} className="min-h-11 rounded-md border border-core bg-core px-4 text-sm font-medium text-white disabled:opacity-50" onClick={async () => { const destination = pendingHref; if (await persist(latestRef.current)) window.location.assign(destination); }}>{saveState === "saving" ? "Saving…" : "Save and continue"}</button></div></div></div> : null}
    </Card>
  );
}
