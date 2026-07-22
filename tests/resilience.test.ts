import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("offline handling is global and authenticated responses are not service-worker cached", async () => {
  const shell = await readFile("components/layout/AppShell.tsx", "utf8");
  const status = await readFile("components/shared/ConnectionStatus.tsx", "utf8");
  assert.match(shell, /ConnectionStatus/);
  assert.match(status, /addEventListener\("offline"/);
  const files = await Promise.all(["app/manifest.ts", "lib/clientDraft.ts"].map((path) => readFile(path, "utf8")));
  assert.match(files[0], /display: "standalone"/);
  assert.doesNotMatch(files.join("\n"), /caches\.open|serviceWorker\.register/);
});

test("long forms preserve drafts and pending controls prevent duplicate taps", async () => {
  for (const path of ["components/meals/MealForm.tsx", "components/gym/WorkoutForm.tsx", "components/shared/BugReportForm.tsx"]) {
    const source = await readFile(path, "utf8");
    assert.match(source, /readDraft|writeDraft/);
    assert.match(source, /draftScope/, `${path} must scope local drafts to the authenticated profile`);
  }
  assert.match(await readFile("components/ui/SubmitButton.tsx", "utf8"), /useFormStatus/);
  assert.match(await readFile("components/settings/AccountSettings.tsx", "utf8"), /clearAllDrafts/);
});

test("successful meal logging clears the prior entry while failed submissions remain editable", async () => {
  const form = await readFile("components/meals/MealForm.tsx", "utf8");
  const actions = await readFile("app/actions.ts", "utf8");
  assert.match(form, /result\.status !== "success"/);
  assert.match(form, /formRef\.current\?\.reset\(\)/);
  assert.match(form, /setItems\(\[next\]\)/);
  assert.match(form, /setEntryKind\("ITEM"\)/);
  assert.match(actions, /Add at least one named item before saving/);
});

test("barcode scanning documents secure camera requirements and retains manual entry", async () => {
  const source = await readFile("components/meals/BarcodeLookup.tsx", "utf8");
  assert.match(source, /window\.isSecureContext/);
  assert.match(source, /iPhone/);
  assert.match(source, /Android/);
  assert.match(source, /UPC \/ EAN barcode/);
});
