import { MealType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  dateFromKey,
  mealInputSchema,
  normalizeFoodItem,
  type FoodItemInput,
  type MealInput,
} from "@/lib/meals";

export class MealServiceError extends Error {
  constructor(message: string, public readonly code: "NOT_FOUND" | "CONFLICT" | "INVALID") {
    super(message);
  }
}

function itemData(raw: FoodItemInput) {
  const item = normalizeFoodItem(raw);
  return {
    name: item.name,
    brand: item.brand || null,
    barcode: item.barcode || null,
    source: item.source,
    sourceId: item.sourceId || null,
    servingSize: item.servingSize || null,
    grams: item.grams,
    servings: item.servings,
    gramsPerServing: item.gramsPerServing,
    referenceNutrition: item.referenceNutrition as Prisma.InputJsonValue,
    nutritionConfidence: item.nutritionConfidence,
    missingNutrients: item.missingNutrients.join(","),
    userEdited: item.userEdited,
    calories: Math.round(item.nutrition.calories),
    protein: item.nutrition.protein,
    carbs: item.nutrition.carbs,
    fat: item.nutrition.fat,
    fiber: item.nutrition.fiber,
    sugar: item.nutrition.sugar,
    sodium: item.nutrition.sodium,
    vitaminA: item.nutrition.vitaminA,
    vitaminC: item.nutrition.vitaminC,
    vitaminD: item.nutrition.vitaminD,
    vitaminB12: item.nutrition.vitaminB12,
    calcium: item.nutrition.calcium,
    iron: item.nutrition.iron,
    magnesium: item.nutrition.magnesium,
    potassium: item.nutrition.potassium,
    zinc: item.nutrition.zinc,
  };
}

export async function createMealForProfile(profileId: string, raw: MealInput) {
  const input = mealInputSchema.parse(raw);
  if (input.clientRequestId) {
    const existing = await prisma.meal.findUnique({
      where: { profileId_clientRequestId: { profileId, clientRequestId: input.clientRequestId } },
      include: { foodItems: true },
    });
    if (existing) return { meal: existing, created: false };
  }
  let meal;
  try {
    meal = await prisma.meal.create({
      data: {
        profileId,
        date: dateFromKey(input.dateKey),
        dateKey: input.dateKey,
        timezone: input.timezone,
        mealType: input.mealType as MealType,
        mealName: input.mealName,
        entryKind: input.entryKind,
        time: input.time || null,
        notes: input.notes || null,
        clientRequestId: input.clientRequestId || null,
        foodItems: { create: input.items.map(itemData) },
      },
      include: { foodItems: true },
    });
  } catch (error) {
    // Two devices or taps may race before the first idempotency lookup finishes.
    if (input.clientRequestId && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.meal.findUnique({
        where: { profileId_clientRequestId: { profileId, clientRequestId: input.clientRequestId } },
        include: { foodItems: true },
      });
      if (existing) return { meal: existing, created: false };
    }
    throw error;
  }
  // Remembering a correction is a convenience cache and must never make a
  // successfully persisted nutrition entry appear to have failed.
  await rememberCorrectedFoods(profileId, input.items).catch(() => undefined);
  return { meal, created: true };
}

export async function updateMealForProfile(
  profileId: string,
  mealId: string,
  raw: MealInput,
  expectedUpdatedAt?: Date,
) {
  const input = mealInputSchema.parse(raw);
  return prisma.$transaction(async (tx) => {
    const owned = await tx.meal.findFirst({ where: { id: mealId, profileId } });
    if (!owned) throw new MealServiceError("Nutrition entry not found.", "NOT_FOUND");
    if (expectedUpdatedAt && owned.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new MealServiceError("This entry changed on another device. Refresh before saving again.", "CONFLICT");
    }
    await tx.foodItem.deleteMany({ where: { mealId } });
    const result = await tx.meal.update({
      where: { id: mealId },
      data: {
        date: dateFromKey(input.dateKey), dateKey: input.dateKey, timezone: input.timezone,
        mealType: input.mealType as MealType, mealName: input.mealName,
        entryKind: input.entryKind, time: input.time || null, notes: input.notes || null,
        foodItems: { create: input.items.map(itemData) },
      },
      include: { foodItems: true },
    });
    return result;
  }).then(async (meal) => {
    await rememberCorrectedFoods(profileId, input.items).catch(() => undefined);
    return meal;
  });
}

export async function deleteMealForProfile(profileId: string, mealId: string) {
  const deleted = await prisma.meal.deleteMany({ where: { id: mealId, profileId } });
  if (!deleted.count) throw new MealServiceError("Nutrition entry not found.", "NOT_FOUND");
}

export async function duplicateMealForProfile(profileId: string, mealId: string, dateKey: string, clientRequestId?: string) {
  const source = await prisma.meal.findFirst({ where: { id: mealId, profileId }, include: { foodItems: true } });
  if (!source) throw new MealServiceError("Nutrition entry not found.", "NOT_FOUND");
  return createMealForProfile(profileId, {
    dateKey, timezone: source.timezone || "UTC", mealType: source.mealType,
    mealName: source.mealName, entryKind: source.entryKind as MealInput["entryKind"],
    time: source.time, notes: source.notes, clientRequestId: clientRequestId || null,
    items: source.foodItems.map(inputFromStoredItem),
  });
}

