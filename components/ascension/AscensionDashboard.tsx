"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Brain,
  Camera,
  Check,
  Dumbbell,
  HeartPulse,
  LineChart,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";

type AscensionCategory = "Physical" | "Health" | "Mental" | "Appearance" | "Lifestyle";
type GoalStatus = "Not Started" | "In Progress" | "Completed" | "Paused";
type Priority = "Low" | "Medium" | "High";

type DailyCheckIn = {
  sleepHours: number;
  sleepQuality: number;
  energy: number;
  mood: number;
  stress: number;
  workoutCompleted: boolean;
  steps: number;
  nutritionQuality: number;
  protein: number;
  water: number;
  skincareCompleted: boolean;
  supplementsCompleted: boolean;
  deepWorkMinutes: number;
  screenTimeRating: number;
  confidence: number;
  notes: string;
};

type Goal = {
  id: string;
  title: string;
  category: AscensionCategory;
  currentValue: number;
  targetValue: number;
  deadline: string;
  priority: Priority;
  progress: number;
  linkedHabits: string;
  status: GoalStatus;
  notes: string;
};

type Metric = {
  id: string;
  category: AscensionCategory;
  name: string;
  value: number;
  unit: string;
  target?: number;
  notes: string;
};

const categoryMeta: Record<AscensionCategory, { weight: number; icon: ReactNode; color: string }> = {
  Physical: { weight: 0.25, icon: <Dumbbell size={18} />, color: "text-growth" },
  Health: { weight: 0.25, icon: <HeartPulse size={18} />, color: "text-core" },
  Mental: { weight: 0.2, icon: <Brain size={18} />, color: "text-focus" },
  Appearance: { weight: 0.15, icon: <UserRound size={18} />, color: "text-pulse" },
  Lifestyle: { weight: 0.15, icon: <WalletCards size={18} />, color: "text-ink" },
};

const categories = Object.keys(categoryMeta) as AscensionCategory[];

const defaultCheckIn: DailyCheckIn = {
  sleepHours: 7,
  sleepQuality: 7,
  energy: 7,
  mood: 7,
  stress: 4,
  workoutCompleted: true,
  steps: 8200,
  nutritionQuality: 8,
  protein: 148,
  water: 92,
  skincareCompleted: true,
  supplementsCompleted: true,
  deepWorkMinutes: 90,
  screenTimeRating: 6,
  confidence: 7,
  notes: "Strong baseline. Keep sleep protected tonight.",
};

const defaultMetrics: Metric[] = [
  { id: "m-weight", category: "Physical", name: "Current weight", value: 154.2, unit: "lb", target: 155, notes: "Lean bodyweight goal" },
  { id: "m-bench", category: "Physical", name: "Bench press", value: 185, unit: "lb", target: 225, notes: "Primary strength marker" },
  { id: "m-steps", category: "Physical", name: "Average steps", value: 8200, unit: "steps", target: 10000, notes: "Daily movement" },
  { id: "m-sleep", category: "Health", name: "Average sleep", value: 7, unit: "hrs", target: 8, notes: "Recovery floor" },
  { id: "m-protein", category: "Health", name: "Protein intake", value: 148, unit: "g", target: 150, notes: "Muscle support" },
  { id: "m-focus", category: "Mental", name: "Deep work", value: 90, unit: "min", target: 120, notes: "Study and project time" },
  { id: "m-confidence", category: "Mental", name: "Confidence", value: 7, unit: "/10", target: 9, notes: "Social baseline" },
  { id: "m-skin", category: "Appearance", name: "Skincare consistency", value: 86, unit: "%", target: 95, notes: "Morning and night routine" },
  { id: "m-style", category: "Appearance", name: "Outfit rating", value: 8, unit: "/10", target: 9, notes: "Fit and grooming" },
  { id: "m-budget", category: "Lifestyle", name: "Budget followed", value: 78, unit: "%", target: 90, notes: "Weekly money plan" },
  { id: "m-project", category: "Lifestyle", name: "Project progress", value: 62, unit: "%", target: 100, notes: "Personal build track" },
];

