import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { goalPaceStatus, goalProgressPercent, uniqueSuccessfulHabitDays } from "@/lib/selfImprovement";

test("goal progress handles increasing and decreasing targets", () => {
  assert.equal(goalProgressPercent(0, 5, 10), 50);
  assert.equal(goalProgressPercent(200, 175, 150), 50);
  assert.equal(goalProgressPercent(0, 20, 10), 100);
  assert.equal(goalProgressPercent(10, 0, 20), 0);
});

test("goal pace distinguishes completed, on-track, and behind targets", () => {
  const createdAt = new Date("2026-07-01T00:00:00Z");
  const deadline = new Date("2026-07-11T00:00:00Z");
  const now = new Date("2026-07-06T00:00:00Z");
  assert.equal(goalPaceStatus({ progress: 100, createdAt, deadline, now }), "Completed");
  assert.equal(goalPaceStatus({ progress: 45, createdAt, deadline, now }), "On track");
  assert.equal(goalPaceStatus({ progress: 10, createdAt, deadline, now }), "Behind target");
});

test("linked habits count unique successful days without double counting", () => {
  const entries = [
    { date: new Date("2026-07-01T00:00:00Z"), status: "completed" },
    { date: new Date("2026-07-01T12:00:00Z"), status: "clean" },
    { date: new Date("2026-07-02T00:00:00Z"), status: "missed" },
  ];
  assert.equal(uniqueSuccessfulHabitDays(entries), 1);
});

test("self-improvement recommendations retain explicit health safeguards", async () => {
  const safety = await readFile("components/self-improvement/SafetyNotice.tsx", "utf8");
  const page = await readFile("app/self-improvement/page.tsx", "utf8");
  assert.match(safety, /not medical instructions/i);
  assert.match(safety, /does not diagnose/i);
  assert.match(safety, /qualified professional/i);
  assert.match(page, /not medical findings or guaranteed outcomes/i);
});
