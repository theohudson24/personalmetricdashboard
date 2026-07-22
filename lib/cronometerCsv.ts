import { createHash } from "node:crypto";
import type { MealType, PrismaClient } from "@prisma/client";
import { parseCsvRecords, type CsvRecord } from "@/lib/csv";

export type CronometerFiles = {
  dailySummary?: string;
  servings?: string;
  biometrics?: string;
};

type Nutrition = {
  calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number;
  vitaminA: number; vitaminC: number; vitaminD: number; vitaminB12: number; calcium: number; iron: number;
  magnesium: number; potassium: number; zinc: number;
};

type Serving = { name: string; amount: string; category: string };
type Measurements = { bodyWeight?: number; chest?: number; arms?: number; waist?: number; legs?: number };

export type CronometerDayPlan = {
  date: Date;
  dateKey: string;
  nutrition: Nutrition | null;
  nutritionFingerprint: string | null;
  servingGroups: Array<{ name: string; mealType: MealType; items: Serving[] }>;
  servingsFingerprint: string | null;
  measurements: Measurements | null;
  measurementsFingerprint: string | null;
};

export type CronometerImportBatch = {
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  rows: number;
  records: number;
  failures: string[];
  cursor: number;
  nextCursor: number;
  totalRecords: number;
  done: boolean;
};

const nutritionSource = "cronometer-nutrition";
const servingsSource = "cronometer-servings";
const biometricsSource = "cronometer-biometrics";
const maximumTextLength = 500;

export function buildCronometerImportPlan(files: CronometerFiles) {
  if (!files.dailySummary && !files.servings && !files.biometrics) throw new Error("Choose at least one Cronometer CSV export.");
  const summaryRows = files.dailySummary ? parseCsvRecords(files.dailySummary, ["Date", "Group", "Energy (kcal)"], "a Cronometer daily nutrition CSV") : [];
  const servingRows = files.servings ? parseCsvRecords(files.servings, ["Day", "Group", "Food Name", "Amount"], "a Cronometer servings CSV") : [];
  const biometricRows = files.biometrics ? parseCsvRecords(files.biometrics, ["Day", "Metric", "Unit", "Amount"], "a Cronometer biometrics CSV") : [];
  const dates = new Map<string, { summary: CsvRecord[]; servings: CsvRecord[]; biometrics: CsvRecord[] }>();
  const failures: string[] = [];

  function addRows(rows: CsvRecord[], dateColumn: "Date" | "Day", key: "summary" | "servings" | "biometrics") {
    rows.forEach((row, index) => {
      const date = validDateKey(row[dateColumn]);
      if (!date) {
        failures.push(`${key} row ${index + 2} has an invalid date.`);
        return;
      }
      const entry = dates.get(date) ?? { summary: [], servings: [], biometrics: [] };
      entry[key].push(row);
      dates.set(date, entry);
    });
  }

  addRows(summaryRows, "Date", "summary");
  addRows(servingRows, "Day", "servings");
  addRows(biometricRows, "Day", "biometrics");

  const plans = [...dates.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dateKey, rows]) => normalizeDay(dateKey, rows));
  if (!plans.length) throw new Error("No valid Cronometer records were found in these files.");
  return { plans, rows: summaryRows.length + servingRows.length + biometricRows.length, failures };
}

export async function importCronometerBatch(
  prisma: PrismaClient,
  profileId: string,
  files: CronometerFiles,
  cursor: number,
  batchSize = 14,
): Promise<CronometerImportBatch> {
  if (!Number.isSafeInteger(cursor) || cursor < 0) throw new Error("The import cursor is invalid.");
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 25) throw new Error("The import batch size is invalid.");
  const prepared = buildCronometerImportPlan(files);
  if (cursor > prepared.plans.length) throw new Error("The import cursor is outside these files.");
  const end = Math.min(cursor + batchSize, prepared.plans.length);
  const summary: CronometerImportBatch = {
    added: 0, updated: 0, skipped: 0, failed: cursor === 0 ? prepared.failures.length : 0,
    rows: prepared.rows, records: prepared.plans.length + prepared.failures.length,
    failures: cursor === 0 ? prepared.failures.slice(0, 10) : [], cursor, nextCursor: end,
    totalRecords: prepared.plans.length, done: end >= prepared.plans.length,
  };

  for (const plan of prepared.plans.slice(cursor, end)) {
    try {
      const result = await importDay(prisma, profileId, plan);
      summary[result] += 1;
    } catch {
      summary.failed += 1;
      if (summary.failures.length < 10) summary.failures.push(`${plan.dateKey} could not be imported.`);
    }
  }
  return summary;
}

