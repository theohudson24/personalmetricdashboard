"use server";

import { MealType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { parseDateInput, startOfDay } from "@/lib/dates";
import {
  numberValue,
  optionalNumber,
  optionalString,
  stringValue,
} from "@/lib/forms";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { inferExerciseDetails } from "@/lib/exerciseCatalog";
import { calculateNutritionRecommendation } from "@/lib/recommendations";
import { normalizeBarcode } from "@/lib/foodDataCentral";

const defaultTodos = [
  "Log morning body weight",
  "Log sleep hours",
  "Score energy, soreness, stress, and mood",
  "Log first water intake",
  "Plan protein and calories for the day",
  "Choose today's training focus",
  "Review yesterday's nutrition and workout notes",
];

const legacyDefaultTodos = [
  "Drink water",
  "Take morning supplements",
  "Complete workout",
  "Hit protein goal",
  "Log meals",
  "Stretch or mobility work",
  "Complete nighttime routine",
];

function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/gym");
  revalidatePath("/meals");
  revalidatePath("/settings");
}

export async function ensureDefaultData() {
  const profile = await getDefaultProfile();
  const settings = await prisma.userSettings.findUnique({ where: { profileId: profile.id } });

  if (!settings) {
    await prisma.userSettings.create({ data: { profileId: profile.id } });
  }

  const today = startOfDay();
  const todoCount = await prisma.todoItem.count({ where: { date: today, profileId: profile.id } });

  if (todoCount === 0) {
    await prisma.todoItem.createMany({
      data: defaultTodos.map((title) => ({ date: today, title, profileId: profile.id })),
      skipDuplicates: true,
    });
  } else {
    await prisma.todoItem.deleteMany({
      where: {
        date: today,
        profileId: profile.id,
        title: { in: legacyDefaultTodos },
      },
    });

    const existingTodos = await prisma.todoItem.findMany({
      where: { date: today, profileId: profile.id },
      select: { title: true },
    });
    const existingTitles = new Set(existingTodos.map((todo) => todo.title));
    const missingDefaults = defaultTodos.filter((title) => !existingTitles.has(title));

    if (missingDefaults.length > 0) {
      await prisma.todoItem.createMany({
        data: missingDefaults.map((title) => ({ date: today, title, profileId: profile.id })),
        skipDuplicates: true,
      });
    }
  }
}

export async function updateDailyLog(formData: FormData) {
  const profile = await getDefaultProfile();
  const date = parseDateInput(formData.get("date"));

  await prisma.dailyLog.upsert({
    where: { profileId_date: { profileId: profile.id, date } },
    create: {
      profileId: profile.id,
      date,
      bodyWeight: optionalNumber(formData, "bodyWeight"),
      sleepHours: optionalNumber(formData, "sleepHours"),
      restingHeartRate: optionalNumber(formData, "restingHeartRate"),
      mood: optionalNumber(formData, "mood"),
      energyLevel: optionalNumber(formData, "energyLevel"),
      sorenessLevel: optionalNumber(formData, "sorenessLevel"),
      stressLevel: optionalNumber(formData, "stressLevel"),
      waterIntake: optionalNumber(formData, "waterIntake"),
      notes: optionalString(formData, "notes"),
    },
    update: {
      bodyWeight: optionalNumber(formData, "bodyWeight"),
      sleepHours: optionalNumber(formData, "sleepHours"),
      restingHeartRate: optionalNumber(formData, "restingHeartRate"),
      mood: optionalNumber(formData, "mood"),
      energyLevel: optionalNumber(formData, "energyLevel"),
      sorenessLevel: optionalNumber(formData, "sorenessLevel"),
      stressLevel: optionalNumber(formData, "stressLevel"),
      waterIntake: optionalNumber(formData, "waterIntake"),
      notes: optionalString(formData, "notes"),
    },
  });

  revalidateApp();
}

export type AddTodoState = { status: "idle" | "success" | "error"; message: string };

