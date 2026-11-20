import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInventorySummary,
  calculateAvailableQuantity,
  findExactMedicineMatch,
  getExpiryStatus,
  getStockStatus,
  parseINRToPaise,
  planFefoAllocation,
  searchMedicines,
  validateBatchDraft,
} from "./inventory.ts";
import type { InventoryBatch, Medicine } from "./types.ts";

const today = "2026-11-17";

const medicines: Medicine[] = [
  {
    id: "para-500",
    brandName: "Paracet",
    genericName: "Paracetamol",
    composition: "Paracetamol",
    strength: "500 mg",
    dosageForm: "tablet",
    packSize: "10 tablets",
    manufacturer: "Demo Healthcare",
    imageUrl: null,
  },
  {
    id: "para-650",
    brandName: "Paracet",
    genericName: "Paracetamol",
    composition: "Paracetamol",
    strength: "650 mg",
    dosageForm: "tablet",
    packSize: "10 tablets",
    manufacturer: "Demo Healthcare",
    imageUrl: null,
  },
];

const batches: InventoryBatch[] = [
  {
    id: "later",
    pharmacyId: "shop",
    pharmacyMedicineId: "item",
    batchNumber: "B-2",
    quantityReceived: 8,
    availableQuantity: 8,
    expiryDate: "2027-01-01",
    purchasePricePaise: 100,
    mrpPaise: null,
    receivedDate: "2026-10-01",
  },
  {
    id: "expired",
    pharmacyId: "shop",
    pharmacyMedicineId: "item",
    batchNumber: "B-0",
    quantityReceived: 30,
    availableQuantity: 30,
    expiryDate: "2026-11-16",
    purchasePricePaise: 100,
    mrpPaise: null,
    receivedDate: "2026-09-01",
  },
  {
    id: "first",
    pharmacyId: "shop",
    pharmacyMedicineId: "item",
    batchNumber: "B-1",
    quantityReceived: 4,
    availableQuantity: 4,
    expiryDate: "2026-12-01",
    purchasePricePaise: 100,
    mrpPaise: null,
    receivedDate: "2026-10-10",
  },
  {
    id: "empty",
    pharmacyId: "shop",
    pharmacyMedicineId: "item",
    batchNumber: "B-3",
    quantityReceived: 5,
    availableQuantity: 0,
    expiryDate: "2026-11-20",
    purchasePricePaise: 100,
    mrpPaise: null,
    receivedDate: "2026-11-01",
  },
  {
    id: "other-shop-batch",
    pharmacyId: "other-shop",
    pharmacyMedicineId: "other-item",
    batchNumber: "O-1",
    quantityReceived: 7,
    availableQuantity: 7,
    expiryDate: "2027-01-01",
    purchasePricePaise: 100,
    mrpPaise: null,
    receivedDate: "2026-10-01",
  },
];

test("searches partial brand, generic, and composition names", () => {
  assert.deepEqual(searchMedicines(medicines, "para").map(({ id }) => id), [
    "para-500",
    "para-650",
  ]);
  assert.deepEqual(searchMedicines(medicines, "PARACETAMOL 650").map(({ id }) => id), [
    "para-650",
  ]);
});

test("does not consider different strengths to be the same medicine", () => {
  assert.equal(findExactMedicineMatch(medicines[1], medicines.slice(0, 1)), undefined);
  assert.equal(findExactMedicineMatch(medicines[0], medicines.slice(1)), undefined);
});

test("derives stock status from sellable quantity and reorder threshold", () => {
  assert.equal(getStockStatus(0, 5), "out-of-stock");
  assert.equal(getStockStatus(5, 5), "low-stock");
  assert.equal(getStockStatus(6, 5), "in-stock");
});

test("calculates available quantity from unexpired batches only", () => {
  assert.equal(calculateAvailableQuantity("item", batches, today), 12);
});

test("keeps pharmacy medicine summaries scoped to the requested pharmacy", () => {
  const rows = buildInventorySummary(
    "other-shop",
    medicines.slice(0, 1),
    [
      {
        id: "item",
        pharmacyId: "shop",
        medicineId: "para-500",
        sku: "SHOP-1",
        sellingPricePaise: 100,
        reorderThreshold: 2,
      },
      {
        id: "other-item",
        pharmacyId: "other-shop",
        medicineId: "para-500",
        sku: "OTHER-1",
        sellingPricePaise: 200,
        reorderThreshold: 2,
      },
    ],
    batches,
    today,
  );
  assert.deepEqual(rows.map((row) => row.pharmacyMedicine.id), ["other-item"]);
  assert.equal(rows[0].availableQuantity, 7);
});

test("classifies expired and in-window expiry dates", () => {
  assert.equal(getExpiryStatus("2026-11-16", today), "expired");
  assert.equal(getExpiryStatus("2026-12-17", today), "expiring-soon");
  assert.equal(getExpiryStatus("2026-12-18", today), "within-date");
  assert.equal(getExpiryStatus("2026-12-18", today, 31), "expiring-soon");
  assert.equal(getExpiryStatus("2026-02-30", today), "invalid");
});

test("plans FEFO allocation without including expired or empty batches", () => {
  assert.deepEqual(planFefoAllocation("item", 10, batches, today), [
    { batchId: "first", quantity: 4 },
    { batchId: "later", quantity: 6 },
  ]);
  assert.equal(planFefoAllocation("item", 13, batches, today), null);
  assert.equal(batches[0].availableQuantity, 8);
});

test("rejects invalid batch fields and parses money directly into paise", () => {
  const invalid = validateBatchDraft({
    batchNumber: " ",
    quantityReceived: "1.5",
    expiryDate: "2026-02-30",
    purchasePrice: "-1",
    mrp: "12.345",
    receivedDate: "2026-11-17",
  });
  assert.equal(invalid.valid, false);
  if (!invalid.valid) {
    assert.ok(invalid.errors.batchNumber);
    assert.ok(invalid.errors.quantityReceived);
    assert.ok(invalid.errors.expiryDate);
    assert.ok(invalid.errors.purchasePrice);
    assert.ok(invalid.errors.mrp);
  }
  assert.equal(parseINRToPaise("12.5"), 1_250);
  assert.equal(parseINRToPaise("12.345"), null);
});
