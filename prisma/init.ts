import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const statements = [
  `CREATE TABLE IF NOT EXISTS "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "heightInches" REAL,
    "weightLb" REAL,
    "age" INTEGER,
    "gender" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT,
    "dailyCalorieGoal" INTEGER NOT NULL DEFAULT 3000,
    "dailyProteinGoal" INTEGER NOT NULL DEFAULT 180,
    "dailyCarbGoal" INTEGER NOT NULL DEFAULT 350,
    "dailyFatGoal" INTEGER NOT NULL DEFAULT 85,
    "dailyFiberGoal" INTEGER NOT NULL DEFAULT 30,
    "dailyWaterGoal" INTEGER NOT NULL DEFAULT 128,
    "dailyVitaminAGoal" REAL NOT NULL DEFAULT 900,
    "dailyVitaminCGoal" REAL NOT NULL DEFAULT 90,
    "dailyVitaminDGoal" REAL NOT NULL DEFAULT 15,
    "dailyVitaminB12Goal" REAL NOT NULL DEFAULT 2.4,
    "dailyCalciumGoal" REAL NOT NULL DEFAULT 1000,
    "dailyIronGoal" REAL NOT NULL DEFAULT 8,
    "dailyMagnesiumGoal" REAL NOT NULL DEFAULT 400,
    "dailyPotassiumGoal" REAL NOT NULL DEFAULT 3400,
    "dailyZincGoal" REAL NOT NULL DEFAULT 11,
    "dailySodiumLimit" REAL NOT NULL DEFAULT 2300,
    "useRecommendedGoals" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "DailyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT,
    "date" DATETIME NOT NULL,
    "bodyWeight" REAL,
    "sleepHours" REAL,
    "restingHeartRate" INTEGER,
    "mood" INTEGER,
    "energyLevel" INTEGER,
    "sorenessLevel" INTEGER,
    "stressLevel" INTEGER,
    "waterIntake" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DailyLog_date_key" ON "DailyLog"("date")`,
  `CREATE TABLE IF NOT EXISTS "TodoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TodoItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "TodoItem_date_idx" ON "TodoItem"("date")`,
  `CREATE TABLE IF NOT EXISTS "Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "duration" TEXT,
    "durationMinutes" INTEGER,
    "muscleGroups" TEXT NOT NULL,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workout_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Workout_date_idx" ON "Workout"("date")`,
  `CREATE TABLE IF NOT EXISTS "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Exercise_workoutId_idx" ON "Exercise"("workoutId")`,
  `CREATE INDEX IF NOT EXISTS "Exercise_name_idx" ON "Exercise"("name")`,
  `CREATE TABLE IF NOT EXISTS "ExerciseSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "setType" TEXT NOT NULL DEFAULT 'WORKING',
    "reps" INTEGER NOT NULL,
    "weight" REAL NOT NULL,
    "distance" REAL NOT NULL DEFAULT 0,
    "seconds" REAL NOT NULL DEFAULT 0,
    "rpe" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "ExerciseSet_exerciseId_idx" ON "ExerciseSet"("exerciseId")`,
  `CREATE TABLE IF NOT EXISTS "WorkoutTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutTemplate_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "WorkoutTemplateExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "WorkoutTemplateExercise_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "WorkoutTemplateSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "setType" TEXT NOT NULL DEFAULT 'WORKING',
    "reps" INTEGER NOT NULL,
    "weight" REAL NOT NULL,
    CONSTRAINT "WorkoutTemplateSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "WorkoutTemplateExercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "BodyMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT,
    "date" DATETIME NOT NULL,
    "bodyWeight" REAL,
    "chest" REAL,
    "arms" REAL,
    "waist" REAL,
    "legs" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BodyMeasurement_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "BodyMeasurement_date_idx" ON "BodyMeasurement"("date")`,
  `CREATE TABLE IF NOT EXISTS "Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT,
    "date" DATETIME NOT NULL,
    "mealType" TEXT NOT NULL,
    "mealName" TEXT NOT NULL,
    "time" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Meal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Meal_date_idx" ON "Meal"("date")`,
  `CREATE TABLE IF NOT EXISTS "FoodItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "servingSize" TEXT,
    "calories" INTEGER NOT NULL DEFAULT 0,
    "protein" REAL NOT NULL DEFAULT 0,
    "carbs" REAL NOT NULL DEFAULT 0,
    "fat" REAL NOT NULL DEFAULT 0,
    "fiber" REAL NOT NULL DEFAULT 0,
    "sugar" REAL NOT NULL DEFAULT 0,
    "sodium" REAL NOT NULL DEFAULT 0,
    "vitaminA" REAL NOT NULL DEFAULT 0,
    "vitaminC" REAL NOT NULL DEFAULT 0,
    "vitaminD" REAL NOT NULL DEFAULT 0,
    "vitaminB12" REAL NOT NULL DEFAULT 0,
    "calcium" REAL NOT NULL DEFAULT 0,
    "iron" REAL NOT NULL DEFAULT 0,
    "magnesium" REAL NOT NULL DEFAULT 0,
    "potassium" REAL NOT NULL DEFAULT 0,
    "zinc" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FoodItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "FoodItem_mealId_idx" ON "FoodItem"("mealId")`,
  `CREATE TABLE IF NOT EXISTS "ExerciseCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Strength',
    "equipment" TEXT,
    "aliases" TEXT,
    "importedFrom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseCatalog_name_key" ON "ExerciseCatalog"("name")`,
  `CREATE INDEX IF NOT EXISTS "ExerciseCatalog_muscleGroup_idx" ON "ExerciseCatalog"("muscleGroup")`,
  `CREATE INDEX IF NOT EXISTS "ExerciseCatalog_category_idx" ON "ExerciseCatalog"("category")`,
];