export async function addTodo(_previousState: AddTodoState, formData: FormData): Promise<AddTodoState> {
  const profile = await getDefaultProfile();
  const title = stringValue(formData, "title");

  if (!title) {
    return { status: "error", message: "Enter a task title." };
  }

  try {
    await prisma.todoItem.create({
      data: {
        date: parseDateInput(formData.get("date")),
        title,
        profileId: profile.id,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", message: "That task already exists today." };
    }
    throw error;
  }

  revalidatePath("/");
  return { status: "success", message: "Task added." };
}

export async function toggleTodo(formData: FormData) {
  const profile = await getDefaultProfile();
  const id = stringValue(formData, "id");
  const completed = formData.get("completed") === "true";

  if (!id) {
    return;
  }

  await prisma.todoItem.updateMany({
    where: { id, profileId: profile.id },
    data: { completed: !completed },
  });

  revalidatePath("/");
}

export async function deleteTodo(formData: FormData) {
  const profile = await getDefaultProfile();
  const id = stringValue(formData, "id");

  if (!id) {
    return;
  }

  await prisma.todoItem.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath("/");
}

export async function resetTodos(formData: FormData) {
  const profile = await getDefaultProfile();
  const date = parseDateInput(formData.get("date"));

  await prisma.todoItem.deleteMany({ where: { date, profileId: profile.id } });
  await prisma.todoItem.createMany({
    data: defaultTodos.map((title) => ({ date, title, profileId: profile.id })),
    skipDuplicates: true,
  });

  revalidatePath("/");
}

export async function createWorkout(formData: FormData) {
  const profile = await getDefaultProfile();
  const name = stringValue(formData, "name", "Workout");
  const workoutNotes = optionalString(formData, "notes");
  const shouldSaveTemplate = formData.get("saveAsTemplate") === "on";
  const templateName = stringValue(formData, "templateName", name);
  const exerciseNames = formData.getAll("exerciseName").map(String);
  const exerciseNotes = formData.getAll("exerciseNotes").map(String);
  const repsValues = formData.getAll("reps").map(String);
  const weightValues = formData.getAll("weight").map(String);
  const setTypeValues = formData.getAll("setType").map(String);
  const exerciseIndexes = formData.getAll("setExerciseIndex").map(String);
  const catalogItems = await prisma.exerciseCatalog.findMany({
    where: {
      name: {
        in: exerciseNames.map((exerciseName) => exerciseName.trim()).filter(Boolean),
      },
    },
  });
  const catalogByName = new Map(
    catalogItems.map((item) => [item.name.toLowerCase(), item]),
  );

  const exercises = exerciseNames
    .map((exerciseName, index) => {
      const trimmedName = exerciseName.trim();
      const catalogItem = catalogByName.get(trimmedName.toLowerCase());
      const inferred = inferExerciseDetails(trimmedName);

      return {
        name: trimmedName,
        muscleGroup: catalogItem?.muscleGroup ?? inferred.muscleGroup,
        notes: exerciseNotes[index]?.trim() || null,
        sets: repsValues
          .map((reps, setIndex) => ({
            reps: Number(reps),
            weight: Number(weightValues[setIndex]),
            setType: setTypeValues[setIndex] || "WORKING",
            exerciseIndex: Number(exerciseIndexes[setIndex]),
          }))
          .filter(
            (set) =>
              set.exerciseIndex === index &&
              Number.isFinite(set.reps) &&
              Number.isFinite(set.weight),
          )
          .map((set, setNumber) => ({
            setNumber: setNumber + 1,
            setType: set.setType,
            reps: set.reps,
            weight: set.weight,
          })),
      };
    })
    .filter((exercise) => exercise.name && exercise.sets.length > 0);

  if (exercises.length === 0) {
    return;
  }

  const muscleGroups =
    Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup))).join(", ") ||
    "General";

  await prisma.workout.create({
    data: {
      date: parseDateInput(formData.get("date")),
      profileId: profile.id,
      name,
      muscleGroups,
      notes: workoutNotes,
      exercises: {
        create: exercises.map((exercise) => ({
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          notes: exercise.notes,
          sets: { create: exercise.sets },
        })),
      },
    },
  });

  if (shouldSaveTemplate && templateName) {
    await prisma.workoutTemplate.deleteMany({
      where: {
        profileId: profile.id,
        name: templateName,
      },
    });

    await prisma.workoutTemplate.create({
      data: {
        profileId: profile.id,
        name: templateName,
        notes: workoutNotes,
        exercises: {
          create: exercises.map((exercise, orderIndex) => ({
            orderIndex,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            notes: exercise.notes,
            sets: {
              create: exercise.sets.map((set) => ({
                setNumber: set.setNumber,
                setType: set.setType,
                reps: set.reps,
                weight: set.weight,
              })),
            },
          })),
        },
      },
    });
  }

  revalidateApp();
}

