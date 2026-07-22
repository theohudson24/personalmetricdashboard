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
  const initialization = source.slice(source.indexOf("export async function ensureDefaultData"), source.indexOf("export async function updateDailyLog"));
  assert.doesNotMatch(initialization, /todoItem\.(?:create|createMany|delete|deleteMany)/);
  assert.match(source, /export async function resetTodos/);
});