const defaultGoals: Goal[] = [
  {
    id: "g1",
    title: "Reach 155 lbs lean bodyweight",
    category: "Physical",
    currentValue: 154,
    targetValue: 155,
    deadline: "2026-08-15",
    priority: "High",
    progress: 82,
    linkedHabits: "Workout, Protein",
    status: "In Progress",
    notes: "Keep surplus controlled and lifts moving.",
  },
  {
    id: "g2",
    title: "Sleep 8 hours consistently",
    category: "Health",
    currentValue: 7,
    targetValue: 8,
    deadline: "2026-07-31",
    priority: "High",
    progress: 68,
    linkedHabits: "Sleep on time",
    status: "In Progress",
    notes: "Screen cutoff is the unlock.",
  },
  {
    id: "g3",
    title: "Save $1,000",
    category: "Lifestyle",
    currentValue: 420,
    targetValue: 1000,
    deadline: "2026-09-01",
    priority: "Medium",
    progress: 42,
    linkedHabits: "Budgeting",
    status: "In Progress",
    notes: "Automate the transfer.",
  },
];

function scoreFromMetric(metric: Metric) {
  if (!metric.target || metric.target === 0) return Math.min(100, Math.round(metric.value));
  return Math.max(0, Math.min(100, Math.round((metric.value / metric.target) * 100)));
}

function blankGoal(): Goal {
  return {
    id: "",
    title: "",
    category: "Physical",
    currentValue: 0,
    targetValue: 100,
    deadline: "",
    priority: "Medium",
    progress: 0,
    linkedHabits: "",
    status: "Not Started",
    notes: "",
  };
}