function normalizeDay(dateKey: string, rows: { summary: CsvRecord[]; servings: CsvRecord[]; biometrics: CsvRecord[] }): CronometerDayPlan {
  const totalRow = rows.summary.find((row) => normalize(row.Group) === "total");
  const nutrition = rows.summary.length ? nutritionFromRows(totalRow ? [totalRow] : rows.summary) : null;
  const groupedServings = new Map<string, Serving[]>();
  for (const row of rows.servings) {
    const name = boundedText(row["Food Name"], "Food name");
    const group = boundedText(row.Group || "Uncategorized", "Serving group");
    const amount = boundedText(row.Amount || "1 serving", "Serving amount");
    const items = groupedServings.get(group) ?? [];
    if (items.length >= 500) throw new Error(`Too many servings were logged on ${dateKey}.`);
    items.push({ name, amount, category: boundedOptionalText(row.Category) });
    groupedServings.set(group, items);
  }
  const servingGroups = [...groupedServings.entries()].map(([name, items]) => ({ name, mealType: mealType(name), items }));
  const measurements = measurementsFromRows(rows.biometrics);
  return {
    dateKey,
    date: new Date(`${dateKey}T00:00:00.000Z`),
    nutrition,
    nutritionFingerprint: nutrition ? sha256(JSON.stringify(nutrition)) : null,
    servingGroups,
    servingsFingerprint: rows.servings.length ? sha256(JSON.stringify(servingGroups)) : null,
    measurements,
    measurementsFingerprint: measurements ? sha256(JSON.stringify(measurements)) : null,
  };
}

