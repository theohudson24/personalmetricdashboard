export type DashboardProgressStatus = "complete" | "in-progress" | "not-started" | "needs-attention";

export function completionPercent(completed: number, total: number) {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

export function countStatus(completed: number, total: number, empty: DashboardProgressStatus = "not-started"): DashboardProgressStatus {
  if (total <= 0) return empty;
  if (completed >= total) return "complete";
  if (completed > 0) return "in-progress";
  return "not-started";
}

export function nutritionTargetProgress(calories: number, calorieGoal: number, protein: number, proteinGoal: number) {
  const calorieProgress = calories / Math.max(calorieGoal, 1);
  const proteinProgress = protein / Math.max(proteinGoal, 1);
  return Math.max(0, Math.min(100, Math.round((calorieProgress + proteinProgress) * 50)));
}
