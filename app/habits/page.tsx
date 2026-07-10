import { HabitsDashboard } from "@/components/habits/HabitsDashboard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function HabitsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Daily discipline"
        title="Habits"
        description="Build the good. Break the bad. Keep daily execution fast, visible, and easy to repeat."
      />
      <HabitsDashboard />
    </div>
  );
}