const indexStatements = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_profileId_key" ON "UserSettings"("profileId")`,
  `CREATE INDEX IF NOT EXISTS "TodoItem_profileId_idx" ON "TodoItem"("profileId")`,
  `CREATE INDEX IF NOT EXISTS "Workout_profileId_idx" ON "Workout"("profileId")`,
  `CREATE INDEX IF NOT EXISTS "Workout_source_idx" ON "Workout"("source")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Workout_externalId_key" ON "Workout"("externalId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WorkoutTemplate_profileId_name_key" ON "WorkoutTemplate"("profileId", "name")`,
  `CREATE INDEX IF NOT EXISTS "WorkoutTemplate_profileId_idx" ON "WorkoutTemplate"("profileId")`,
  `CREATE INDEX IF NOT EXISTS "WorkoutTemplateExercise_templateId_idx" ON "WorkoutTemplateExercise"("templateId")`,
  `CREATE INDEX IF NOT EXISTS "WorkoutTemplateSet_exerciseId_idx" ON "WorkoutTemplateSet"("exerciseId")`,
  `CREATE INDEX IF NOT EXISTS "BodyMeasurement_profileId_idx" ON "BodyMeasurement"("profileId")`,
  `CREATE INDEX IF NOT EXISTS "Meal_profileId_idx" ON "Meal"("profileId")`,
];

const addedColumns: Record<string, Array<{ name: string; definition: string }>> = {
  Profile: [
    { name: "heightInches", definition: "REAL" },
    { name: "weightLb", definition: "REAL" },
    { name: "age", definition: "INTEGER" },
    { name: "gender", definition: "TEXT" },
  ],
  UserSettings: [
    { name: "profileId", definition: "TEXT" },
    { name: "dailyVitaminAGoal", definition: "REAL NOT NULL DEFAULT 900" },
    { name: "dailyVitaminCGoal", definition: "REAL NOT NULL DEFAULT 90" },
    { name: "dailyVitaminDGoal", definition: "REAL NOT NULL DEFAULT 15" },
    { name: "dailyVitaminB12Goal", definition: "REAL NOT NULL DEFAULT 2.4" },
    { name: "dailyCalciumGoal", definition: "REAL NOT NULL DEFAULT 1000" },
    { name: "dailyIronGoal", definition: "REAL NOT NULL DEFAULT 8" },
    { name: "dailyMagnesiumGoal", definition: "REAL NOT NULL DEFAULT 400" },
    { name: "dailyPotassiumGoal", definition: "REAL NOT NULL DEFAULT 3400" },
    { name: "dailyZincGoal", definition: "REAL NOT NULL DEFAULT 11" },
    { name: "dailySodiumLimit", definition: "REAL NOT NULL DEFAULT 2300" },
    { name: "useRecommendedGoals", definition: "BOOLEAN NOT NULL DEFAULT true" },
  ],
  DailyLog: [{ name: "profileId", definition: "TEXT" }],
  TodoItem: [{ name: "profileId", definition: "TEXT" }],
  Workout: [
    { name: "profileId", definition: "TEXT" },
    { name: "duration", definition: "TEXT" },
    { name: "durationMinutes", definition: "INTEGER" },
    { name: "source", definition: "TEXT NOT NULL DEFAULT 'manual'" },
    { name: "externalId", definition: "TEXT" },
  ],
  ExerciseSet: [
    { name: "setType", definition: "TEXT NOT NULL DEFAULT 'WORKING'" },
    { name: "distance", definition: "REAL NOT NULL DEFAULT 0" },
    { name: "seconds", definition: "REAL NOT NULL DEFAULT 0" },
    { name: "rpe", definition: "REAL" },
    { name: "notes", definition: "TEXT" },
  ],
  BodyMeasurement: [{ name: "profileId", definition: "TEXT" }],
  Meal: [{ name: "profileId", definition: "TEXT" }],
};

async function main() {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  for (const [table, columns] of Object.entries(addedColumns)) {
    const existingColumns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `PRAGMA table_info("${table}")`,
    );
    const names = new Set(existingColumns.map((column) => column.name));

    for (const column of columns) {
      if (!names.has(column.name)) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${table}" ADD COLUMN "${column.name}" ${column.definition}`,
        );
      }
    }
  }

  for (const statement of indexStatements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
