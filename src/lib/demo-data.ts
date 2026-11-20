import type { DemoWorkspace, WorkspaceRole } from "@/lib/types";

export const demoWorkspaces: DemoWorkspace[] = [
  {
    id: "green-cross",
    name: "Green Cross Pharmacy",
    location: "Indiranagar, Bengaluru",
    role: "owner",
  },
  {
    id: "lakeview-medicals",
    name: "Lakeview Medicals",
    location: "Koramangala, Bengaluru",
    role: "pharmacist",
  },
  {
    id: "citycare-pharmacy",
    name: "CityCare Pharmacy",
    location: "Jayanagar, Bengaluru",
    role: "cashier",
  },
  {
    id: "wellness-plus",
    name: "Wellness Plus Chemists",
    location: "HSR Layout, Bengaluru",
    role: "admin",
  },
];

export const demoDashboard = {
  todaySalesPaise: 3_485_000,
  recentActivity: [
    {
      id: "activity-1",
      title: "Stock received",
      detail: "24 units · Paracetamol 500 mg",
      time: "10:42 am",
      icon: "inventory",
      tone: "healthy",
    },
    {
      id: "activity-2",
      title: "Sale recorded",
      detail: "Receipt MS-1042 · ₹1,240",
      time: "10:18 am",
      icon: "sales",
      tone: "neutral",
    },
    {
      id: "activity-3",
      title: "Expiry alert",
      detail: "Sample batches flagged for expiry review",
      time: "9:05 am",
      icon: "alert",
      tone: "low",
    },
  ],
} satisfies {
  todaySalesPaise: number;
  recentActivity: {
    id: string;
    title: string;
    detail: string;
    time: string;
    icon: "inventory" | "sales" | "alert";
    tone: string;
  }[];
};

export const roleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "cashier", label: "Cashier" },
];
