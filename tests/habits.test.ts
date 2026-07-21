import assert from "node:assert/strict";
import test from "node:test";
import { habitCompletionRate, habitConsistency, habitCurrentStreak, isSuccessfulHabitStatus } from "@/lib/habits";

const asOf = new Date("2026-07-21T18:00:00.000Z");

test("habit history classifies successful outcomes", () => {
  assert.equal(isSuccessfulHabitStatus("completed"), true);
  assert.equal(isSuccessfulHabitStatus("clean"), true);
  assert.equal(isSuccessfulHabitStatus("partial"), false);
  assert.equal(isSuccessfulHabitStatus("relapse"), false);
});

test("habit streak stops at the first missing or unsuccessful day", () => {
  assert.equal(habitCurrentStreak([
    { date: "2026-07-21", status: "completed" },
    { date: "2026-07-20", status: "clean" },
    { date: "2026-07-19", status: "missed" },
    { date: "2026-07-18", status: "completed" },
  ], asOf), 2);
});

test("habit completion rate and weekly consistency are deterministic", () => {
  const entries = [
    { date: "2026-07-21", status: "completed" as const },
    { date: "2026-07-20", status: "partial" as const },
    { date: "2026-07-19", status: "clean" as const },
  ];
  assert.equal(habitCompletionRate(entries), 67);
  assert.equal(habitConsistency(entries, asOf, 7), 29);
  assert.equal(habitCompletionRate([]), 0);
});