export async function createBodyMeasurement(formData: FormData) {
  const profile = await getDefaultProfile();
  await prisma.bodyMeasurement.create({
    data: {
      profileId: profile.id,
      date: parseDateInput(formData.get("date")),
      bodyWeight: optionalNumber(formData, "bodyWeight"),
      chest: optionalNumber(formData, "chest"),
      arms: optionalNumber(formData, "arms"),
      waist: optionalNumber(formData, "waist"),
      legs: optionalNumber(formData, "legs"),
      notes: optionalString(formData, "notes"),
    },
  });

  revalidatePath("/gym");
}

export async function createMeal(formData: FormData) {
  const profile = await getDefaultProfile();
  const entryKind = ["MEAL", "ITEM", "DRINK", "SNACK"].includes(stringValue(formData, "entryKind")) ? stringValue(formData, "entryKind") : "MEAL";
  const itemNames = formData.getAll("foodName").map(String);
  const barcodes = formData.getAll("foodBarcode").map((value) => normalizeBarcode(String(value)));
  const brands = formData.getAll("foodBrand").map(String);
  const grams = formData.getAll("foodGrams").map(Number);

  const foodItems = itemNames
    .map((name, index) => ({
      name: name.trim(),
      servingSize: formData.getAll("servingSize").map(String)[index]?.trim() || null,
      calories: Number(formData.getAll("calories").map(String)[index] || 0),
      protein: Number(formData.getAll("protein").map(String)[index] || 0),
      carbs: Number(formData.getAll("carbs").map(String)[index] || 0),
      fat: Number(formData.getAll("fat").map(String)[index] || 0),
      fiber: Number(formData.getAll("fiber").map(String)[index] || 0),
      sugar: Number(formData.getAll("sugar").map(String)[index] || 0),
      sodium: Number(formData.getAll("sodium").map(String)[index] || 0),
      vitaminA: Number(formData.getAll("vitaminA").map(String)[index] || 0),
      vitaminC: Number(formData.getAll("vitaminC").map(String)[index] || 0),
      vitaminD: Number(formData.getAll("vitaminD").map(String)[index] || 0),
      vitaminB12: Number(formData.getAll("vitaminB12").map(String)[index] || 0),
      calcium: Number(formData.getAll("calcium").map(String)[index] || 0),
      iron: Number(formData.getAll("iron").map(String)[index] || 0),
      magnesium: Number(formData.getAll("magnesium").map(String)[index] || 0),
      potassium: Number(formData.getAll("potassium").map(String)[index] || 0),
      zinc: Number(formData.getAll("zinc").map(String)[index] || 0),
    }))
    .filter((item) => item.name);

  if (foodItems.length === 0) {
    return;
  }
  const mealName = entryKind === "MEAL" ? stringValue(formData, "mealName", "Meal") : foodItems[0].name;

  await prisma.meal.create({
    data: {
      date: parseDateInput(formData.get("date")),
      profileId: profile.id,
      mealType: stringValue(formData, "mealType", "BREAKFAST") as MealType,
      mealName,
      entryKind,
      time: optionalString(formData, "time"),
      notes: optionalString(formData, "notes"),
      foodItems: { create: foodItems },
    },
  });

  await Promise.all(foodItems.map(async (item, index) => {
    const barcode = barcodes[index];
    const weight = grams[index];
    if (!barcode || !Number.isFinite(weight) || weight <= 0) return;
    const per100 = (value: number) => Number(((value * 100) / weight).toFixed(4));
    const saved = {
      name: item.name, brand: brands[index] || null, source: "User corrected",
      servingGrams: weight, servingLabel: item.servingSize,
      calories: per100(item.calories), protein: per100(item.protein), carbs: per100(item.carbs),
      fat: per100(item.fat), fiber: per100(item.fiber), sugar: per100(item.sugar),
      sodium: per100(item.sodium), vitaminA: per100(item.vitaminA), vitaminC: per100(item.vitaminC),
      vitaminD: per100(item.vitaminD), vitaminB12: per100(item.vitaminB12), calcium: per100(item.calcium),
      iron: per100(item.iron), magnesium: per100(item.magnesium), potassium: per100(item.potassium), zinc: per100(item.zinc),
    };
    await prisma.savedFood.upsert({
      where: { profileId_barcode: { profileId: profile.id, barcode } },
      create: { profileId: profile.id, barcode, ...saved }, update: saved,
    });
  }));

  if (entryKind === "MEAL" && formData.get("saveAsTemplate") === "on") {
    await prisma.mealTemplate.deleteMany({ where: { profileId: profile.id, name: mealName } });
    await prisma.mealTemplate.create({
      data: {
        profileId: profile.id,
        name: mealName,
        mealType: stringValue(formData, "mealType", "BREAKFAST") as MealType,
        notes: optionalString(formData, "notes"),
        foodItems: { create: foodItems },
      },
    });
  }

  revalidateApp();
}

