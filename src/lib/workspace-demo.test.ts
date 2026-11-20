import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDemoTotals,
  createDemoWorkspaceData,
  getDemoAvailableQuantity,
  getDemoProducts,
  getIndiaDateKey,
  isDemoWorkspaceData,
} from "./workspace-demo.ts";

test("demo sales are scoped to a pharmacy and reduce only its browser stock", () => {
  const data = createDemoWorkspaceData(
    "green-cross",
    new Date("2026-11-20T08:00:00.000Z"),
  );
  const products = getDemoProducts("green-cross");
  const otherPharmacyProducts = getDemoProducts("citycare-pharmacy");

  assert.equal(data.customers.length, 3);
  assert.ok(data.customers.every((customer) => customer.isDemo));
  assert.ok(data.sales.length > 0);
  assert.ok(isDemoWorkspaceData(data));
  assert.equal(data.sales[0].receiptNumber, "RS-000001");
  assert.equal(
    getDemoAvailableQuantity(products[0], data),
    products[0].availableQuantity - 1,
  );
  assert.ok(
    otherPharmacyProducts.every(
      (product) => !products.some((sample) => sample.id === product.id),
    ),
  );
  for (const pharmacyId of [
    "green-cross",
    "lakeview-medicals",
    "citycare-pharmacy",
    "wellness-plus",
  ]) {
    const sample = createDemoWorkspaceData(
      pharmacyId,
      new Date("2026-11-20T08:00:00.000Z"),
    );
    assert.ok(Object.values(sample.inventoryQuantities).every((quantity) => quantity >= 0));
  }
});

test("demo totals apply discount before tax and cap discount at subtotal", () => {
  assert.deepEqual(calculateDemoTotals(10_000, 1_000, 5), {
    discountPaise: 1_000,
    taxPaise: 450,
    totalPaise: 9_450,
  });
  assert.deepEqual(calculateDemoTotals(10_000, 15_000, 5), {
    discountPaise: 10_000,
    taxPaise: 0,
    totalPaise: 0,
  });
});

test("demo report dates use the India business timezone", () => {
  assert.equal(getIndiaDateKey("2026-11-20T19:00:00.000Z"), "2026-11-21");
});
