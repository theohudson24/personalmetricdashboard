export type FoodNutrition = {
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

export type FoodSearchResult = {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  nutrientsPer100g: FoodNutrition;
  barcode?: string;
  servingGrams?: number;
  servingLabel?: string;
};

type FdcNutrient = {
  nutrientId?: number;
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
};

const nutrientMap: Record<keyof FoodNutrition, string[]> = {
  calories: ["1008", "208"],
  protein: ["1003", "203"],
  carbs: ["1005", "205"],
  fat: ["1004", "204"],
  fiber: ["1079", "291"],
  sugar: ["2000", "269"],
  sodium: ["1093", "307"],
  vitaminA: ["1106", "320"],
  vitaminC: ["1162", "401"],
  vitaminD: ["1114", "324"],
  vitaminB12: ["1178", "418"],
  calcium: ["1087", "301"],
  iron: ["1089", "303"],
  magnesium: ["1090", "304"],
  potassium: ["1092", "306"],
  zinc: ["1095", "309"],
};

const emptyNutrition: FoodNutrition = {
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

function nutrientNumber(nutrient: FdcNutrient) {
  return nutrient.nutrientNumber ?? String(nutrient.nutrientId ?? "");
}

export function extractNutrition(nutrients: FdcNutrient[] = []) {
  const nutrition = { ...emptyNutrition };

  for (const key of Object.keys(nutrition) as Array<keyof FoodNutrition>) {
    const nutrient = nutrients.find((item) =>
      nutrientMap[key].includes(nutrientNumber(item)),
    );
    nutrition[key] = nutrient?.value ?? 0;
  }

  return nutrition;
}

export function scaleNutrition(nutrition: FoodNutrition, grams: number) {
  const multiplier = grams / 100;
  const scaled = { ...nutrition };

  for (const key of Object.keys(scaled) as Array<keyof FoodNutrition>) {
    scaled[key] = Number((scaled[key] * multiplier).toFixed(key === "calories" ? 0 : 2));
  }

  return scaled;
}
