import { z } from "zod";
import {
  nutritionQuality,
  normalizeBarcode,
  scaleNutrition,
  type FoodNutrition,
} from "@/lib/foodDataCentral";

export const mealEntryKinds = ["MEAL", "ITEM", "DRINK", "SNACK"] as const;
export type MealEntryKind = (typeof mealEntryKinds)[number];

export const nutrientKeys = [
  "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium",
  "vitaminA", "vitaminC", "vitaminD", "vitaminB12", "calcium", "iron",
  "magnesium", "potassium", "zinc",
] as const;

const finiteNumber = z.coerce.number().finite().min(0).max(10_000_000);
const quantityNumber = z.coerce.number().finite().min(0).max(100_000);

export const nutritionSchema = z.object({
  calories: finiteNumber.default(0), protein: finiteNumber.default(0),
  carbs: finiteNumber.default(0), fat: finiteNumber.default(0),
  fiber: finiteNumber.default(0), sugar: finiteNumber.default(0),
  sodium: finiteNumber.default(0), vitaminA: finiteNumber.default(0),
  vitaminC: finiteNumber.default(0), vitaminD: finiteNumber.default(0),
  vitaminB12: finiteNumber.default(0), calcium: finiteNumber.default(0),
  iron: finiteNumber.default(0), magnesium: finiteNumber.default(0),
  potassium: finiteNumber.default(0), zinc: finiteNumber.default(0),
});

export const foodItemInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().max(200).nullable().optional(),
  barcode: z.string().trim().max(32).nullable().optional(),
  source: z.string().trim().min(1).max(100).default("Manual"),
  sourceId: z.string().trim().max(100).nullable().optional(),
  servingSize: z.string().trim().max(120).nullable().optional(),
  grams: quantityNumber.default(100),
  servings: quantityNumber.default(1),
  gramsPerServing: quantityNumber.default(100),
  referenceNutrition: nutritionSchema,
  nutrition: nutritionSchema,
  nutritionConfidence: z.enum(["complete", "partial", "missing"]).default("missing"),
  missingNutrients: z.array(z.enum(nutrientKeys)).max(nutrientKeys.length).default([]),
  userEdited: z.boolean().default(false),
});

export const mealInputSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().trim().min(1).max(100).default("UTC"),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"]),
  mealName: z.string().trim().min(1).max(200),
  entryKind: z.enum(mealEntryKinds),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  clientRequestId: z.string().uuid().nullable().optional(),
  items: z.array(foodItemInputSchema).min(1).max(50),
});

export type MealInput = z.infer<typeof mealInputSchema>;
export type FoodItemInput = z.infer<typeof foodItemInputSchema>;

