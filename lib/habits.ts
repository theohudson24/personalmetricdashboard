export type HabitCompletionStatus = "completed" | "missed" | "clean" | "relapse" | "partial";
export type HabitHistoryEntry = { date: string; status: HabitCompletionStatus };

export function isSuccessfulHabitStatus(status: HabitCompletionStatus) {
  return status === "completed" || status === "clean";
}

export function habitCompletionRate(entries: HabitHistoryEntry[]) {
  if (entries.length === 0) return 0;
  return Math.round((entries.filter((entry) => isSuccessfulHabitStatus(entry.status)).length / entries.length) * 100);
}

export function habitCurrentStreak(entries: HabitHistoryEntry[], asOf = new Date(), lookbackDays = 366) {
  const successfulDates = new Set(entries.filter((entry) => isSuccessfulHabitStatus(entry.status)).map((entry) => entry.date));
  const cursor = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  let streak = 0;
  for (let index = 0; index < lookbackDays; index += 1) {
    if (!successfulDates.has(cursor.toISOString().slice(0, 10))) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function habitConsistency(entries: HabitHistoryEntry[], asOf = new Date(), days = 7) {
  if (days <= 0) return 0;
  const successfulDates = new Set(entries.filter((entry) => isSuccessfulHabitStatus(entry.status)).map((entry) => entry.date));
  const cursor = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  let successfulDays = 0;
  for (let index = 0; index < days; index += 1) {
    if (successfulDates.has(cursor.toISOString().slice(0, 10))) successfulDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return Math.round((successfulDays / days) * 100);
}
