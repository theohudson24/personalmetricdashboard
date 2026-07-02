import { Field, Input } from "@/components/ui/Input";

export function DateSelector({
  name = "date",
  defaultValue,
}: {
  name?: string;
  defaultValue: string;
}) {
  return (
    <Field label="Date">
      <Input name={name} type="date" defaultValue={defaultValue} />
    </Field>
  );
}
