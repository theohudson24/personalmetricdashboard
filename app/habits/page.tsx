import { HabitsDashboard, type Habit } from "@/components/habits/HabitsDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const profile = await getDefaultProfile();
  const habits = await prisma.habit.findMany({ where: { profileId: profile.id }, include: { completions: { orderBy: { date: "desc" } }, relapses: { orderBy: { date: "desc" } } }, orderBy: { createdAt: "desc" } });
  const initialHabits: Habit[] = habits.map((habit) => ({ id: habit.id, name: habit.name, type: habit.type as Habit["type"], category: habit.category as Habit["category"], difficulty: habit.difficulty as Habit["difficulty"], frequency: habit.frequency as Habit["frequency"], targetAmount: habit.targetAmount, reminderTime: habit.reminderTime, reason: habit.reason, notes: habit.notes, status: habit.status as Habit["status"], createdAt: habit.createdAt.toISOString().slice(0, 10), bestStreak: habit.bestStreak, completions: habit.completions.map((entry) => ({ id: entry.id, habitId: entry.habitId, date: entry.date.toISOString().slice(0, 10), status: entry.status as Habit["completions"][number]["status"], notes: entry.notes ?? undefined })), relapses: habit.relapses.map((entry) => ({ id: entry.id, habitId: entry.habitId, date: entry.date.toISOString().slice(0, 10), trigger: entry.trigger, emotion: entry.emotion, location: entry.location, timeOfDay: entry.timeOfDay, reflection: entry.reflection, preventionPlan: entry.preventionPlan })) }));
  return (
    <div>
      <PageHeader
        eyebrow="Daily discipline"
        title="Habits"
        description="Build the good. Break the bad. Keep daily execution fast, visible, and easy to repeat."
      />
      <HabitsDashboard initialHabits={initialHabits} />
    </div>
  );
}
