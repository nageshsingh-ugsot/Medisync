import type { ExpiryStatus, StockStatus } from "@/lib/types";

const stockLabels: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

const expiryLabels: Record<ExpiryStatus, string> = {
  expired: "Expired",
  "expiring-soon": "Expiring soon",
  "within-date": "Within date",
  invalid: "Invalid date",
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={`stock-status stock-status-${status}`}>
      {stockLabels[status]}
    </span>
  );
}

export function ExpiryStatusBadge({ status }: { status: ExpiryStatus }) {
  return (
    <span className={`expiry-status expiry-status-${status}`}>
      {expiryLabels[status]}
    </span>
  );
}
