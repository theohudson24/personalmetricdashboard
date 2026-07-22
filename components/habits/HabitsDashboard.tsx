"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  Check,
  Flame,
  Pause,
  Plus,
  RotateCcw,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { deleteHabitRecord, saveHabitCheckIn, saveHabitRecord, updateHabitStatusRecord } from "@/app/habits/actions";
import { habitCompletionRate, habitCurrentStreak, isSuccessfulHabitStatus } from "@/lib/habits";

type HabitType = "build" | "kick";
type HabitCategory =
  | "Fitness"
  | "Health"
  | "Mental"
  | "Productivity"
  | "Social"
  | "Finance"
  | "Lifestyle"
  | "Appearance"
  | "Custom";
type Difficulty = "Easy" | "Medium" | "Hard";
type Frequency = "Daily" | "Weekly" | "Custom";
type HabitStatus = "Active" | "Paused" | "Completed" | "Failed" | "Archived";
type CompletionStatus = "completed" | "missed" | "clean" | "relapse" | "partial";
type TabKey = "Today" | "Build" | "Kick" | "Calendar" | "Insights";

type HabitCompletion = {
  id: string;
  habitId: string;
  date: string;
  status: CompletionStatus;
  notes?: string;
};

type RelapseLog = {
  id: string;
  habitId: string;
  date: string;
  trigger: string;
  emotion: string;
  location: string;
  timeOfDay: string;
  reflection: string;
  preventionPlan: string;
};

export type Habit = {
  id: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  difficulty: Difficulty;
  frequency: Frequency;
  targetAmount: string;
  reminderTime: string;
  reason: string;
  notes: string;
  status: HabitStatus;
  createdAt: string;
  bestStreak: number;
  completions: HabitCompletion[];
  relapses: RelapseLog[];
};

const categories: HabitCategory[] = [
  "Fitness",
  "Health",
  "Mental",
  "Productivity",
  "Social",
  "Finance",
  "Lifestyle",
  "Appearance",
  "Custom",
];
const tabs: TabKey[] = ["Today", "Build", "Kick", "Calendar", "Insights"];
const today = new Date().toISOString().slice(0, 10);

function dateOffset(days: number) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString().slice(0, 10);
}

function successful(status: CompletionStatus) {
  return isSuccessfulHabitStatus(status);
}

function attentionStatus(status: CompletionStatus) {
  return status === "missed" || status === "relapse" || status === "partial";
}

function currentStreak(habit: Habit) {
  return habitCurrentStreak(habit.completions, new Date(), 366);
}

function completionRate(habit: Habit) {
  return habitCompletionRate(habit.completions);
}

function statusTone(status: HabitStatus | CompletionStatus) {
  if (status === "Active" || status === "completed" || status === "clean") return "bg-growth/15 text-growth";
  if (status === "relapse" || status === "Failed") return "bg-ember/15 text-ember";
  if (status === "partial" || status === "Paused") return "bg-pulse/15 text-pulse";
  return "bg-white/10 text-muted";
}

function createBlankHabit(): Habit {
  return {
    id: "",
    name: "",
    type: "build",
    category: "Fitness",
    difficulty: "Easy",
    frequency: "Daily",
    targetAmount: "",
    reminderTime: "",
    reason: "",
    notes: "",
    status: "Active",
    createdAt: today,
    bestStreak: 0,
    completions: [],
    relapses: [],
  };
}

