import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const privateRoutes = ["app/api/daily-log/route.ts", "app/api/meals/route.ts", "app/api/settings/route.ts", "app/api/todos/route.ts", "app/api/workouts/route.ts", "app/api/foods/barcode/route.ts", "app/api/foods/search/route.ts"];

test("private data APIs resolve the authenticated profile", async () => {
  for (const route of privateRoutes) {
    const source = await readFile(route, "utf8");
    assert.match(source, /getDefaultProfile\(\)/, `${route} must scope data through the authenticated profile`);
  }
});

test("meal mutations include profile ownership filters", async () => {
  const source = await readFile("lib/mealService.ts", "utf8");
  assert.match(source, /id: mealId, profileId/);
  assert.match(source, /id: templateId, profileId/);
  assert.match(source, /profileId_clientRequestId/);
});