export async function reuseMealTemplate(formData: FormData) {
  const profile = await getDefaultProfile();
  const id = stringValue(formData, "id");
  if (!id) return;
  const template = await prisma.mealTemplate.findFirst({ where: { id, profileId: profile.id }, include: { foodItems: true } });
  if (!template) return;
  await prisma.meal.create({
    data: {
      profileId: profile.id,
      date: startOfDay(),
      mealType: template.mealType,
      mealName: template.name,
      notes: template.notes,
      foodItems: { create: template.foodItems.map((item) => ({
        name: item.name, servingSize: item.servingSize, calories: item.calories,
        protein: item.protein, carbs: item.carbs, fat: item.fat, fiber: item.fiber,
        sugar: item.sugar, sodium: item.sodium, vitaminA: item.vitaminA,
        vitaminC: item.vitaminC, vitaminD: item.vitaminD, vitaminB12: item.vitaminB12,
        calcium: item.calcium, iron: item.iron, magnesium: item.magnesium,
        potassium: item.potassium, zinc: item.zinc,
      })) },
    },
  });
  revalidatePath("/meals");
}

export async function reuseLoggedEntry(formData: FormData) {
  const profile = await getDefaultProfile();
  const id = stringValue(formData, "id");
  if (!id) return;
  const previous = await prisma.meal.findFirst({ where: { id, profileId: profile.id }, include: { foodItems: true } });
  if (!previous) return;
  await prisma.meal.create({
    data: {
      profileId: profile.id, date: startOfDay(), mealType: previous.mealType,
      mealName: previous.mealName, entryKind: previous.entryKind, time: previous.time, notes: previous.notes,
      foodItems: { create: previous.foodItems.map(({ name, servingSize, calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, vitaminD, vitaminB12, calcium, iron, magnesium, potassium, zinc }) => ({ name, servingSize, calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, vitaminD, vitaminB12, calcium, iron, magnesium, potassium, zinc })) },
    },
  });
  revalidatePath("/meals");
}

export async function deleteMeal(formData: FormData) {
  const profile = await getDefaultProfile();
  const id = stringValue(formData, "id");
  if (!id) return;
  await prisma.meal.deleteMany({ where: { id, profileId: profile.id } });
  revalidateApp();
}

export async function updateMeal(formData: FormData) {
  const profile = await getDefaultProfile();
  const id = stringValue(formData, "id");
  if (!id) return;
  const names = formData.getAll("foodName").map(String);
  const servings = formData.getAll("servingSize").map(String);
  const calories = formData.getAll("calories").map(Number);
  const protein = formData.getAll("protein").map(Number);
  const foodItems = names.map((name, index) => ({ name: name.trim(), servingSize: servings[index] || null, calories: calories[index] || 0, protein: protein[index] || 0 })).filter((item) => item.name);
  const ownedMeal = await prisma.meal.findFirst({ where: { id, profileId: profile.id }, select: { id: true } });
  if (!ownedMeal) return;
  await prisma.$transaction([
    prisma.foodItem.deleteMany({ where: { mealId: id } }),
    prisma.meal.updateMany({ where: { id, profileId: profile.id }, data: { mealName: stringValue(formData, "mealName", "Meal"), notes: optionalString(formData, "notes") } }),
    prisma.foodItem.createMany({ data: foodItems.map((item) => ({ ...item, mealId: id })) }),
  ]);
  revalidateApp();
}

