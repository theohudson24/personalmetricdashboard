"use server";

import { MealType } from "@prisma/client";
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

const defaultTodos = [
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
  const settings = await prisma.userSettings.findFirst();

  if (!settings) {
    await prisma.userSettings.create({ data: { profileId: profile.id } });
  } else if (!settings.profileId) {
    await prisma.userSettings.update({
      where: { id: settings.id },
      data: { profileId: profile.id },
    });
  }

  const today = startOfDay();
  const todoCount = await prisma.todoItem.count({ where: { date: today } });

  if (todoCount === 0) {
    await prisma.todoItem.createMany({
      data: defaultTodos.map((title) => ({ date: today, title, profileId: profile.id })),
    });
  }
}

export async function updateDailyLog(formData: FormData) {
  const profile = await getDefaultProfile();
  const date = parseDateInput(formData.get("date"));

  await prisma.dailyLog.upsert({
    where: { date },
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

export async function addTodo(formData: FormData) {
  const profile = await getDefaultProfile();
  const title = stringValue(formData, "title");

  if (!title) {
    return;
  }

  await prisma.todoItem.create({
    data: {
      date: parseDateInput(formData.get("date")),
      title,
      profileId: profile.id,
    },
  });

  revalidatePath("/");
}

export async function toggleTodo(formData: FormData) {
  const id = stringValue(formData, "id");
  const completed = formData.get("completed") === "true";

  if (!id) {
    return;
  }

  await prisma.todoItem.update({
    where: { id },
    data: { completed: !completed },
  });

  revalidatePath("/");
}

export async function deleteTodo(formData: FormData) {
  const id = stringValue(formData, "id");

  if (!id) {
    return;
  }

  await prisma.todoItem.delete({ where: { id } });
  revalidatePath("/");
}

export async function resetTodos(formData: FormData) {
  const profile = await getDefaultProfile();
  const date = parseDateInput(formData.get("date"));

  await prisma.todoItem.deleteMany({ where: { date } });
  await prisma.todoItem.createMany({
    data: defaultTodos.map((title) => ({ date, title, profileId: profile.id })),
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
  const mealName = stringValue(formData, "mealName", "Meal");
  const itemNames = formData.getAll("foodName").map(String);

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

  await prisma.meal.create({
    data: {
      date: parseDateInput(formData.get("date")),
      profileId: profile.id,
      mealType: stringValue(formData, "mealType", "BREAKFAST") as MealType,
      mealName,
      time: optionalString(formData, "time"),
      notes: optionalString(formData, "notes"),
      foodItems: { create: foodItems },
    },
  });

  revalidateApp();
}

export async function updateSettings(formData: FormData) {
  const profile = await getDefaultProfile();
  const existing = await prisma.userSettings.findFirst();
  const includeProfileMetrics = formData.get("includeProfileMetrics") === "true";
  const heightFeet = optionalNumber(formData, "heightFeet");
  const heightInchesRemainder = optionalNumber(formData, "heightInchesRemainder");
  const weightLb = optionalNumber(formData, "weightLb");
  const age = optionalNumber(formData, "age");
  const gender = stringValue(formData, "gender");
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
