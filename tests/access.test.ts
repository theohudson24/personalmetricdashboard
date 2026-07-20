import assert from "node:assert/strict";
import test from "node:test";
import { emailSet, isEmailAllowed } from "@/lib/access";

test("email allowlists normalize case and whitespace", () => {
  assert.deepEqual([...emailSet(" Theo@Example.com, friend@example.com ")], ["theo@example.com", "friend@example.com"]);
  assert.equal(isEmailAllowed("THEO@example.com", "theo@example.com"), true);
});

test("empty allowlists deny access", () => {
  assert.equal(isEmailAllowed("person@example.com", ""), false);
  assert.equal(isEmailAllowed(undefined, "person@example.com"), false);
});
