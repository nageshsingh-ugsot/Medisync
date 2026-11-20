import assert from "node:assert/strict";
import test from "node:test";
import { navigationForRole } from "./navigation.ts";

test("cashier navigation is limited to sales workflows in the UI preview", () => {
  assert.deepEqual(
    navigationForRole("cashier").map((item) => item.id),
    ["dashboard", "billing", "sales", "customers"],
  );
});

test("owner navigation includes pharmacy settings", () => {
  assert.ok(navigationForRole("owner").some((item) => item.href === "/settings"));
});