export async function updateSettings(formData: FormData) {
  const profile = await getDefaultProfile();
  const existing = await prisma.userSettings.findUnique({ where: { profileId: profile.id } });
  const includeProfileMetrics = formData.get("includeProfileMetrics") === "true";
  const heightFeet = optionalNumber(formData, "heightFeet");
  const heightInchesRemainder = optionalNumber(formData, "heightInchesRemainder");
  const weightLb = optionalNumber(formData, "weightLb");
  const age = optionalNumber(formData, "age");
  const gender = stringValue(formData, "gender");
  const activityLevel = stringValue(formData, "activityLevel", "moderate");
  const heightInches =
    heightFeet !== null || heightInchesRemainder !== null
      ? (heightFeet ?? 0) * 12 + (heightInchesRemainder ?? 0)
      : profile.heightInches;
  const updatedProfile = includeProfileMetrics
    ? await prisma.profile.update({
        where: { id: profile.id },
        data: {
          heightInches,
          weightLb,
          age: age !== null ? Math.round(age) : null,
          gender: gender || null,
          activityLevel,
        },
      })
    : profile;
  const recommendation = calculateNutritionRecommendation(updatedProfile);
  const shouldUseRecommendation =
    formData.get("goalMode") === "recommended" && recommendation !== null;
  const data = {
    profileId: profile.id,
    dailyCalorieGoal: shouldUseRecommendation
      ? recommendation.dailyCalorieGoal
      : numberValue(formData, "dailyCalorieGoal", 3000),
    dailyProteinGoal: shouldUseRecommendation
      ? recommendation.dailyProteinGoal
      : numberValue(formData, "dailyProteinGoal", 180),
    dailyCarbGoal: shouldUseRecommendation
      ? recommendation.dailyCarbGoal
      : numberValue(formData, "dailyCarbGoal", 350),
    dailyFatGoal: shouldUseRecommendation
      ? recommendation.dailyFatGoal
      : numberValue(formData, "dailyFatGoal", 85),
    dailyFiberGoal: shouldUseRecommendation
      ? recommendation.dailyFiberGoal
      : numberValue(formData, "dailyFiberGoal", 30),
    dailyWaterGoal: shouldUseRecommendation
      ? recommendation.dailyWaterGoal
      : numberValue(formData, "dailyWaterGoal", 128),
    dailyVitaminAGoal: shouldUseRecommendation
      ? recommendation.dailyVitaminAGoal
      : numberValue(formData, "dailyVitaminAGoal", 900),
    dailyVitaminCGoal: shouldUseRecommendation
      ? recommendation.dailyVitaminCGoal
      : numberValue(formData, "dailyVitaminCGoal", 90),
    dailyVitaminDGoal: shouldUseRecommendation
      ? recommendation.dailyVitaminDGoal
      : numberValue(formData, "dailyVitaminDGoal", 15),
    dailyVitaminB12Goal: shouldUseRecommendation
      ? recommendation.dailyVitaminB12Goal
      : numberValue(formData, "dailyVitaminB12Goal", 2.4),
    dailyCalciumGoal: shouldUseRecommendation
      ? recommendation.dailyCalciumGoal
      : numberValue(formData, "dailyCalciumGoal", 1000),
    dailyIronGoal: shouldUseRecommendation
      ? recommendation.dailyIronGoal
      : numberValue(formData, "dailyIronGoal", 8),
    dailyMagnesiumGoal: shouldUseRecommendation
      ? recommendation.dailyMagnesiumGoal
      : numberValue(formData, "dailyMagnesiumGoal", 400),
    dailyPotassiumGoal: shouldUseRecommendation
      ? recommendation.dailyPotassiumGoal
      : numberValue(formData, "dailyPotassiumGoal", 3400),
    dailyZincGoal: shouldUseRecommendation
      ? recommendation.dailyZincGoal
      : numberValue(formData, "dailyZincGoal", 11),
    dailySodiumLimit: shouldUseRecommendation
      ? recommendation.dailySodiumLimit
      : numberValue(formData, "dailySodiumLimit", 2300),
    useRecommendedGoals: shouldUseRecommendation,
  };

  if (existing) {
    await prisma.userSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.userSettings.create({ data });
  }

  revalidateApp();
}
