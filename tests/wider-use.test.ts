import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

const source = (path: string) => readFile(path, "utf8");

test("legal content and acceptance records are explicitly versioned", async () => {
  assert.match(PRIVACY_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(TERMS_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  const schema = await source("prisma/schema.prisma");
  assert.match(schema, /model LegalAcceptance/);
  assert.match(schema, /@@unique\(\[profileId, termsVersion, privacyVersion\]\)/);
});

test("password recovery is allowlisted, generic, and establishes a verified recovery session", async () => {
  const actions = await source("app/auth/reset/actions.ts");
  const confirmation = await source("app/auth/confirm/route.ts");
  assert.match(actions, /isEmailAllowed/);
  assert.match(actions, /If that approved account exists/);
  assert.match(actions, /resetPasswordForEmail/);
  assert.match(confirmation, /verifyOtp/);
  assert.match(confirmation, /reset-password/);
});

test("expensive and authentication-sensitive operations use shared database rate limits", async () => {
  for (const path of ["app/login/actions.ts", "app/api/foods/search/route.ts", "app/api/foods/barcode/route.ts", "app/report-bug/actions.ts"]) assert.match(await source(path), /consumeRateLimit/);
  assert.match(await source("lib/rateLimit.ts"), /prisma\.rateLimitBucket\.upsert/);
});

test("performance telemetry is sampled, bounded, profile-scoped, and payload-limited", async () => {
  const client = await source("components/shared/WebVitalsReporter.tsx");
  const route = await source("app/api/performance/route.ts");
  assert.match(client, /Math\.random\(\) > 0\.25/);
  assert.match(route, /getDefaultProfile\(\)/);
  assert.match(route, /schema\.safeParse/);
  assert.doesNotMatch(route, /email|phone|notes|password|stack|formData/i);
});

test("all private API routes use an authenticated user or profile boundary", async () => {
  const routes = ["app/api/account/export/route.ts", "app/api/daily-log/route.ts", "app/api/errors/route.ts", "app/api/foods/barcode/route.ts", "app/api/foods/search/route.ts", "app/api/meals/route.ts", "app/api/performance/route.ts", "app/api/settings/route.ts", "app/api/todos/route.ts", "app/api/workouts/route.ts"];
  for (const path of routes) assert.match(await source(path), /getDefaultProfile\(\)|requireUser\(\)/, path);
});