async function importDay(prisma: PrismaClient, profileId: string, plan: CronometerDayPlan): Promise<"added" | "updated" | "skipped"> {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${profileId}), hashtext(${plan.dateKey}))`;
    const [existingNutrition, existingServings, existingMeasurement] = await Promise.all([
      plan.nutritionFingerprint ? transaction.meal.findMany({ where: { profileId, date: plan.date, source: nutritionSource }, select: { id: true, importFingerprint: true } }) : Promise.resolve([]),
      plan.servingsFingerprint ? transaction.meal.findMany({ where: { profileId, date: plan.date, source: servingsSource }, select: { id: true, importFingerprint: true } }) : Promise.resolve([]),
      plan.measurementsFingerprint ? transaction.bodyMeasurement.findFirst({ where: { profileId, source: biometricsSource, externalId: plan.dateKey }, select: { id: true, importFingerprint: true } }) : Promise.resolve(null),
    ]);
    const nutritionCurrent = !plan.nutritionFingerprint || (existingNutrition.length === 1 && existingNutrition[0].importFingerprint === plan.nutritionFingerprint);
    const servingsCurrent = !plan.servingsFingerprint || (existingServings.length === plan.servingGroups.length && existingServings.every((meal) => meal.importFingerprint === plan.servingsFingerprint));
    const biometricsCurrent = !plan.measurementsFingerprint || existingMeasurement?.importFingerprint === plan.measurementsFingerprint;
    if (nutritionCurrent && servingsCurrent && biometricsCurrent) return "skipped";
    const existed = existingNutrition.length > 0 || existingServings.length > 0 || Boolean(existingMeasurement);

    if (plan.nutrition && plan.nutritionFingerprint && !nutritionCurrent) {
      await transaction.meal.deleteMany({ where: { profileId, date: plan.date, source: nutritionSource } });
      await transaction.meal.create({
        data: {
          profileId, date: plan.date, mealType: "SNACK", mealName: "Cronometer daily nutrition", entryKind: "IMPORT",
          notes: "Imported from Cronometer daily summary.", source: nutritionSource,
          externalId: `nutrition:${plan.dateKey}`, importFingerprint: plan.nutritionFingerprint,
          foodItems: { create: [{ name: "Cronometer daily total", servingSize: "Daily total", ...plan.nutrition }] },
        },
      });
    }
    if (plan.servingsFingerprint && !servingsCurrent) {
      await transaction.meal.deleteMany({ where: { profileId, date: plan.date, source: servingsSource } });
      for (const group of plan.servingGroups) {
        await transaction.meal.create({
          data: {
            profileId, date: plan.date, mealType: group.mealType, mealName: `Cronometer · ${group.name}`, entryKind: "IMPORT",
            notes: "Imported from Cronometer servings.", source: servingsSource,
            externalId: `servings:${plan.dateKey}:${sha256(normalize(group.name)).slice(0, 24)}`, importFingerprint: plan.servingsFingerprint,
            foodItems: { create: group.items.map((item) => ({ name: item.name, servingSize: item.category ? `${item.amount} · ${item.category}` : item.amount })) },
          },
        });
      }
    }
    if (plan.measurements && plan.measurementsFingerprint && !biometricsCurrent) {
      await transaction.bodyMeasurement.deleteMany({ where: { profileId, source: biometricsSource, externalId: plan.dateKey } });
      await transaction.bodyMeasurement.create({ data: {
        profileId, date: plan.date, notes: "Imported from Cronometer biometrics.", source: biometricsSource,
        externalId: plan.dateKey, importFingerprint: plan.measurementsFingerprint, ...plan.measurements,
      } });
      if (plan.measurements.bodyWeight !== undefined) {
        const newer = await transaction.bodyMeasurement.findFirst({ where: { profileId, bodyWeight: { not: null }, date: { gt: plan.date } }, select: { id: true } });
        if (!newer) await transaction.profile.update({ where: { id: profileId }, data: { weightLb: plan.measurements.bodyWeight } });
      }
    }
    return existed ? "updated" : "added";
  });
}

function nutritionFromRows(rows: CsvRecord[]): Nutrition {
  const sum = (header: string) => rows.reduce((total, row) => total + finiteNumber(row[header]), 0);
  return {
    calories: Math.round(sum("Energy (kcal)")), protein: sum("Protein (g)"), carbs: sum("Carbs (g)"), fat: sum("Fat (g)"),
    fiber: sum("Fiber (g)"), sugar: sum("Sugars (g)"), sodium: sum("Sodium (mg)"), vitaminA: sum("Vitamin A (µg)"),
    vitaminC: sum("Vitamin C (mg)"), vitaminD: sum("Vitamin D (IU)") / 40, vitaminB12: sum("B12 (Cobalamin) (µg)"),
    calcium: sum("Calcium (mg)"), iron: sum("Iron (mg)"), magnesium: sum("Magnesium (mg)"), potassium: sum("Potassium (mg)"), zinc: sum("Zinc (mg)"),
  };
}

function measurementsFromRows(rows: CsvRecord[]): Measurements | null {
  const values: Measurements = {};
  for (const row of rows) {
    const metric = normalize(row.Metric);
    const amount = finiteNumber(row.Amount, true);
    if (amount === null) continue;
    if (metric === "weight") values.bodyWeight = weightInPounds(amount, row.Unit);
    else if (metric === "chest") values.chest = lengthInInches(amount, row.Unit);
    else if (metric === "arms" || metric === "arm") values.arms = lengthInInches(amount, row.Unit);
    else if (metric === "waist") values.waist = lengthInInches(amount, row.Unit);
    else if (metric === "legs" || metric === "leg") values.legs = lengthInInches(amount, row.Unit);
  }
  return Object.keys(values).length ? values : null;
}

function weightInPounds(value: number, unit: string) { return normalize(unit).startsWith("kg") ? value * 2.2046226218 : value; }
function lengthInInches(value: number, unit: string) { return normalize(unit).startsWith("cm") ? value / 2.54 : value; }
function mealType(group: string): MealType {
  const value = normalize(group);
  if (value.includes("breakfast")) return "BREAKFAST";
  if (value.includes("lunch")) return "LUNCH";
  if (value.includes("dinner")) return "DINNER";
  if (value.includes("pre workout")) return "PRE_WORKOUT";
  if (value.includes("post workout")) return "POST_WORKOUT";
  return "SNACK";
}
function validDateKey(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) ? value : null; }
function finiteNumber(raw: string | undefined): number;
function finiteNumber(raw: string | undefined, nullable: true): number | null;
function finiteNumber(raw: string | undefined, nullable = false): number | null {
  if (!raw?.trim()) return nullable ? null : 0;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 10_000_000) throw new Error("Cronometer contains an invalid numeric value.");
  return value;
}
function boundedText(value: string, label: string) { const text = value.trim().replace(/\s+/g, " "); if (!text) throw new Error(`${label} is required.`); return text.slice(0, maximumTextLength); }
function boundedOptionalText(value?: string) { return (value || "").trim().replace(/\s+/g, " ").slice(0, maximumTextLength); }
function normalize(value: string) { return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " "); }
function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }
