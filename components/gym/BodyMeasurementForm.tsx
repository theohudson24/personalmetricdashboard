import { createBodyMeasurement } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";

const today = new Date().toISOString().slice(0, 10);

export function BodyMeasurementForm() {
  return (
    <Card>
      <CardHeader
        title="Body progress"
        description="Track physique measurements and leave space for future photo uploads."
      />
      <form action={createBodyMeasurement} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input name="date" type="date" defaultValue={today} />
          </Field>
          <Field label="Body weight">
            <Input name="bodyWeight" type="number" step="0.1" />
          </Field>
          <Field label="Chest">
            <Input name="chest" type="number" step="0.1" />
          </Field>
          <Field label="Arms">
            <Input name="arms" type="number" step="0.1" />
          </Field>
          <Field label="Waist">
            <Input name="waist" type="number" step="0.1" />
          </Field>
          <Field label="Legs">
            <Input name="legs" type="number" step="0.1" />
          </Field>
        </div>
        <div className="rounded-md border border-dashed border-line bg-neutral-50 p-4 text-sm text-muted">
          Progress photo upload placeholder
        </div>
        <Field label="Notes">
          <Textarea name="notes" />
        </Field>
        <Button>Save measurement</Button>
      </form>
    </Card>
  );
}
