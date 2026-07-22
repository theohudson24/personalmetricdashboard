import type { FoodItem, UserSettings } from "@prisma/client";

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
  calcium: number;
  iron: number;
  magnesium: number;
  potassium: number;
  zinc: number;
};

export const emptyTotals: NutritionTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  vitaminA: 0,
  vitaminC: 0,
  vitaminD: 0,
  vitaminB12: 0,
  calcium: 0,
  iron: 0,
  magnesium: 0,
  potassium: 0,
  zinc: 0,
};

export type NutritionGoalTone = "default" | "success" | "warning" | "danger";

export function nutritionGoalTone(
  value: number,
  goal: number,
  mode: "target" | "limit" = "target",
): NutritionGoalTone {
  if (!Number.isFinite(value) || !Number.isFinite(goal) || goal <= 0 || value < 0) return "default";
  const ratio = value / goal;

  if (mode === "limit") {
    if (ratio < 0.9) return "default";
    if (ratio <= 1) return "success";
    if (ratio <= 1.2) return "warning";
    return "danger";
  }

  if (ratio < 1) return "default";
  if (ratio <= 1.2) return "success";
  if (ratio <= 1.5) return "warning";
  return "danger";
}

export function nutritionGoalStatus(tone: NutritionGoalTone, mode: "target" | "limit" = "target") {
  if (tone === "success") return mode === "limit" ? "Near limit" : "Goal reached";
  if (tone === "warning") return "Above goal";
  if (tone === "danger") return "Well above goal";
  return "In progress";
}

export function calculateNutritionTotals(items: FoodItem[]): NutritionTotals {
  return items.reduce(
    (totals, item) => ({
      calories: totals.calories + item.calories,
      protein: totals.protein + item.protein,
      carbs: totals.carbs + item.carbs,
      fat: totals.fat + item.fat,
      fiber: totals.fiber + item.fiber,
      sugar: totals.sugar + item.sugar,
      sodium: totals.sodium + item.sodium,
      vitaminA: totals.vitaminA + item.vitaminA,
      vitaminC: totals.vitaminC + item.vitaminC,
      vitaminD: totals.vitaminD + item.vitaminD,
      vitaminB12: totals.vitaminB12 + item.vitaminB12,
      calcium: totals.calcium + item.calcium,
      iron: totals.iron + item.iron,
      magnesium: totals.magnesium + item.magnesium,
      potassium: totals.potassium + item.potassium,
      zinc: totals.zinc + item.zinc,
    }),
    emptyTotals,
  );
}

export function nutritionInsights(
  totals: NutritionTotals,
  settings: UserSettings,
) {
  const insights: string[] = [];

  if (totals.protein < settings.dailyProteinGoal) {
    insights.push("Protein is below target today.");
  }

  if (totals.calories < settings.dailyCalorieGoal * 0.85) {
    insights.push("Calories are low for a muscle-building day.");
  }

  if (totals.fiber < settings.dailyFiberGoal) {
    insights.push("Fiber intake is below your daily goal.");
  }

  if (totals.sodium > 2300) {
    insights.push("Sodium is running high today.");
  }

  if (
    totals.calories >= settings.dailyCalorieGoal &&
    totals.protein >= settings.dailyProteinGoal
  ) {
    insights.push("You hit your calorie and protein goals.");
  }

  return insights.length > 0 ? insights : ["Log meals to unlock nutrition insights."];
}
