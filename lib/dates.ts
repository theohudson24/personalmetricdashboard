export function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function dateInputValue(date = new Date()) {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function parseDateInput(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" && value ? value : dateInputValue();
  const date = new Date(`${raw}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}