export async function saveMealTemplateForProfile(profileId: string, raw: MealInput, name: string) {
  const input = mealInputSchema.parse(raw);
  const cleanName = name.trim().slice(0, 200);
  if (!cleanName) throw new MealServiceError("Template name is required.", "INVALID");
  return prisma.mealTemplate.upsert({
    where: { profileId_name: { profileId, name: cleanName } },
    update: {
      mealType: input.mealType as MealType, entryKind: input.entryKind, notes: input.notes,
      archived: false, foodItems: { deleteMany: {}, create: input.items.map(itemData) },
    },
    create: {
      profileId, name: cleanName, mealType: input.mealType as MealType,
      entryKind: input.entryKind, notes: input.notes,
      foodItems: { create: input.items.map(itemData) },
    },
    include: { foodItems: true },
  });
}

export async function logTemplateForProfile(profileId: string, templateId: string, dateKey: string, timezone: string, clientRequestId?: string) {
  const template = await prisma.mealTemplate.findFirst({ where: { id: templateId, profileId, archived: false }, include: { foodItems: true } });
  if (!template) throw new MealServiceError("Saved entry not found.", "NOT_FOUND");
  const result = await createMealForProfile(profileId, {
    dateKey, timezone, mealType: template.mealType, mealName: template.name,
    entryKind: template.entryKind as MealInput["entryKind"], notes: template.notes,
    time: null, clientRequestId: clientRequestId || null,
    items: template.foodItems.map(inputFromStoredItem),
  });
  if (result.created) await prisma.mealTemplate.update({ where: { id: template.id }, data: { useCount: { increment: 1 }, lastUsedAt: new Date() } });
  return result;
}

export async function archiveTemplateForProfile(profileId: string, templateId: string) {
  const result = await prisma.mealTemplate.updateMany({ where: { id: templateId, profileId }, data: { archived: true } });
  if (!result.count) throw new MealServiceError("Saved entry not found.", "NOT_FOUND");
}

export async function renameTemplateForProfile(profileId: string, templateId: string, rawName: string) {
  const name = rawName.trim().slice(0, 200);
  if (!name) throw new MealServiceError("Saved meal name is required.", "INVALID");
  const existing = await prisma.mealTemplate.findFirst({ where: { id: templateId, profileId, archived: false } });
  if (!existing) throw new MealServiceError("Saved entry not found.", "NOT_FOUND");
  try {
    return await prisma.mealTemplate.update({ where: { id: existing.id }, data: { name } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new MealServiceError("You already have a saved meal with that name.", "CONFLICT");
    }
    throw error;
  }
}

export function inputFromStoredItem(item: {
  name: string; brand?: string | null; barcode?: string | null; source?: string; sourceId?: string | null;
  servingSize: string | null; grams?: number; servings?: number; gramsPerServing?: number;
  referenceNutrition?: unknown; nutritionConfidence?: string; missingNutrients?: string; userEdited?: boolean;
  calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number;
  vitaminA: number; vitaminC: number; vitaminD: number; vitaminB12: number; calcium: number; iron: number;
  magnesium: number; potassium: number; zinc: number;
}): FoodItemInput {
  const nutrition = {
    calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat,
    fiber: item.fiber, sugar: item.sugar, sodium: item.sodium, vitaminA: item.vitaminA,
    vitaminC: item.vitaminC, vitaminD: item.vitaminD, vitaminB12: item.vitaminB12,
    calcium: item.calcium, iron: item.iron, magnesium: item.magnesium,
    potassium: item.potassium, zinc: item.zinc,
  };
  const reference = item.referenceNutrition && typeof item.referenceNutrition === "object"
    ? item.referenceNutrition
    : nutrition;
  return normalizeFoodItem(foodItemInputSchemaCompat({
    name: item.name, brand: item.brand || null, barcode: item.barcode || null,
    source: item.source || "Historical", sourceId: item.sourceId || null,
    servingSize: item.servingSize, grams: item.grams ?? 100, servings: item.servings ?? 1,
    gramsPerServing: item.gramsPerServing ?? 100, referenceNutrition: reference,
    nutrition, nutritionConfidence: item.nutritionConfidence || "missing",
    missingNutrients: (item.missingNutrients || "").split(",").filter(Boolean),
    userEdited: item.userEdited ?? true,
  }));
}

function foodItemInputSchemaCompat(value: unknown) {
  return mealInputSchema.shape.items.element.parse(value);
}

async function rememberCorrectedFoods(profileId: string, items: FoodItemInput[]) {
  await Promise.all(items.map(async (raw) => {
    const item = normalizeFoodItem(raw);
    if (!item.barcode || !item.userEdited) return;
    const n = item.referenceNutrition;
    await prisma.savedFood.upsert({
      where: { profileId_barcode: { profileId, barcode: item.barcode } },
      create: {
        profileId, barcode: item.barcode, name: item.name, brand: item.brand,
        source: "User corrected", sourceId: item.sourceId, servingGrams: item.gramsPerServing,
        servingLabel: item.servingSize, confidence: item.nutritionConfidence,
        missingNutrients: item.missingNutrients.join(","), userEdited: true,
        useCount: 1, lastUsedAt: new Date(), ...n,
      },
      update: {
        name: item.name, brand: item.brand, source: "User corrected", sourceId: item.sourceId,
        servingGrams: item.gramsPerServing, servingLabel: item.servingSize,
        confidence: item.nutritionConfidence, missingNutrients: item.missingNutrients.join(","),
        userEdited: true, useCount: { increment: 1 }, lastUsedAt: new Date(), ...n,
      },
    });
  }));
}
