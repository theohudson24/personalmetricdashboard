import assert from "node:assert/strict";
import test from "node:test";
import { completionPercent, countStatus, nutritionTargetProgress } from "@/lib/dashboard";

test("dashboard completion statuses distinguish empty, started, and complete states", () => {
  assert.equal(countStatus(0, 0), "not-started");
  assert.equal(countStatus(0, 0, "needs-attention"), "needs-attention");
  assert.equal(countStatus(0, 4), "not-started");
  assert.equal(countStatus(2, 4), "in-progress");
  assert.equal(countStatus(4, 4), "complete");
});

test("dashboard percentages remain bounded and tolerate missing totals", () => {
  assert.equal(completionPercent(2, 4), 50);
  assert.equal(completionPercent(1, 0), 0);
  assert.equal(completionPercent(10, 4), 100);
  assert.equal(nutritionTargetProgress(1000, 2000, 50, 100), 50);
  assert.equal(nutritionTargetProgress(4000, 2000, 200, 100), 100);
});
