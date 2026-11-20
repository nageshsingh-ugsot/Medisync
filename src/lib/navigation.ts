import type { NavigationItem, WorkspaceRole } from "./types";

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: "dashboard" },
  { id: "inventory", label: "Inventory", href: "/inventory", icon: "inventory" },
  { id: "medicines", label: "Medicines", href: "/medicines", icon: "medicines" },
  { id: "billing", label: "Billing", href: "/billing", icon: "billing" },
  { id: "sales", label: "Sales", href: "/sales", icon: "sales" },
  { id: "customers", label: "Customers", href: "/customers", icon: "customers" },
  { id: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { id: "settings", label: "Settings", href: "/settings", icon: "settings" },
];

const roleNavigation: Record<WorkspaceRole, string[]> = {
  owner: navigationItems.map((item) => item.id),
  admin: navigationItems.map((item) => item.id),
  pharmacist: [
    "dashboard",
    "inventory",
    "medicines",
    "billing",
    "sales",
    "customers",
    "reports",
  ],
  cashier: ["dashboard", "billing", "sales", "customers"],
};

export function navigationForRole(role: WorkspaceRole): NavigationItem[] {
  const allowedItems = roleNavigation[role];
  return navigationItems.filter((item) => allowedItems.includes(item.id));
}