export function dateFromKey(dateKey: string) {
  const parsed = new Date(`${dateKey}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid meal date.");
  return parsed;
}

export function quantitiesFromWeight(grams: number, gramsPerServing: number) {
  const safeGrams = Math.max(0, Number.isFinite(grams) ? grams : 0);
  const safeServingWeight = Math.max(0, Number.isFinite(gramsPerServing) ? gramsPerServing : 0);
  return {
    grams: roundQuantity(safeGrams),
    gramsPerServing: roundQuantity(safeServingWeight),
    servings: safeServingWeight > 0 ? roundQuantity(safeGrams / safeServingWeight) : 0,
  };
}

export function quantitiesFromServings(servings: number, gramsPerServing: number) {
  const safeServings = Math.max(0, Number.isFinite(servings) ? servings : 0);
  const safeServingWeight = Math.max(0, Number.isFinite(gramsPerServing) ? gramsPerServing : 0);
  return {
    servings: roundQuantity(safeServings),
    gramsPerServing: roundQuantity(safeServingWeight),
    grams: roundQuantity(safeServings * safeServingWeight),
  };
}

export function nutrientsForWeight(reference: FoodNutrition, grams: number) {
  return scaleNutrition(reference, Math.max(0, grams));
}

export function referenceFromCurrent(nutrition: FoodNutrition, grams: number) {
  if (!Number.isFinite(grams) || grams <= 0) return { ...nutrition };
  const multiplier = 100 / grams;
  return Object.fromEntries(
    nutrientKeys.map((key) => [key, roundNutrient(nutrition[key] * multiplier, key)]),
  ) as FoodNutrition;
}

export function normalizeFoodItem(input: FoodItemInput): FoodItemInput {
  const grams = Math.max(0, input.grams);
  const gramsPerServing = Math.max(0, input.gramsPerServing);
  const servings = gramsPerServing > 0 ? grams / gramsPerServing : input.servings;
  const suppliedReference = input.referenceNutrition;
  const referenceHasData = nutrientKeys.some((key) => suppliedReference[key] > 0);
  const reference = referenceHasData ? suppliedReference : referenceFromCurrent(input.nutrition, grams);
  // The reference snapshot is always authoritative. Manual corrections update this
  // per-100g snapshot first, so future serving/weight changes scale predictably.
  const nutrition = nutrientsForWeight(reference, grams);
  const quality = nutritionQuality(reference);
  return foodItemInputSchema.parse({
    ...input,
    barcode: input.barcode ? normalizeBarcode(input.barcode) : null,
    grams: roundQuantity(grams),
    gramsPerServing: roundQuantity(gramsPerServing),
    servings: roundQuantity(servings),
    referenceNutrition: reference,
    nutrition,
    nutritionConfidence: quality.confidence,
    missingNutrients: quality.missingNutrients,
  });
}

export function parseMealForm(formData: FormData): MealInput {
  const values = (key: string) => formData.getAll(key).map(String);
  const names = values("foodName");
  if (names.length > 50) throw new Error("A nutrition entry can contain at most 50 items.");
  const arrays = Object.fromEntries([
    "foodBrand", "foodBarcode", "foodSource", "foodSourceId", "servingSize", "foodGrams",
    "foodServings", "foodGramsPerServing", "foodConfidence", "foodMissingNutrients",
    "foodUserEdited", "foodRemove", "referenceNutrition", ...nutrientKeys,
  ].map((key) => [key, values(key)])) as Record<string, string[]>;

  const items = names.map((name, index) => {
    const nutrition = Object.fromEntries(nutrientKeys.map((key) => [key, numberAt(arrays[key], index)])) as FoodNutrition;
    let referenceNutrition = referenceFromCurrent(nutrition, numberAt(arrays.foodGrams, index, 100));
    try {
      const raw = arrays.referenceNutrition[index];
      if (raw) referenceNutrition = nutritionSchema.parse(JSON.parse(raw)) as FoodNutrition;
    } catch {
      // A malformed client reference is safely replaced with one derived from current totals.
    }
    const missing = (arrays.foodMissingNutrients[index] ?? "")
      .split(",")
      .filter((key): key is (typeof nutrientKeys)[number] => nutrientKeys.includes(key as (typeof nutrientKeys)[number]));
    return normalizeFoodItem(foodItemInputSchema.parse({
      name,
      brand: arrays.foodBrand[index] || null,
      barcode: arrays.foodBarcode[index] || null,
      source: arrays.foodSource[index] || "Manual",
      sourceId: arrays.foodSourceId[index] || null,
      servingSize: arrays.servingSize[index] || null,
      grams: numberAt(arrays.foodGrams, index, 100),
      servings: numberAt(arrays.foodServings, index, 1),
      gramsPerServing: numberAt(arrays.foodGramsPerServing, index, 100),
      referenceNutrition,
      nutrition,
      nutritionConfidence: arrays.foodConfidence[index] || "missing",
      missingNutrients: missing,
      userEdited: arrays.foodUserEdited[index] === "true",
    }));
  }).filter((item, index) => item.name && arrays.foodRemove[index] !== "on");

  const entryKind = mealEntryKinds.includes(String(formData.get("entryKind")) as MealEntryKind)
    ? String(formData.get("entryKind")) as MealEntryKind
    : "MEAL";
  return mealInputSchema.parse({
    dateKey: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    timezone: String(formData.get("timezone") || "UTC"),
    mealType: String(formData.get("mealType") || "BREAKFAST"),
    mealName: entryKind === "MEAL"
      ? String(formData.get("mealName") || "Meal")
      : items[0]?.name || "Food",
    entryKind,
    time: nullableText(formData.get("time")),
    notes: nullableText(formData.get("notes")),
    clientRequestId: nullableText(formData.get("clientRequestId")),
    items,
  });
}

export function roundQuantity(value: number) {
  return Number(value.toFixed(4));
}

function roundNutrient(value: number, key: keyof FoodNutrition) {
  return Number(value.toFixed(key === "calories" ? 0 : 4));
}

function numberAt(values: string[] | undefined, index: number, fallback = 0) {
  const parsed = Number(values?.[index]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function nullableText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}
