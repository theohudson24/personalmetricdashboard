import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";
import { buildCronometerImportPlan, importCronometerBatch } from "@/lib/cronometerCsv";

const summaryHeader = "Date,Group,Energy (kcal),Protein (g),Carbs (g),Fat (g),Fiber (g),Sugars (g),Sodium (mg),Vitamin A (µg),Vitamin C (mg),Vitamin D (IU),B12 (Cobalamin) (µg),Calcium (mg),Iron (mg),Magnesium (mg),Potassium (mg),Zinc (mg)";

test("Cronometer daily totals are not doubled by group rows", () => {
  const dailySummary = `${summaryHeader}\n2026-07-20,Uncategorized,100,10,20,5,2,3,400,100,20,400,2,200,3,50,500,4\n2026-07-20,Total,100,10,20,5,2,3,400,100,20,400,2,200,3,50,500,4\n`;
  const plan = buildCronometerImportPlan({ dailySummary }).plans[0];
  assert.equal(plan.nutrition?.calories, 100);
  assert.equal(plan.nutrition?.protein, 10);
  assert.equal(plan.nutrition?.vitaminD, 10);
});

test("Cronometer servings and biometrics preserve entries and convert units", () => {
  const servings = "Day,Group,Food Name,Amount,Category\n2026-07-20,Breakfast,Eggs,2 large,Dairy\n2026-07-20,Breakfast,Toast,2 slices,Baked Products\n";
  const biometrics = "Day,Group,Metric,Unit,Amount\n2026-07-20,Uncategorized,Weight,kg,70\n2026-07-20,Uncategorized,Waist,cm,76.2\n";
  const plan = buildCronometerImportPlan({ servings, biometrics }).plans[0];
  assert.equal(plan.servingGroups[0].mealType, "BREAKFAST");
  assert.deepEqual(plan.servingGroups[0].items.map((item) => item.name), ["Eggs", "Toast"]);
  assert.ok(Math.abs((plan.measurements?.bodyWeight ?? 0) - 154.3236) < 0.01);
  assert.ok(Math.abs((plan.measurements?.waist ?? 0) - 30) < 0.001);
});

test("Cronometer imports process dates in bounded batches", async () => {
  const rows = Array.from({ length: 30 }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `2026-07-${day},Total,2000,150,200,70,30,40,2000,900,90,600,2.4,1000,8,400,3400,11`;
  });
  let mealCreates = 0;
  const transaction = {
    $executeRaw: async () => 1,
    meal: { findMany: async () => [], deleteMany: async () => undefined, create: async () => { mealCreates += 1; } },
    bodyMeasurement: { deleteMany: async () => undefined, create: async () => undefined, findFirst: async () => null },
    profile: { update: async () => undefined },
  };
  const prisma = {
    $transaction: async (callback: (client: typeof transaction) => Promise<void>) => callback(transaction),
  } as unknown as PrismaClient;
  const result = await importCronometerBatch(prisma, "profile-1", { dailySummary: `${summaryHeader}\n${rows.join("\n")}\n` }, 0, 14);
  assert.equal(result.added, 14);
  assert.equal(result.nextCursor, 14);
  assert.equal(result.totalRecords, 30);
  assert.equal(result.done, false);
  assert.equal(mealCreates, 14);
});

test("a biometrics-only update does not delete imported meals", async () => {
  let mealDeletes = 0;
  let bodyCreates = 0;
  let profileUpdates = 0;
  const transaction = {
    $executeRaw: async () => 1,
    meal: { findMany: async () => { throw new Error("meal lookup should not run"); }, deleteMany: async () => { mealDeletes += 1; }, create: async () => undefined },
    bodyMeasurement: { deleteMany: async () => undefined, create: async () => { bodyCreates += 1; }, findFirst: async () => null },
    profile: { update: async () => { profileUpdates += 1; } },
  };
  const prisma = {
    $transaction: async (callback: (client: typeof transaction) => Promise<void>) => callback(transaction),
  } as unknown as PrismaClient;
  const biometrics = "Day,Group,Metric,Unit,Amount\n2026-07-20,Uncategorized,Weight,lbs,175\n";
  const result = await importCronometerBatch(prisma, "profile-1", { biometrics }, 0);
  assert.equal(result.added, 1);
  assert.equal(mealDeletes, 0);
  assert.equal(bodyCreates, 1);
  assert.equal(profileUpdates, 1);
});

test("reimporting an unchanged Cronometer date is skipped", async () => {
  const storedMeals: Array<{ id: string; importFingerprint: string }> = [];
  const transaction = {
    $executeRaw: async () => 1,
    meal: {
      findMany: async () => storedMeals,
      deleteMany: async () => { storedMeals.length = 0; },
      create: async ({ data }: { data: { importFingerprint: string } }) => { storedMeals.push({ id: String(storedMeals.length + 1), importFingerprint: data.importFingerprint }); },
    },
    bodyMeasurement: { deleteMany: async () => undefined, create: async () => undefined, findFirst: async () => null },
    profile: { update: async () => undefined },
  };
  const prisma = { $transaction: async (callback: (client: typeof transaction) => Promise<unknown>) => callback(transaction) } as unknown as PrismaClient;
  const dailySummary = `${summaryHeader}\n2026-07-20,Total,2000,150,200,70,30,40,2000,900,90,600,2.4,1000,8,400,3400,11\n`;
  const first = await importCronometerBatch(prisma, "profile-1", { dailySummary }, 0);
  const second = await importCronometerBatch(prisma, "profile-1", { dailySummary }, 0);
  assert.equal(first.added, 1);
  assert.equal(second.skipped, 1);
  assert.equal(storedMeals.length, 1);
});

test("Cronometer files require recognized headers and safe cursors", async () => {
  assert.throws(() => buildCronometerImportPlan({ dailySummary: "name,value\na,b\n" }), /does not look/);
  const prisma = {} as PrismaClient;
  const servings = "Day,Group,Food Name,Amount\n2026-07-20,Dinner,Rice,1 cup\n";
  await assert.rejects(importCronometerBatch(prisma, "profile-1", { servings }, -1), /cursor/);
  await assert.rejects(importCronometerBatch(prisma, "profile-1", { servings }, 0, 26), /batch size/);
});
