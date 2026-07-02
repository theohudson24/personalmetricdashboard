import type { DailyLog } from "@prisma/client";
import { updateDailyLog } from "@/app/actions";
import { DateSelector } from "@/components/shared/DateSelector";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";

export function HealthMarkerForm({
  log,
  date,
}: {
  log: DailyLog | null;
  date: string;
}) {
  return (
    <Card>
      <CardHeader
        title="Health marker snapshot"
        description="Store daily body, recovery, and readiness markers."
      />
      <form action={updateDailyLog} className="space-y-4">
        <DateSelector defaultValue={date} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Body weight">
            <Input name="bodyWeight" type="number" step="0.1" defaultValue={log?.bodyWeight ?? ""} />
          </Field>
          <Field label="Sleep hours">
            <Input name="sleepHours" type="number" step="0.1" defaultValue={log?.sleepHours ?? ""} />
          </Field>
          <Field label="Resting heart rate">
            <Input name="restingHeartRate" type="number" defaultValue={log?.restingHeartRate ?? ""} />
          </Field>
          <Field label="Water intake oz">
            <Input name="waterIntake" type="number" defaultValue={log?.waterIntake ?? ""} />
          </Field>
          <Field label="Mood 1-5">
            <Input name="mood" type="number" min="1" max="5" defaultValue={log?.mood ?? ""} />
          </Field>
          <Field label="Energy 1-5">
            <Input name="energyLevel" type="number" min="1" max="5" defaultValue={log?.energyLevel ?? ""} />
          </Field>
          <Field label="Soreness 1-5">
            <Input name="sorenessLevel" type="number" min="1" max="5" defaultValue={log?.sorenessLevel ?? ""} />
          </Field>
          <Field label="Stress 1-5">
            <Input name="stressLevel" type="number" min="1" max="5" defaultValue={log?.stressLevel ?? ""} />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea name="notes" defaultValue={log?.notes ?? ""} />
        </Field>
        <Button>Save health markers</Button>
      </form>
    </Card>
  );
}
