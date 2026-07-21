import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) => readFile(path, "utf8");

test("meal create, edit, delete, template reuse, and history reuse remain profile-scoped", async () => {
  const actions = await source("app/actions.ts");
  for (const action of ["createMeal", "updateMeal", "deleteMeal", "reuseMealTemplate", "reuseLoggedEntry"]) assert.match(actions, new RegExp(`export async function ${action}\\(`));
  assert.match(actions, /mealTemplate\.findFirst\(\{ where: \{ id, profileId: profile\.id \}/);
  assert.match(actions, /meal\.findFirst\(\{ where: \{ id, profileId: profile\.id \}/);
  assert.match(actions, /meal\.deleteMany\(\{ where: \{ id, profileId: profile\.id \}/);
  assert.match(actions, /meal\.updateMany\(\{ where: \{ id, profileId: profile\.id \}/);
});

test("authentication refresh, logout, and private routes use verified server sessions", async () => {
  const middleware = await source("middleware.ts");
  const auth = await source("lib/auth.ts");
  const login = await source("app/login/actions.ts");
  assert.match(middleware, /supabase\.auth\.getUser\(\)/);
  assert.match(middleware, /response\.cookies\.set/);
  assert.match(auth, /supabase\.auth\.getUser\(\)/);
  assert.match(login, /supabase\.auth\.signOut\(\)/);
  assert.match(login, /redirect\("\/login"\)/);
});

test("every admin mutation requires administrator authorization before database access", async () => {
  const blocks = (await source("app/admin/actions.ts")).split("export async function ").slice(1);
  assert.ok(blocks.length >= 3);
  for (const block of blocks) {
    const authorization = block.indexOf("await requireAdmin()");
    const database = block.indexOf("prisma.");
    assert.ok(authorization >= 0);
    assert.ok(database < 0 || authorization < database);
  }
});

test("data exports are private, non-cacheable, spreadsheet-safe, and omit auth secrets", async () => {
  const route = await source("app/api/account/export/route.ts");
  assert.match(route, /getDefaultProfile\(\)/);
  assert.match(route, /Cache-Control": "private, no-store"/);
  assert.match(route, /X-Content-Type-Options": "nosniff"/);
  assert.match(route, /\^\[=\+\\-@\]/);
  assert.doesNotMatch(route, /password|access_token|refresh_token|databaseUrl/i);
  for (const file of ["profile.csv", "meals.csv", "workouts.csv", "habits.csv", "bug-reports.csv"]) assert.ok(route.includes(`"${file}"`));
});

test("error telemetry validates bounded metadata and excludes sensitive payloads", async () => {
  const route = await source("app/api/errors/route.ts");
  assert.match(route, /eventSchema\.safeParse/);
  assert.match(route, /route: z\.string\(\)\.startsWith\("\/"\)\.max\(300\)/);
  assert.doesNotMatch(route, /stack|formData|password|email|phone|notes/);
  assert.match(route, /recorded: false/);
});
