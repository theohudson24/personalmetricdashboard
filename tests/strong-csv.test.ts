import assert from "node:assert/strict";
import test from "node:test";
import { parseStrongCsv } from "@/lib/strongCsv";

test("valid Strong CSV data is parsed", () => {
  const rows = parseStrongCsv('Date,Workout Name,Exercise Name,Reps,Weight\n"2026-07-20 10:00:00","Push Day","Bench Press",8,135\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0]["Exercise Name"], "Bench Press");
});

test("non-Strong files are rejected", () => {
  assert.throws(() => parseStrongCsv("name,value\nexample,1\n"), /Strong CSV export/);
});
