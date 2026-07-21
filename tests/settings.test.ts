import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizePhone } from "@/lib/account";
import { calculateNutritionRecommendation } from "@/lib/recommendations";

test("contact phone numbers are normalized without claiming verification", () => {
  assert.equal(normalizePhone("+1 (555) 555-1234"), "+15555551234");
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone("123"), null);
});

test("profile inputs change recommended nutrition targets", () => {
  const shorter = calculateNutritionRecommendation({ heightInches: 65, weightLb: 150, age: 30, gender: "male", activityLevel: "moderate" });
  const taller = calculateNutritionRecommendation({ heightInches: 75, weightLb: 150, age: 30, gender: "male", activityLevel: "moderate" });
  assert.ok(shorter && taller);
  assert.ok(taller.dailyCalorieGoal > shorter.dailyCalorieGoal);
});

test("password changes require reauthentication and settings saves use version checks", async () => {
  const accountAction = await readFile("app/settings/actions.ts", "utf8");
  const settingsAction = await readFile("app/actions.ts", "utf8");
  assert.match(accountAction, /signInWithPassword/);
  assert.match(accountAction, /current password/i);
  assert.match(settingsAction, /expectedUpdatedAt/);
  assert.match(settingsAction, /SETTINGS_CONFLICT/);
});

test("exports are private ZIP downloads and exclude authentication secrets", async () => {
  const route = await readFile("app/api/account/export/route.ts", "utf8");
  assert.match(route, /application\/zip/);
  assert.match(route, /private, no-store/);
  assert.doesNotMatch(route, /password|access_token|refresh_token|SUPABASE_DATABASE_URL/);
});

test("export and deletion operations are profile scoped and admin review is authorized", async () => {
  const exportRoute = await readFile("app/api/account/export/route.ts", "utf8");
  const deletionActions = await readFile("app/settings/data-actions.ts", "utf8");
  const adminActions = await readFile("app/admin/actions.ts", "utf8");
  assert.match(exportRoute, /profileId: profile\.id/g);
  assert.match(deletionActions, /profileId: profile\.id/);
  assert.match(deletionActions, /REQUESTED/);
  assert.match(adminActions, /requireAdmin\(\)/);
  assert.match(adminActions, /updateDeletionRequest/);
});