export function AscensionDashboard() {
  const [checkIn, setCheckIn] = useState<DailyCheckIn>(defaultCheckIn);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [goalDraft, setGoalDraft] = useState<Goal>(blankGoal());
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AscensionCategory | "All">("All");
  const [metrics] = useState<Metric[]>(defaultMetrics);
  const [photos, setPhotos] = useState([
    { id: "front", angle: "Front", date: "2026-07-09", notes: "Baseline posture and physique check.", fileName: "" },
    { id: "side", angle: "Side", date: "2026-07-09", notes: "Keep private until opened.", fileName: "" },
    { id: "back", angle: "Back", date: "2026-07-09", notes: "Useful for posture and back width.", fileName: "" },
  ]);

  const categoryScores = useMemo(() => {
    return categories.reduce<Record<AscensionCategory, number>>((scores, category) => {
      const categoryMetrics = metrics.filter((metric) => metric.category === category);
      const goalScores = goals.filter((goal) => goal.category === category).map((goal) => goal.progress);
      const metricScores = categoryMetrics.map(scoreFromMetric);
      const values = [...metricScores, ...goalScores];
      const checkInBoost =
        category === "Physical"
          ? (checkIn.workoutCompleted ? 12 : 0) + Math.min(20, checkIn.steps / 500)
          : category === "Health"
            ? checkIn.sleepQuality * 4 + checkIn.nutritionQuality * 3
            : category === "Mental"
              ? checkIn.mood * 4 + checkIn.energy * 2 + Math.min(20, checkIn.deepWorkMinutes / 6)
              : category === "Appearance"
                ? (checkIn.skincareCompleted ? 30 : 0) + checkIn.confidence * 4
                : (10 - checkIn.stress) * 4 + checkIn.screenTimeRating * 3;
      const base = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 50;
      scores[category] = Math.max(0, Math.min(100, Math.round(base * 0.72 + checkInBoost * 0.28)));
      return scores;
    }, {} as Record<AscensionCategory, number>);
  }, [checkIn, goals, metrics]);

  const overallScore = Math.round(
    categories.reduce((sum, category) => sum + categoryScores[category] * categoryMeta[category].weight, 0),
  );
  const bestCategory = [...categories].sort((a, b) => categoryScores[b] - categoryScores[a])[0];
  const weakestCategory = [...categories].sort((a, b) => categoryScores[a] - categoryScores[b])[0];
  const activeGoals = goals.filter((goal) => goal.status !== "Completed" && goal.status !== "Paused");
  const visibleMetrics = activeCategory === "All" ? metrics : metrics.filter((metric) => metric.category === activeCategory);

  function updateCheckIn<K extends keyof DailyCheckIn>(field: K, value: DailyCheckIn[K]) {
    setCheckIn((current) => ({ ...current, [field]: value }));
  }

  function updateGoal<K extends keyof Goal>(field: K, value: Goal[K]) {
    setGoalDraft((current) => ({ ...current, [field]: value }));
  }

  function saveGoal() {
    if (!goalDraft.title.trim()) return;
    const progress =
      goalDraft.targetValue > 0
        ? Math.max(0, Math.min(100, Math.round((goalDraft.currentValue / goalDraft.targetValue) * 100)))
        : goalDraft.progress;
    setGoals((current) => [{ ...goalDraft, id: `goal-${Date.now()}`, progress }, ...current]);
    setGoalDraft(blankGoal());
    setShowGoalForm(false);
  }

  function completeGoal(id: string) {
    setGoals((current) =>
      current.map((goal) => (goal.id === id ? { ...goal, status: "Completed", progress: 100 } : goal)),
    );
  }

  function deleteGoal(id: string) {
    setGoals((current) => current.filter((goal) => goal.id !== id));
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-gradient-to-br from-core/20 via-white/[0.055] to-growth/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-core">Overall score</p>
              <h2 className="mt-2 text-5xl font-semibold">{overallScore}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Weighted from physical, health, mental, appearance, and lifestyle execution.
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-md border border-white/15 bg-white/10 text-core">
              <Sparkles size={24} />
            </div>
          </div>
          <div className="mt-5">
            <ProgressBar value={overallScore} max={100} label="Ascension Score" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <FocusCard label="Strong area" value={bestCategory} detail={`${categoryScores[bestCategory]} score`} icon={<ShieldCheck size={17} />} />
            <FocusCard label="Recommended focus" value={weakestCategory} detail="Next week's highest leverage category" icon={<Target size={17} />} />
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className={`rounded-lg border p-4 text-left transition ${activeCategory === "All" ? "border-core bg-core/10" : "border-white/10 bg-white/[0.055] hover:border-core/40"}`}
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 text-core"><LineChart size={18} /></div>
            <p className="text-sm text-muted">All markers</p>
            <p className="mt-1 text-2xl font-semibold">{overallScore}</p>
            <ProgressBar value={overallScore} max={100} />
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg border p-4 text-left transition ${
                activeCategory === category
                  ? "border-core bg-core/10"
                  : "border-white/10 bg-white/[0.055] hover:border-core/40"
              }`}
            >
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 ${categoryMeta[category].color}`}>
                {categoryMeta[category].icon}
              </div>
              <p className="text-sm text-muted">{category}</p>
              <p className="mt-1 text-2xl font-semibold">{categoryScores[category]}</p>
              <ProgressBar value={categoryScores[category]} max={100} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5">
        <Card>
          <CardHeader
            title="Daily Ascension check-in"
            description="Quick inputs only. The goal is to log the day in under a minute."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <RangeField label="Sleep quality" value={checkIn.sleepQuality} onChange={(value) => updateCheckIn("sleepQuality", value)} />
            <RangeField label="Energy" value={checkIn.energy} onChange={(value) => updateCheckIn("energy", value)} />
            <RangeField label="Mood" value={checkIn.mood} onChange={(value) => updateCheckIn("mood", value)} />
            <RangeField label="Stress" value={checkIn.stress} onChange={(value) => updateCheckIn("stress", value)} />
            <RangeField label="Nutrition quality" value={checkIn.nutritionQuality} onChange={(value) => updateCheckIn("nutritionQuality", value)} />
            <RangeField label="Confidence" value={checkIn.confidence} onChange={(value) => updateCheckIn("confidence", value)} />
            <Field label="Sleep hours">
              <Input type="number" step="0.1" value={checkIn.sleepHours} onChange={(event) => updateCheckIn("sleepHours", Number(event.target.value))} />
            </Field>
            <Field label="Steps">
              <Input type="number" value={checkIn.steps} onChange={(event) => updateCheckIn("steps", Number(event.target.value))} />
            </Field>
            <Field label="Protein">
              <Input type="number" value={checkIn.protein} onChange={(event) => updateCheckIn("protein", Number(event.target.value))} />
            </Field>
            <Field label="Water">
              <Input type="number" value={checkIn.water} onChange={(event) => updateCheckIn("water", Number(event.target.value))} />
            </Field>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Toggle label="Workout" checked={checkIn.workoutCompleted} onChange={(value) => updateCheckIn("workoutCompleted", value)} />
            <Toggle label="Skincare" checked={checkIn.skincareCompleted} onChange={(value) => updateCheckIn("skincareCompleted", value)} />
            <Toggle label="Supplements" checked={checkIn.supplementsCompleted} onChange={(value) => updateCheckIn("supplementsCompleted", value)} />
            <Field label="Deep work minutes">
              <Input type="number" value={checkIn.deepWorkMinutes} onChange={(event) => updateCheckIn("deepWorkMinutes", Number(event.target.value))} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Daily notes">
              <Textarea value={checkIn.notes} onChange={(event) => updateCheckIn("notes", event.target.value)} />
            </Field>
          </div>
        </Card>

      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="order-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <CardHeader title="Goals" description="Create targets by category and keep the next action visible." />
            <Button type="button" onClick={() => setShowGoalForm((value) => !value)}>
              <Plus size={16} className="mr-2" />
              Add goal
            </Button>
          </div>

          {showGoalForm ? (
            <div className="mb-4 rounded-lg border border-line bg-black/15 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Goal title">
                  <Input value={goalDraft.title} onChange={(event) => updateGoal("title", event.target.value)} placeholder="Hit 10,000 steps daily" />
                </Field>
                <Field label="Category">
                  <Select value={goalDraft.category} onChange={(event) => updateGoal("category", event.target.value as AscensionCategory)}>
                    {categories.map((category) => <option key={category}>{category}</option>)}
                  </Select>
                </Field>
                <Field label="Current value">
                  <Input type="number" value={goalDraft.currentValue} onChange={(event) => updateGoal("currentValue", Number(event.target.value))} />
                </Field>
                <Field label="Target value">
                  <Input type="number" value={goalDraft.targetValue} onChange={(event) => updateGoal("targetValue", Number(event.target.value))} />
                </Field>
                <Field label="Deadline">
                  <Input type="date" value={goalDraft.deadline} onChange={(event) => updateGoal("deadline", event.target.value)} />
                </Field>
                <Field label="Priority">
                  <Select value={goalDraft.priority} onChange={(event) => updateGoal("priority", event.target.value as Priority)}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </Select>
                </Field>
                <Field label="Linked habits">
                  <Input value={goalDraft.linkedHabits} onChange={(event) => updateGoal("linkedHabits", event.target.value)} />
                </Field>
                <Field label="Status">
                  <Select value={goalDraft.status} onChange={(event) => updateGoal("status", event.target.value as GoalStatus)}>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Paused</option>
                  </Select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Notes">
                    <Textarea value={goalDraft.notes} onChange={(event) => updateGoal("notes", event.target.value)} />
                  </Field>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="button" onClick={saveGoal}>Save goal</Button>
                <Button type="button" variant="ghost" onClick={() => setShowGoalForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {goals.map((goal) => (
              <article key={goal.id} className="rounded-lg border border-line bg-black/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-core">{goal.category} / {goal.priority}</p>
                    <h3 className="mt-1 font-semibold">{goal.title}</h3>
                    <p className="mt-1 text-sm text-muted">{goal.notes}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" title="Complete goal" onClick={() => completeGoal(goal.id)} className="grid h-9 w-9 place-items-center rounded-md border border-line bg-black/15 text-muted hover:text-growth">
                      <Check size={15} />
                    </button>
                    <button type="button" title="Delete goal" onClick={() => deleteGoal(goal.id)} className="grid h-9 w-9 place-items-center rounded-md border border-line bg-black/15 text-muted hover:text-ember">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar value={goal.progress} max={100} label={`${goal.currentValue} / ${goal.targetValue} by ${goal.deadline || "no deadline"}`} />
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card className="order-1">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <CardHeader title="Current stats" description="Default metrics across physical, health, mental, appearance, and lifestyle domains." />
            <Select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value as AscensionCategory | "All")} className="max-w-48">
              <option>All</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {visibleMetrics.map((metric) => (
              <div key={metric.id} className="rounded-md border border-line bg-black/15 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{metric.name}</p>
                  <span className="text-sm text-muted">{metric.category}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">{metric.value}{metric.unit}</p>
                <ProgressBar value={scoreFromMetric(metric)} max={100} label={metric.target ? `Target ${metric.target}${metric.unit}` : metric.notes} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Progress charts" description="Compact trend previews for the metrics that matter most." />
          <div className="grid gap-4">
            <SparkLine label="Ascension Score" values={[61, 64, 66, 69, 72, 74, overallScore]} />
            <SparkLine label="Sleep" values={[6.4, 6.9, 7.1, 6.8, 7.4, 7.2, checkIn.sleepHours]} />
            <SparkLine label="Mood" values={[6, 6, 7, 7, 8, 7, checkIn.mood]} />
            <SparkLine label="Steps" values={[5400, 7200, 6900, 8100, 8800, 7600, checkIn.steps]} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Progress photos" description="Private front, side, and back checkpoints. Upload can be connected to storage later." />
          <div className="grid gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="rounded-lg border border-line bg-black/15 p-3">
                <div className="mb-3 grid aspect-[3/4] place-items-center rounded-md border border-dashed border-white/20 bg-white/[0.04] text-muted">
                  <Camera size={26} />
                </div>
                <p className="font-semibold">{photo.angle}</p>
                <Input type="date" value={photo.date} onChange={(event) => setPhotos((current) => current.map((entry) => entry.id === photo.id ? { ...entry, date: event.target.value } : entry))} />
                <Textarea value={photo.notes} onChange={(event) => setPhotos((current) => current.map((entry) => entry.id === photo.id ? { ...entry, notes: event.target.value } : entry))} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Weekly review" description="A bottom-of-page review that turns the full dashboard into next week's focus." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ReviewRow label="Weekly score" value={`${overallScore}/100`} />
          <ReviewRow label="Best category" value={bestCategory} />
          <ReviewRow label="Weakest category" value={weakestCategory} />
          <ReviewRow label="Biggest improvement" value={checkIn.workoutCompleted ? "Workout consistency" : "Daily movement"} />
          <ReviewRow label="Problem area" value={weakestCategory === "Health" ? "Sleep recovery" : `${weakestCategory} consistency`} />
          <ReviewRow label="Active goals" value={String(activeGoals.length)} />
        </div>
        <div className="mt-5 rounded-md border border-core/30 bg-core/10 p-4 text-sm text-muted">Next week: put one constraint around {weakestCategory.toLowerCase()} and keep the rest of the system steady.</div>
      </Card>
    </div>
  );
}

function FocusCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 p-3">
      <div className="mb-2 flex items-center gap-2 text-core">{icon}<p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p></div>
      <p className="font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function RangeField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-[#4db7a7]"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`min-h-11 rounded-md border px-3 text-sm font-medium transition ${
        checked ? "border-core bg-core text-[#07100d]" : "border-line bg-black/20 text-muted hover:border-core/40"
      }`}
    >
      {label}
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-black/15 px-3 py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function SparkLine({ label, values }: { label: string; values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = 8 + (index / (values.length - 1)) * 204;
      const y = 72 - ((value - min) / spread) * 56;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-md border border-line bg-black/15 p-3">
      <div className="mb-2 flex items-center gap-2">
        <LineChart size={16} className="text-core" />
        <p className="font-semibold">{label}</p>
      </div>
      <svg viewBox="0 0 220 84" className="h-24 w-full">
        <polyline points={points} fill="none" stroke="#4db7a7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
