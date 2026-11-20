export type WorkspaceRole = "owner" | "admin" | "pharmacist" | "cashier";

export type IconName =
  | "dashboard"
  | "inventory"
  | "medicines"
  | "billing"
  | "sales"
  | "customers"
  | "reports"
  | "settings"
  | "menu"
  | "chevron"
  | "activity"
  | "alert"
  | "calendar"
  | "clock"
  | "store"
  | "mail"
  | "phone"
  | "pin"
  | "shield"
  | "check"
  | "search"
  | "plus"
  | "arrowLeft"
  | "package";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: IconName;
};

export type DemoWorkspace = {
  id: string;
  name: string;
  location: string;
  role: WorkspaceRole;
};

export type DosageForm =
  | "tablet"
  | "capsule"
  | "syrup"
  | "powder"
  | "injection"
  | "cream"
  | "drops"
  | "inhaler";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";
export type ExpiryStatus = "expired" | "expiring-soon" | "within-date" | "invalid";

export type Medicine = {
  id: string;
  brandName: string;
  genericName: string;
  composition: string;
  strength: string;
  dosageForm: DosageForm;
  packSize: string;
  manufacturer: string;
  imageUrl: string | null;
};

export type PharmacyMedicine = {
  id: string;
  pharmacyId: string;
  medicineId: string;
  sku: string;
  sellingPricePaise: number;
  reorderThreshold: number;
};

export type InventoryBatch = {
  id: string;
  pharmacyId: string;
  pharmacyMedicineId: string;
  batchNumber: string;
  quantityReceived: number;
  availableQuantity: number;
  expiryDate: string;
  purchasePricePaise: number;
  mrpPaise: number | null;
  receivedDate: string;
};

export const roleLabels: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  pharmacist: "Pharmacist",
  cashier: "Cashier",
};
