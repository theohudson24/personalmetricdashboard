import { Archive, Check, Plus, Trash2, TrendingUp } from "lucide-react";
import { createImprovementGoal, deleteImprovementGoal, recordImprovementGoalProgress, setImprovementGoalStatus } from "@/app/self-improvement/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";

type Goal = {
  id: string; title: string; category: string; baselineValue: number; currentValue: number;
  targetValue: number; unit: string; measurementMode: string; deadline: Date | null;
  priority: string; progress: number; status: string; notes: string; linkedHabits: string;
  paceStatus: string;
  habitLinks: Array<{ habit: { id: string; name: string } }>;
  routineLinks: Array<{ routine: { id: string; name: string } }>;
  progressEntries: Array<{ id: string; value: number; note: string; source: string; recordedAt: Date }>;
};

export function ImprovementGoals({ goals, categories, habits, routines }: {
  goals: Goal[]; categories: readonly string[];
  habits: Array<{ id: string; name: string }>;
  routines: Array<{ id: string; name: string }>;
}) {
  return <Card id="goals">
    <CardHeader title="Measurable goals" description="Track a baseline, target, unit, evidence history, and the habits or routines that support each goal."/>
    <details className="rounded-md border border-line bg-ink/[0.025] p-4">
      <summary className="cursor-pointer font-medium text-core">Create a measurable goal</summary>
      <form action={createImprovementGoal} className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Goal title"><Input name="title" required maxLength={200} placeholder="Complete my morning routine on 30 days"/></Field>
        <Field label="Category"><Select name="category">{categories.map((category) => <option key={category}>{category}</option>)}</Select></Field>
        <Field label="Motivation"><Input name="motivation" maxLength={500} placeholder="Why this matters to me"/></Field>
        <Field label="Target date"><Input name="targetDate" type="date"/></Field>
        <Field label="Baseline"><Input name="baseline" type="number" step="0.1" defaultValue="0" required/></Field>
        <Field label="Target"><Input name="target" type="number" step="0.1" defaultValue="30" required/></Field>
        <Field label="Unit"><Input name="unit" maxLength={40} defaultValue="days" placeholder="days, lb, minutes, sessions" required/></Field>
        <Field label="Progress source"><Select name="measurementMode"><option value="MANUAL">I will enter measurements</option><option value="HABIT_DAYS">Count unique successful habit days</option></Select></Field>
        <Field label="Priority"><Select name="priority"><option>Low</option><option>Medium</option><option>High</option></Select></Field>
        <Field label="Weekly actions"><Input name="weeklyActions" placeholder="Keep the next action specific"/></Field>
        <fieldset className="rounded-md border border-line p-3"><legend className="px-1 text-sm font-medium">Supporting habits</legend>{habits.length ? habits.map((habit) => <label key={habit.id} className="mt-2 flex gap-2 text-sm text-muted"><input type="checkbox" name="habitIds" value={habit.id}/>{habit.name}</label>) : <p className="text-sm text-muted">Create an active habit first if you want automatic habit-day progress.</p>}</fieldset>
        <fieldset className="rounded-md border border-line p-3"><legend className="px-1 text-sm font-medium">Supporting routines</legend>{routines.length ? routines.map((routine) => <label key={routine.id} className="mt-2 flex gap-2 text-sm text-muted"><input type="checkbox" name="routineIds" value={routine.id}/>{routine.name}</label>) : <p className="text-sm text-muted">No saved routines yet.</p>}</fieldset>
        <div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" maxLength={4000}/></Field></div>
        <Button className="md:w-fit"><Plus size={16}/><span className="ml-2">Create goal</span></Button>
      </form>
    </details>
    <div className="mt-4 grid gap-3">
      {goals.length ? goals.map((goal) => <article key={goal.id} className="rounded-lg border border-line bg-ink/[0.025] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-core">{goal.category} · {goal.priority}</p><h3 className="mt-1 font-semibold">{goal.title}</h3><p className="mt-1 text-sm text-muted">{goal.notes || goal.linkedHabits || "Keep the next action small and clear."}</p></div><div className="flex gap-2"><span className="rounded-full border border-line px-2 py-1 text-xs text-muted">{goal.status}</span><span className="rounded-full border border-core/30 bg-core/10 px-2 py-1 text-xs text-core">{goal.paceStatus}</span></div></div>
        <div className="mt-4"><ProgressBar value={goal.progress} max={100} label={`${goal.currentValue} / ${goal.targetValue} ${goal.unit}${goal.deadline ? ` · target ${goal.deadline.toLocaleDateString()}` : ""}`}/></div>
        <p className="mt-2 text-xs text-muted">{goal.measurementMode === "HABIT_DAYS" ? "Calculated from unique successful days across linked habits; multiple habits on one date count once." : "Calculated from your latest manual measurement."}</p>
        {(goal.habitLinks.length || goal.routineLinks.length) ? <div className="mt-3 flex flex-wrap gap-2">{goal.habitLinks.map(({habit}) => <span key={habit.id} className="rounded bg-ink/[0.04] px-2 py-1 text-xs">Habit: {habit.name}</span>)}{goal.routineLinks.map(({routine}) => <span key={routine.id} className="rounded bg-ink/[0.04] px-2 py-1 text-xs">Routine: {routine.name}</span>)}</div> : null}
        {goal.measurementMode === "MANUAL" ? <form action={recordImprovementGoalProgress} className="mt-4 grid gap-2 sm:grid-cols-[8rem_1fr_auto]"><input type="hidden" name="id" value={goal.id}/><Input name="value" type="number" step="0.1" defaultValue={goal.currentValue} aria-label={`Current ${goal.unit}`}/><Input name="note" maxLength={1000} placeholder="Evidence or context for this measurement" aria-label="Progress note"/><Button variant="secondary"><TrendingUp size={16}/><span className="ml-2">Record</span></Button></form> : null}
        {goal.progressEntries.length ? <details className="mt-3 text-sm"><summary className="cursor-pointer text-muted">Measurement history ({goal.progressEntries.length} recent)</summary><ol className="mt-2 space-y-1">{goal.progressEntries.map((entry) => <li key={entry.id} className="flex flex-wrap justify-between gap-2 rounded bg-ink/[0.025] px-3 py-2"><span>{entry.value} {goal.unit}{entry.note ? ` · ${entry.note}` : ""}</span><time className="text-muted">{entry.recordedAt.toLocaleDateString()}</time></li>)}</ol></details> : null}
        <div className="mt-3 flex gap-2"><form action={setImprovementGoalStatus}><input type="hidden" name="id" value={goal.id}/><input type="hidden" name="status" value="Completed"/><button className="grid h-10 w-10 place-items-center rounded-md border border-line text-growth" aria-label={`Complete ${goal.title}`}><Check size={16}/></button></form><form action={setImprovementGoalStatus}><input type="hidden" name="id" value={goal.id}/><input type="hidden" name="status" value="Archived"/><button className="grid h-10 w-10 place-items-center rounded-md border border-line text-muted" aria-label={`Archive ${goal.title}`}><Archive size={16}/></button></form><form action={deleteImprovementGoal}><input type="hidden" name="id" value={goal.id}/><button className="grid h-10 w-10 place-items-center rounded-md border border-line text-ember" aria-label={`Delete ${goal.title}`}><Trash2 size={16}/></button></form></div>
      </article>) : <EmptyState title="Create your first measurable goal" message="Choose one area, define where you are now, and set a target you can measure over time." />}
    </div>
  </Card>;
}
