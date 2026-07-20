type ProfileMetrics = {
  heightInches: number | null;
  weightLb: number | null;
  age?: number | null;
  gender?: string | null;
  activityLevel?: string | null;
};

export type NutritionRecommendation = {
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbGoal: number;
  dailyFatGoal: number;
  dailyFiberGoal: number;
  dailyWaterGoal: number;
  dailyVitaminAGoal: number;
  dailyVitaminCGoal: number;
  dailyVitaminDGoal: number;
  dailyVitaminB12Goal: number;
  dailyCalciumGoal: number;
  dailyIronGoal: number;
  dailyMagnesiumGoal: number;
  dailyPotassiumGoal: number;
  dailyZincGoal: number;
  dailySodiumLimit: number;
  bmi: number;
};

function roundToNearest(value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
}

export function hasProfileMetrics(profile: ProfileMetrics) {
  return Boolean(profile.heightInches && profile.weightLb && profile.gender);
}

export function calculateNutritionRecommendation(
  profile: ProfileMetrics,
): NutritionRecommendation | null {
  if (!profile.heightInches || !profile.weightLb || !profile.gender) {
    return null;
  }

  const bmi = (profile.weightLb / (profile.heightInches * profile.heightInches)) * 703;
  const kilograms = profile.weightLb * 0.45359237;
  const centimeters = profile.heightInches * 2.54;
  const age = profile.age ?? 25;
  const gender = profile.gender?.toLowerCase();
  const sexAdjustment = gender === "female" ? -161 : gender === "male" ? 5 : -78;
  const restingEnergy = 10 * kilograms + 6.25 * centimeters - 5 * age + sexAdjustment;
  const activityFactors: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725 };
  const activityFactor = activityFactors[profile.activityLevel ?? "moderate"] ?? 1.55;
  const dailyCalorieGoal = roundToNearest(restingEnergy * activityFactor, 50);
  const dailyProteinGoal = Math.round(profile.weightLb * 0.9);
  const dailyFatGoal = Math.round(profile.weightLb * 0.35);
  const proteinCalories = dailyProteinGoal * 4;
  const fatCalories = dailyFatGoal * 9;
  const dailyCarbGoal = Math.max(
    100,
    Math.round((dailyCalorieGoal - proteinCalories - fatCalories) / 4),
  );
  const dailyFiberGoal = Math.max(25, Math.round((dailyCalorieGoal / 1000) * 14));
  const dailyWaterGoal = Math.round(profile.weightLb * 0.67);
  const isFemale = gender === "female";
  const isMale = gender === "male";
  const olderAdult = age >= 51;
  const seniorAdult = age >= 71;

  const dailyVitaminAGoal = isFemale ? 700 : 900;
  const dailyVitaminCGoal = isFemale ? 75 : 90;
  const dailyVitaminDGoal = seniorAdult ? 20 : 15;
  const dailyVitaminB12Goal = 2.4;
  const dailyCalciumGoal = olderAdult && isFemale ? 1200 : seniorAdult ? 1200 : 1000;
  const dailyIronGoal = isFemale && age <= 50 ? 18 : 8;
  const dailyMagnesiumGoal = isFemale ? (olderAdult ? 320 : 310) : olderAdult ? 420 : 400;
  const dailyPotassiumGoal = isFemale ? 2600 : 3400;
  const dailyZincGoal = isFemale ? 8 : isMale ? 11 : 10;
  const dailySodiumLimit = 2300;

  return {
    dailyCalorieGoal,
    dailyProteinGoal,
    dailyCarbGoal,
    dailyFatGoal,
    dailyFiberGoal,
    dailyWaterGoal,
    dailyVitaminAGoal,
    dailyVitaminCGoal,
    dailyVitaminDGoal,
    dailyVitaminB12Goal,
    dailyCalciumGoal,
    dailyIronGoal,
    dailyMagnesiumGoal,
    dailyPotassiumGoal,
    dailyZincGoal,
    dailySodiumLimit,
    bmi: Number(bmi.toFixed(1)),
  };
}
