import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const serverActionFiles = [
  "app/actions.ts",
  "app/admin/actions.ts",
  "app/auth/reset/actions.ts",
  "app/habits/actions.ts",
  "app/login/actions.ts",
  "app/report-bug/actions.ts",
  "app/self-improvement/actions.ts",
  "app/settings/actions.ts",
  "app/settings/data-actions.ts",
  "app/settings/legal-actions.ts",
];

test("use-server modules export only async runtime functions", async () => {
  for (const path of serverActionFiles) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(source, /^export\s+(?:const|let|var|class|function)\s/m, path);
  }
});

test("dashboard initialization never recreates tasks after user deletion", async () => {
  const source = await readFile("app/actions.ts", "utf8");
  const profile = await readFile("lib/profile.ts", "utf8");
  assert.doesNotMatch(profile, /todoItem\.(?:create|createMany|delete|deleteMany)/);
  assert.match(profile, /settings: \{ create: \{\} \}/);
  const reset = source.slice(source.indexOf("export async function resetTodos"), source.indexOf("export async function createWorkout"));
  assert.match(reset, /todoItem\.deleteMany/);
  assert.doesNotMatch(reset, /todoItem\.createMany/);
});

test("normal page loads reuse profile reads and avoid initialization writes", async () => {
  const profile = await readFile("lib/profile.ts", "utf8");
  assert.match(profile, /cache\(async/);
  assert.match(profile, /profile\.findUnique/);
  assert.doesNotMatch(profile, /profile\.upsert/);
  for (const path of ["app/page.tsx", "app/gym/page.tsx", "app/meals/page.tsx", "app/settings/page.tsx"]) {
    assert.doesNotMatch(await readFile(path, "utf8"), /ensureDefaultData/);
  }
});

test("new accounts receive no automatic task or self-improvement checklist records", async () => {
  const actions = await readFile("app/actions.ts", "utf8");
  const page = await readFile("app/self-improvement/page.tsx", "utf8");
  assert.doesNotMatch(actions, /defaultTodos/);
  assert.doesNotMatch(page, /selfImprovementChecklistItem\.createMany/);
});
