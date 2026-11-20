import type {
  ExpiryStatus,
  InventoryBatch,
  Medicine,
  PharmacyMedicine,
  StockStatus,
} from "@/lib/types";

export const EXPIRY_WARNING_DAYS = 30;

export type BatchDraft = {
  batchNumber: string;
  quantityReceived: string;
  expiryDate: string;
  purchasePrice: string;
  mrp: string;
  receivedDate: string;
};

export type BatchDraftError = Partial<Record<keyof BatchDraft, string>>;
export type ParsedBatchDraft = Omit<
  InventoryBatch,
  "id" | "pharmacyId" | "pharmacyMedicineId"
>;

export type BatchDraftResult =
  | { valid: true; batch: ParsedBatchDraft }
  | { valid: false; errors: BatchDraftError };

export type InventorySummaryRow = {
  pharmacyMedicine: PharmacyMedicine;
  medicine: Medicine;
  availableQuantity: number;
  activeBatches: number;
  nearestExpiry: string | null;
  nearestExpiryStatus: ExpiryStatus | null;
  expiringSoon: number;
  expired: number;
  stockStatus: StockStatus;
};

function dayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`) / 86_400_000;
}

export function isValidISODate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getExpiryStatus(
  expiryDate: string,
  today: string,
  warningDays = EXPIRY_WARNING_DAYS,
): ExpiryStatus {
  if (!isValidISODate(expiryDate) || !isValidISODate(today)) return "invalid";
  if (expiryDate < today) return "expired";
  return dayNumber(expiryDate) - dayNumber(today) <= warningDays
    ? "expiring-soon"
    : "within-date";
}

export function parseINRToPaise(value: string): number | null {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const rupees = Number(match[1]);
  const paise = Number((match[2] ?? "").padEnd(2, "0"));
  const totalPaise = rupees * 100 + paise;
  return Number.isSafeInteger(totalPaise) ? totalPaise : null;
}

export function validateBatchDraft(draft: BatchDraft): BatchDraftResult {
  const errors: BatchDraftError = {};
  const quantity = /^\d+$/.test(draft.quantityReceived)
    ? Number(draft.quantityReceived)
    : Number.NaN;
  const purchasePricePaise = parseINRToPaise(draft.purchasePrice);
  const mrpPaise = draft.mrp.trim() === "" ? null : parseINRToPaise(draft.mrp);

  if (!draft.batchNumber.trim()) errors.batchNumber = "Enter a batch number.";
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    errors.quantityReceived = "Quantity must be a positive whole number.";
  }
  if (purchasePricePaise === null) {
    errors.purchasePrice = "Enter a non-negative INR amount with up to 2 decimals.";
  }
  if (draft.mrp.trim() !== "" && mrpPaise === null) {
    errors.mrp = "Enter a non-negative INR amount with up to 2 decimals.";
  }
  if (!isValidISODate(draft.expiryDate)) {
    errors.expiryDate = "Enter a valid expiry date.";
  }
  if (!isValidISODate(draft.receivedDate)) {
    errors.receivedDate = "Enter a valid received date.";
  }

  if (
    Object.keys(errors).length > 0 ||
    purchasePricePaise === null ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    batch: {
      batchNumber: draft.batchNumber.trim(),
      quantityReceived: quantity,
      availableQuantity: quantity,
      expiryDate: draft.expiryDate,
      purchasePricePaise,
      mrpPaise,
      receivedDate: draft.receivedDate,
    },
  };
}

export function searchMedicines(medicines: Medicine[], query: string): Medicine[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("en-IN");
  if (!normalizedQuery) return medicines;

  return medicines.filter((medicine) =>
    [
      medicine.brandName,
      medicine.genericName,
      medicine.composition,
      medicine.strength,
    ]
      .join(" ")
      .toLocaleLowerCase("en-IN")
      .includes(normalizedQuery),
  );
}

function normalizeIdentity(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");
}

export function findExactMedicineMatch(
  candidate: Medicine,
  medicines: Medicine[],
): Medicine | undefined {
  return medicines.find(
    (medicine) =>
      normalizeIdentity(medicine.composition) ===
        normalizeIdentity(candidate.composition) &&
      normalizeIdentity(medicine.strength) ===
        normalizeIdentity(candidate.strength) &&
      medicine.dosageForm === candidate.dosageForm &&
      normalizeIdentity(medicine.packSize) === normalizeIdentity(candidate.packSize),
  );
}

export function calculateAvailableQuantity(
  pharmacyMedicineId: string,
  batches: InventoryBatch[],
  today: string,
): number {
  return batches
    .filter(
      (batch) =>
        batch.pharmacyMedicineId === pharmacyMedicineId &&
        batch.availableQuantity > 0 &&
        getExpiryStatus(batch.expiryDate, today) !== "expired" &&
        getExpiryStatus(batch.expiryDate, today) !== "invalid",
    )
    .reduce((total, batch) => total + batch.availableQuantity, 0);
}

export function countActiveBatches(
  pharmacyMedicineId: string,
  batches: InventoryBatch[],
  today: string,
): number {
  return batches.filter(
    (batch) =>
      batch.pharmacyMedicineId === pharmacyMedicineId &&
      batch.availableQuantity > 0 &&
      getExpiryStatus(batch.expiryDate, today) !== "expired" &&
      getExpiryStatus(batch.expiryDate, today) !== "invalid",
  ).length;
}

export function getStockStatus(
  availableQuantity: number,
  reorderThreshold: number,
): StockStatus {
  if (availableQuantity <= 0) return "out-of-stock";
  return availableQuantity <= reorderThreshold ? "low-stock" : "in-stock";
}

export function buildInventorySummary(
  pharmacyId: string,
  medicines: Medicine[],
  pharmacyMedicines: PharmacyMedicine[],
  batches: InventoryBatch[],
  today: string,
  warningDays = EXPIRY_WARNING_DAYS,
): InventorySummaryRow[] {
  return pharmacyMedicines.flatMap((pharmacyMedicine) => {
    if (pharmacyMedicine.pharmacyId !== pharmacyId) return [];
    const medicine = medicines.find(
      (item) => item.id === pharmacyMedicine.medicineId,
    );
    if (!medicine) return [];

    const nearestExpiry = getNearestExpiryDate(pharmacyMedicine.id, batches);
    const expiryCounts = getExpiryCounts(
      pharmacyMedicine.id,
      batches,
      today,
      warningDays,
    );
    const availableQuantity = calculateAvailableQuantity(
      pharmacyMedicine.id,
      batches,
      today,
    );

    return [{
      pharmacyMedicine,
      medicine,
      availableQuantity,
      activeBatches: countActiveBatches(pharmacyMedicine.id, batches, today),
      nearestExpiry,
      nearestExpiryStatus: nearestExpiry
        ? getExpiryStatus(nearestExpiry, today, warningDays)
        : null,
      expiringSoon: expiryCounts.expiringSoon,
      expired: expiryCounts.expired,
      stockStatus: getStockStatus(
        availableQuantity,
        pharmacyMedicine.reorderThreshold,
      ),
    }];
  });
}

export function getNearestExpiryDate(
  pharmacyMedicineId: string,
  batches: InventoryBatch[],
): string | null {
  return (
    batches
      .filter(
        (batch) =>
          batch.pharmacyMedicineId === pharmacyMedicineId &&
          batch.availableQuantity > 0 &&
          isValidISODate(batch.expiryDate),
      )
      .sort((left, right) => left.expiryDate.localeCompare(right.expiryDate))[0]
      ?.expiryDate ?? null
  );
}

export function getExpiryCounts(
  pharmacyMedicineId: string,
  batches: InventoryBatch[],
  today: string,
  warningDays = EXPIRY_WARNING_DAYS,
): { expiringSoon: number; expired: number } {
  return batches
    .filter(
      (batch) =>
        batch.pharmacyMedicineId === pharmacyMedicineId &&
        batch.availableQuantity > 0,
    )
    .reduce(
      (counts, batch) => {
        const status = getExpiryStatus(batch.expiryDate, today, warningDays);
        if (status === "expiring-soon") counts.expiringSoon += 1;
        if (status === "expired") counts.expired += 1;
        return counts;
      },
      { expiringSoon: 0, expired: 0 },
    );
}

export function planFefoAllocation(
  pharmacyMedicineId: string,
  requestedQuantity: number,
  batches: InventoryBatch[],
  today: string,
): { batchId: string; quantity: number }[] | null {
  if (!Number.isSafeInteger(requestedQuantity) || requestedQuantity <= 0) {
    throw new RangeError("Requested quantity must be a positive whole number.");
  }
  if (!isValidISODate(today)) {
    throw new RangeError("The allocation date must be a valid ISO date.");
  }

  const eligible = batches
    .filter(
      (batch) =>
        batch.pharmacyMedicineId === pharmacyMedicineId &&
        batch.availableQuantity > 0 &&
        isValidISODate(batch.expiryDate) &&
        batch.expiryDate >= today,
    )
    .sort(
      (left, right) =>
        left.expiryDate.localeCompare(right.expiryDate) ||
        left.receivedDate.localeCompare(right.receivedDate) ||
        left.batchNumber.localeCompare(right.batchNumber),
    );

  if (
    eligible.reduce((total, batch) => total + batch.availableQuantity, 0) <
    requestedQuantity
  ) {
    return null;
  }

  let remaining = requestedQuantity;
  const allocation: { batchId: string; quantity: number }[] = [];

  for (const batch of eligible) {
    const quantity = Math.min(remaining, batch.availableQuantity);
    allocation.push({ batchId: batch.id, quantity });
    remaining -= quantity;
    if (remaining === 0) break;
  }

  return allocation;
}
