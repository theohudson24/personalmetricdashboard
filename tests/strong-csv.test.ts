import assert from "node:assert/strict";
import test from "node:test";
import { buildStrongImportPlan, parseStrongCsv } from "@/lib/strongCsv";

test("valid Strong CSV data is parsed", () => {
  const rows = parseStrongCsv('Date,Workout Name,Exercise Name,Reps,Weight\n"2026-07-20 10:00:00","Push Day","Bench Press",8,135\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0]["Exercise Name"], "Bench Press");
});

test("quoted commas, escaped quotes, BOM, and CRLF are parsed", () => {
  const rows = parseStrongCsv('\uFEFFDate,Workout Name,Exercise Name,Notes\r\n"2026-07-20 10:00:00","Push, Pull","Cable Row","Said ""steady"""\r\n');
  assert.equal(rows[0]["Workout Name"], "Push, Pull");
  assert.equal(rows[0].Notes, 'Said "steady"');
});

test("Strong workouts receive stable identities and normalized set data", () => {
  const csv = "Date,Workout Name,Exercise Name,Set Order,Reps,Weight,Duration,RPE\n2026-07-20 10:00:00, Push Day ,Bench Press,W,10,45,1h 15m,6\n2026-07-20 10:00:00,Push Day,Bench Press,2,8,135,1h 15m,8.5\n";
  const first = buildStrongImportPlan(csv).plans[0];
  const second = buildStrongImportPlan(csv).plans[0];
  assert.equal(first.externalId, second.externalId);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.equal(first.durationMinutes, 75);
  assert.equal(first.exercises[0].sets[0].setType, "WARM_UP");
  assert.equal(first.exercises[0].sets[1].setNumber, 2);
});

test("missing required row values are reported without discarding valid workouts", () => {
  const result = buildStrongImportPlan("Date,Workout Name,Exercise Name,Reps,Weight\n2026-07-20 10:00:00,Push Day,Bench Press,8,135\n2026-07-21 10:00:00,,Squat,5,225\n");
  assert.equal(result.plans.length, 1);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /Row 3/);
});

test("invalid negative set values fail only their workout group", () => {
  const result = buildStrongImportPlan("Date,Workout Name,Exercise Name,Reps,Weight\n2026-07-20 10:00:00,Push Day,Bench Press,8,135\n2026-07-21 10:00:00,Leg Day,Squat,-5,225\n");
  assert.equal(result.plans.length, 1);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /Repetitions/);
});

test("non-Strong files are rejected", () => {
  assert.throws(() => parseStrongCsv("name,value\nexample,1\n"), /Strong CSV export/);
});

test("malformed quoted fields and duplicate headers are rejected", () => {
  assert.throws(() => parseStrongCsv('Date,Workout Name,Exercise Name\n"unfinished'), /unfinished quoted field/);
  assert.throws(() => parseStrongCsv("Date,Workout Name,Exercise Name,Date\n"), /duplicate column names/);
});
