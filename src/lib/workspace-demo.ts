import { demoWorkspaces } from "./demo-data.ts";
import { buildInventorySummary } from "./inventory.ts";
import {
  demoInventoryBatches,
  demoMedicines,
  demoPharmacyMedicines,
  DEMO_TODAY,
} from "./inventory-data.ts";

export type DemoRefill = {
  medicineName: string;
  dueDate: string;
  active: boolean;
};

export type DemoCustomer = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
  isDemo: true;
  refills: DemoRefill[];
};

export type DemoSaleItem = {
  pharmacyMedicineId: string;
  medicineName: string;
  quantity: number;
  unitPricePaise: number;
};

export type DemoSale = {
  id: string;
  receiptNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  items: DemoSaleItem[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
};

export type DemoSettings = {
  pharmacyName: string;
  ownerName: string;
  whatsapp: string;
  area: string;
  address: string;
  gstNumber: string;
  taxPercent: number;
  lowStockDefault: number;
};

export type DemoWorkspaceData = {
  version: 1;
  customers: DemoCustomer[];
  sales: DemoSale[];
  inventoryQuantities: Record<string, number>;
  settings: DemoSettings;
};

export type DemoProduct = {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  pricePaise: number;
  availableQuantity: number;
  reorderThreshold: number;
};

export function getDemoProducts(
  pharmacyId: string,
  today = DEMO_TODAY,
): DemoProduct[] {
  return buildInventorySummary(
    pharmacyId,
    demoMedicines,
    demoPharmacyMedicines,
    demoInventoryBatches,
    today,
  ).map(({ medicine, pharmacyMedicine, availableQuantity }) => ({
    id: pharmacyMedicine.id,
    name: medicine.brandName,
    genericName: medicine.genericName,
    strength: medicine.strength,
    pricePaise: pharmacyMedicine.sellingPricePaise,
    availableQuantity,
    reorderThreshold: pharmacyMedicine.reorderThreshold,
  }));
}

export function getDemoAvailableQuantity(
  product: DemoProduct,
  data: DemoWorkspaceData | null,
): number {
  return data?.inventoryQuantities[product.id] ?? product.availableQuantity;
}

export function createEmptyDemoWorkspaceData(
  pharmacyId: string,
): DemoWorkspaceData {
  const workspace = demoWorkspaces.find((item) => item.id === pharmacyId);
  return {
    version: 1,
    customers: [],
    sales: [],
    inventoryQuantities: {},
    settings: {
      pharmacyName: workspace?.name ?? "Demo Pharmacy",
      ownerName: "",
      whatsapp: "",
      area: workspace?.location ?? "",
      address: "",
      gstNumber: "",
      taxPercent: 5,
      lowStockDefault: 10,
    },
  };
}

function indiaDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getIndiaDateKey(timestamp: string): string {
  return indiaDate(new Date(timestamp));
}

export function offsetIndiaDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

export function createDemoWorkspaceData(
  pharmacyId: string,
  now: Date,
): DemoWorkspaceData {
  const data = createEmptyDemoWorkspaceData(pharmacyId);
  const today = indiaDate(now);
  const products = getDemoProducts(pharmacyId, today).filter(
    (product) => product.availableQuantity > 0,
  );
  const names = [
    { name: "Aarav Sharma", phone: "9000000101" },
    { name: "Meera Nair", phone: "9000000102" },
    { name: "Kabir Patel", phone: "9000000103" },
  ];

  data.customers = names.map((customer, index) => ({
    id: `demo-customer-${pharmacyId}-${index + 1}`,
    ...customer,
    notes: "Sample customer record for demonstration.",
    createdAt: `${offsetIndiaDate(today, 30 - index * 6)}T12:00:00+05:30`,
    isDemo: true,
    refills:
      index === 0 && products[0]
        ? [{
            medicineName: products[0].name,
            dueDate: offsetIndiaDate(today, -7),
            active: true,
          }]
        : [],
  }));

  const startingStock = Object.fromEntries(
    products.map((product) => [product.id, product.availableQuantity]),
  );
  const saleDays = [0, 2, 9];

  data.sales = [];
  names.forEach((customer, index) => {
    const candidates = products.map(
      (_, offset) => products[(index + offset) % products.length],
    );
    const product = candidates.find(
      (candidate) => candidate && startingStock[candidate.id] > 0,
    );
    if (!product) return;
    const quantity = 1;
    const subtotalPaise = product.pricePaise * quantity;
    const taxPaise = Math.round(subtotalPaise * data.settings.taxPercent / 100);
    startingStock[product.id] -= quantity;
    data.sales.push({
      id: `demo-sale-${pharmacyId}-${index + 1}`,
      receiptNumber: `RS-${String(data.sales.length + 1).padStart(6, "0")}`,
      customerId: data.customers[index].id,
      customerName: customer.name,
      customerPhone: customer.phone,
      createdAt: `${offsetIndiaDate(today, saleDays[index])}T12:00:00+05:30`,
      items: [{
        pharmacyMedicineId: product.id,
        medicineName: product.name,
        quantity,
        unitPricePaise: product.pricePaise,
      }],
      subtotalPaise,
      discountPaise: 0,
      taxPaise,
      totalPaise: subtotalPaise + taxPaise,
    });
  });
  data.inventoryQuantities = startingStock;
  return data;
}

export function calculateDemoTotals(
  subtotalPaise: number,
  discountPaise: number,
  taxPercent: number,
): { discountPaise: number; taxPaise: number; totalPaise: number } {
  const discount = Math.min(Math.max(0, Math.round(discountPaise)), subtotalPaise);
  const taxable = subtotalPaise - discount;
  const taxPaise = Math.round(taxable * Math.max(0, taxPercent) / 100);
  return {
    discountPaise: discount,
    taxPaise,
    totalPaise: taxable + taxPaise,
  };
}

export function isDemoWorkspaceData(value: unknown): value is DemoWorkspaceData {
  if (!isRecord(value)) return false;
  const settings = value.settings;
  const quantities = value.inventoryQuantities;
  return (
    value.version === 1 &&
    Array.isArray(value.customers) &&
    value.customers.every(isDemoCustomer) &&
    Array.isArray(value.sales) &&
    value.sales.every(isDemoSale) &&
    isRecord(quantities) &&
    Object.values(quantities).every(
      (quantity) => Number.isSafeInteger(quantity) && Number(quantity) >= 0,
    ) &&
    isRecord(settings) &&
    typeof settings.pharmacyName === "string" &&
    typeof settings.ownerName === "string" &&
    typeof settings.whatsapp === "string" &&
    typeof settings.area === "string" &&
    typeof settings.address === "string" &&
    typeof settings.gstNumber === "string" &&
    typeof settings.taxPercent === "number" &&
    Number.isFinite(settings.taxPercent) &&
    Number(settings.taxPercent) >= 0 &&
    Number(settings.taxPercent) <= 100 &&
    Number.isSafeInteger(settings.lowStockDefault) &&
    Number(settings.lowStockDefault) >= 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isDemoCustomer(value: unknown): value is DemoCustomer {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.phone === "string" &&
    typeof value.notes === "string" &&
    typeof value.createdAt === "string" &&
    value.isDemo === true &&
    Array.isArray(value.refills) &&
    value.refills.every(
      (refill) =>
        isRecord(refill) &&
        typeof refill.medicineName === "string" &&
        typeof refill.dueDate === "string" &&
        typeof refill.active === "boolean",
    )
  );
}

function isDemoSaleItem(value: unknown): value is DemoSaleItem {
  return (
    isRecord(value) &&
    typeof value.pharmacyMedicineId === "string" &&
    typeof value.medicineName === "string" &&
    Number.isSafeInteger(value.quantity) &&
    Number(value.quantity) > 0 &&
    Number.isSafeInteger(value.unitPricePaise) &&
    Number(value.unitPricePaise) >= 0
  );
}

function isDemoSale(value: unknown): value is DemoSale {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.receiptNumber === "string" &&
    (typeof value.customerId === "string" || value.customerId === null) &&
    typeof value.customerName === "string" &&
    typeof value.customerPhone === "string" &&
    typeof value.createdAt === "string" &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(isDemoSaleItem) &&
    ["subtotalPaise", "discountPaise", "taxPaise", "totalPaise"].every(
      (key) =>
        Number.isSafeInteger(value[key]) &&
        Number(value[key]) >= 0,
    )
  );
}