export function HabitsDashboard({ initialHabits }: { initialHabits: Habit[] }) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [draft, setDraft] = useState<Habit>(createBlankHabit());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("Today");
  const [statusFilter, setStatusFilter] = useState<"All" | HabitStatus>("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | HabitCategory>("All");
  const [search, setSearch] = useState("");
  const [relapseDraft, setRelapseDraft] = useState({
    trigger: "",
    emotion: "",
    location: "",
    timeOfDay: "",
    reflection: "",
    preventionPlan: "",
  });

  const activeHabits = habits.filter((habit) => habit.status === "Active");
  const todayCompletions = habits.flatMap((habit) =>
    habit.completions.filter((entry) => entry.date === today),
  );
  const completedToday = todayCompletions.filter((entry) => successful(entry.status)).length;
  const cleanDays = habits
    .filter((habit) => habit.type === "kick")
    .reduce((total, habit) => total + habit.completions.filter((entry) => entry.status === "clean").length, 0);
  const relapsesThisMonth = habits.reduce(
    (total, habit) =>
      total +
      habit.relapses.filter((entry) => entry.date.slice(0, 7) === today.slice(0, 7)).length,
    0,
  );
  const weeklyConsistency =
    activeHabits.length === 0
      ? 0
      : Math.round(
          (activeHabits.reduce((sum, habit) => {
            const wins = Array.from({ length: 7 }, (_, index) => dateOffset(index)).filter((date) => {
              const completion = habit.completions.find((entry) => entry.date === date);
              return completion ? successful(completion.status) : false;
            }).length;
            return sum + wins / 7;
          }, 0) /
            activeHabits.length) *
            100,
        );
  const bestHabit = [...habits].sort((a, b) => currentStreak(b) - currentStreak(a))[0];
  const needsFocus = [...activeHabits].sort((a, b) => completionRate(a) - completionRate(b))[0];

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      if (activeTab === "Build" && habit.type !== "build") return false;
      if (activeTab === "Kick" && habit.type !== "kick") return false;
      if (statusFilter !== "All" && habit.status !== statusFilter) return false;
      if (categoryFilter !== "All" && habit.category !== categoryFilter) return false;
      if (search && !habit.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeTab, categoryFilter, habits, search, statusFilter]);

  function setDraftField<K extends keyof Habit>(field: K, value: Habit[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function saveHabit() {
    if (!draft.name.trim()) return;

    if (editingId) {
      void saveHabitRecord({ ...draft, id: editingId });
      setHabits((current) =>
        current.map((habit) =>
          habit.id === editingId
            ? { ...habit, ...draft, id: editingId, completions: habit.completions, relapses: habit.relapses }
            : habit,
        ),
      );
    } else {
      const id = `habit-${Date.now()}`;
      void saveHabitRecord({ ...draft, id });
      setHabits((current) => [{ ...draft, id, createdAt: today }, ...current]);
    }

    setDraft(createBlankHabit());
    setEditingId(null);
    setShowForm(false);
  }

  function editHabit(habit: Habit) {
    setDraft({ ...habit });
    setEditingId(habit.id);
    setShowForm(true);
  }

  function setHabitStatus(id: string, status: HabitStatus) {
    void updateHabitStatusRecord(id, status);
    setHabits((current) => current.map((habit) => (habit.id === id ? { ...habit, status } : habit)));
  }

  function deleteHabit(id: string) {
    void deleteHabitRecord(id);
    setHabits((current) => current.filter((habit) => habit.id !== id));
  }

  function checkIn(habit: Habit, status: CompletionStatus) {
    const completionId = `completion-${Date.now()}`;
    const previewCompletions = [{ id: completionId, habitId: habit.id, date: today, status }, ...habit.completions.filter((completion) => completion.date !== today)];
    const nextBestStreak = Math.max(habit.bestStreak, currentStreak({ ...habit, completions: previewCompletions }));
    setHabits((current) =>
      current.map((entry) => {
        if (entry.id !== habit.id) return entry;
        const completions = entry.completions.filter((completion) => completion.date !== today);
        const nextCompletion = {
          id: completionId,
          habitId: habit.id,
          date: today,
          status,
        };
        const relapse =
          status === "relapse"
            ? [
                ...entry.relapses,
                {
                  id: `relapse-${Date.now()}`,
                  habitId: habit.id,
                  date: today,
                  ...relapseDraft,
                },
              ]
            : entry.relapses;

        return {
          ...entry,
          completions: [nextCompletion, ...completions],
          relapses: relapse,
          bestStreak: nextBestStreak,
        };
      }),
    );
    void saveHabitCheckIn({ habitId: habit.id, completionId, date: today, status, bestStreak: nextBestStreak, relapse: status === "relapse" ? relapseDraft : undefined });

    if (status === "relapse") {
      setRelapseDraft({
        trigger: "",
        emotion: "",
        location: "",
        timeOfDay: "",
        reflection: "",
        preventionPlan: "",
      });
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's completion" value={`${activeHabits.length ? Math.round((completedToday / activeHabits.length) * 100) : 0}%`} detail={`${completedToday} of ${activeHabits.length} active habits`} icon={<Check size={18} />} />
        <MetricCard label="Current streaks" value={`${bestHabit ? currentStreak(bestHabit) : 0} days`} detail={bestHabit?.name ?? "No habits yet"} icon={<Flame size={18} />} />
        <MetricCard label="Clean days" value={String(cleanDays)} detail={`${relapsesThisMonth} relapses this month`} icon={<Target size={18} />} />
        <MetricCard label="Weekly consistency" value={`${weeklyConsistency}%`} detail={needsFocus ? `${needsFocus.name} needs focus` : "Add a habit to begin"} icon={<CalendarDays size={18} />} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-10 rounded-md border px-3 text-sm transition ${
                activeTab === tab
                  ? "border-core bg-core text-white"
                  : "border-line bg-ink/[0.04] text-muted hover:border-core/40 hover:text-ink"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => {
            setDraft(createBlankHabit());
            setEditingId(null);
            setShowForm((value) => !value);
          }}
        >
          <Plus size={16} className="mr-2" />
          Quick add habit
        </Button>
      </div>

      {showForm ? (
        <Card>
          <CardHeader
            title={editingId ? "Edit habit" : "Create habit"}
            description="Start simple. You can track the deeper reason, reminders, and notes without making daily check-in slower."
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Habit name">
              <Input value={draft.name} onChange={(event) => setDraftField("name", event.target.value)} placeholder="Drink water" />
            </Field>
            <Field label="Habit type">
              <Select value={draft.type} onChange={(event) => setDraftField("type", event.target.value as HabitType)}>
                <option value="build">Build</option>
                <option value="kick">Kick</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={draft.category} onChange={(event) => setDraftField("category", event.target.value as HabitCategory)}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </Select>
            </Field>
            <Field label="Difficulty">
              <Select value={draft.difficulty} onChange={(event) => setDraftField("difficulty", event.target.value as Difficulty)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </Select>
            </Field>
            <Field label="Goal frequency">
              <Select value={draft.frequency} onChange={(event) => setDraftField("frequency", event.target.value as Frequency)}>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Custom</option>
              </Select>
            </Field>
            <Field label="Target amount">
              <Input value={draft.targetAmount} onChange={(event) => setDraftField("targetAmount", event.target.value)} placeholder="8 cups, 30 min, 150g" />
            </Field>
            <Field label="Reminder time">
              <Input type="time" value={draft.reminderTime} onChange={(event) => setDraftField("reminderTime", event.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={draft.status} onChange={(event) => setDraftField("status", event.target.value as HabitStatus)}>
                <option>Active</option>
                <option>Paused</option>
                <option>Completed</option>
                <option>Failed</option>
                <option>Archived</option>
              </Select>
            </Field>
            <Field label="Reason why">
              <Input value={draft.reason} onChange={(event) => setDraftField("reason", event.target.value)} placeholder="Why this matters" />
            </Field>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Notes">
                <Textarea value={draft.notes} onChange={(event) => setDraftField("notes", event.target.value)} placeholder="Rules, minimum version, reminders, constraints" />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={saveHabit}>{editingId ? "Save changes" : "Create habit"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader
            title={activeTab === "Today" ? "Daily habit checklist" : `${activeTab} habits`}
            description="Fast check-ins first. Open the details only when the habit needs thought."
          />
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
              <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search habits" />
            </label>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | HabitStatus)}>
              <option>All</option>
              <option>Active</option>
              <option>Paused</option>
              <option>Completed</option>
              <option>Failed</option>
              <option>Archived</option>
            </Select>
            <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "All" | HabitCategory)}>
              <option>All</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </Select>
          </div>

          {filteredHabits.length === 0 ? (
            <EmptyState
              title={habits.length ? "No habits match these filters" : "Add your first habit"}
              message={habits.length ? "Clear the search or change the filters to see your existing habits." : "Create one small, repeatable rule and use daily check-ins to build a history."}
            />
          ) : (
            <div className="grid gap-3">
              {filteredHabits.map((habit) => {
                const todayEntry = habit.completions.find((entry) => entry.date === today);
                const rate = completionRate(habit);
                const streak = currentStreak(habit);

                return (
                  <article key={habit.id} className="rounded-lg border border-line bg-ink/[0.025] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${habit.type === "build" ? "bg-growth/15 text-growth" : "bg-ember/15 text-ember"}`}>
                            {habit.type === "build" ? "Build" : "Kick"}
                          </span>
                          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusTone(habit.status)}`}>{habit.status}</span>
                          {todayEntry ? <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusTone(todayEntry.status)}`}>{todayEntry.status}</span> : null}
                        </div>
                        <h3 className="text-lg font-semibold">{habit.name}</h3>
                        <p className="mt-1 text-sm text-muted">{habit.reason || "Make the next right action obvious."}</p>
                      </div>
                      <div className="flex gap-1">
                        <IconButton label="Edit" onClick={() => editHabit(habit)} icon={<RotateCcw size={15} />} />
                        <IconButton label="Pause" onClick={() => setHabitStatus(habit.id, habit.status === "Paused" ? "Active" : "Paused")} icon={<Pause size={15} />} />
                        <IconButton label="Archive" onClick={() => setHabitStatus(habit.id, "Archived")} icon={<Archive size={15} />} />
                        <IconButton label="Delete" onClick={() => deleteHabit(habit.id)} icon={<Trash2 size={15} />} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <MiniStat label="Streak" value={`${streak} days`} />
                      <MiniStat label="Best" value={`${Math.max(habit.bestStreak, streak)} days`} />
                      <MiniStat label="Rate" value={`${rate}%`} />
                      <MiniStat label="Target" value={habit.targetAmount || habit.frequency} />
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={rate} max={100} label={`${habit.category} / ${habit.difficulty}`} />
                    </div>

                    {habit.type === "build" ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" variant={todayEntry?.status === "completed" ? "primary" : "secondary"} onClick={() => checkIn(habit, "completed")}>
                          <Check size={16} className="mr-2" />
                          Complete today
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => checkIn(habit, "missed")}>Mark missed</Button>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant={todayEntry?.status === "clean" ? "primary" : "secondary"} onClick={() => checkIn(habit, "clean")}>Clean day</Button>
                          <Button type="button" variant="secondary" onClick={() => checkIn(habit, "partial")}>Partial slip</Button>
                          <Button type="button" variant="ghost" onClick={() => checkIn(habit, "relapse")}>Relapse</Button>
                        </div>
                        <details className="rounded-md border border-line bg-ink/[0.025] p-3">
                          <summary className="cursor-pointer text-sm font-semibold">Relapse reflection fields</summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <Input placeholder="Trigger" value={relapseDraft.trigger} onChange={(event) => setRelapseDraft((current) => ({ ...current, trigger: event.target.value }))} />
                            <Input placeholder="Emotion before" value={relapseDraft.emotion} onChange={(event) => setRelapseDraft((current) => ({ ...current, emotion: event.target.value }))} />
                            <Input placeholder="Environment/location" value={relapseDraft.location} onChange={(event) => setRelapseDraft((current) => ({ ...current, location: event.target.value }))} />
                            <Input type="time" value={relapseDraft.timeOfDay} onChange={(event) => setRelapseDraft((current) => ({ ...current, timeOfDay: event.target.value }))} />
                            <Textarea placeholder="Short reflection" value={relapseDraft.reflection} onChange={(event) => setRelapseDraft((current) => ({ ...current, reflection: event.target.value }))} />
                            <Textarea placeholder="What to do differently next time" value={relapseDraft.preventionPlan} onChange={(event) => setRelapseDraft((current) => ({ ...current, preventionPlan: event.target.value }))} />
                          </div>
                        </details>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </Card>

        <div>
          <Card className="h-full">
            <CardHeader title="Habits needing attention" description="Fix the smallest leak before it becomes the pattern." />
            <div className="space-y-3">
              {habits
                .filter((habit) => habit.completions.some((entry) => attentionStatus(entry.status)) || completionRate(habit) < 60)
                .map((habit) => (
                  <div key={habit.id} className="rounded-md border border-line bg-ink/[0.025] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{habit.name}</p>
                      <span className="text-sm text-muted">{completionRate(habit)}%</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{habit.notes || "Reduce friction for the next check-in."}</p>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Habit history heatmap" description="Completed habits live here as a 12-week view of build wins, clean days, slips, and relapses." />
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[760px] grid-flow-col grid-rows-7 gap-2">
            {Array.from({ length: 84 }, (_, index) => {
              const date = dateOffset(83 - index);
              const entries = habits.flatMap((habit) => habit.completions.filter((entry) => entry.date === date));
              const hasRelapse = entries.some((entry) => entry.status === "relapse");
              const hasPartial = entries.some((entry) => entry.status === "partial" || entry.status === "missed");
              const wins = entries.filter((entry) => successful(entry.status)).length;
              const color = hasRelapse ? "bg-ember" : hasPartial ? "bg-pulse" : wins > 1 ? "bg-growth" : wins === 1 ? "bg-growth/45" : "bg-white/10";
              const completedNames = entries.filter((entry) => successful(entry.status)).map((entry) => habits.find((habit) => habit.id === entry.habitId)?.name).filter(Boolean);
              return <div key={date} title={`${date}${completedNames.length ? `: ${completedNames.join(", ")}` : ": no completions"}`} className={`h-8 min-w-8 rounded-md ${color}`} />;
            })}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted"><span>Green: completed</span><span>Yellow: partial/missed</span><span>Red: relapse</span></div>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-core/15 text-core">{icon}</div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-md border border-line bg-ink/[0.025] text-muted transition hover:border-core/40 hover:text-core"
    >
      {icon}
    </button>
  );
}
