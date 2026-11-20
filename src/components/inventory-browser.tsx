"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { MedicineImage } from "@/components/medicine-image";
import { ExpiryStatusBadge, StockStatusBadge } from "@/components/stock-status-badge";
import {
  buildInventorySummary,
  searchMedicines,
} from "@/lib/inventory";
import {
  DEMO_EXPIRY_WARNING_DAYS,
  DEMO_TODAY,
  demoInventoryBatches,
  demoMedicines,
  demoPharmacyMedicines,
} from "@/lib/inventory-data";
import { formatINR, formatIndianDate } from "@/lib/format";
import type { DosageForm, StockStatus } from "@/lib/types";
import { useActivePharmacyId } from "@/lib/workspace-context";

type ExpiryFilter = "all" | "expiring" | "expired" | "clear";
type InventorySort = "name" | "quantity" | "expiry";

const dosageForms: { value: DosageForm; label: string }[] = [
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "syrup", label: "Syrup" },
  { value: "powder", label: "Powder" },
  { value: "injection", label: "Injection" },
  { value: "cream", label: "Cream" },
  { value: "drops", label: "Drops" },
  { value: "inhaler", label: "Inhaler" },
];

function ExpiryDisplay({ row }: { row: ReturnType<typeof buildInventorySummary>[number] }) {
  if (!row.nearestExpiry || !row.nearestExpiryStatus) {
    return <span className="table-muted">No active batch</span>;
  }
  return (
    <span className="inventory-expiry-display">
      <strong>{formatIndianDate(row.nearestExpiry)}</strong>
      <ExpiryStatusBadge status={row.nearestExpiryStatus} />
    </span>
  );
}

function InventoryMedicineCard({
  row,
}: {
  row: ReturnType<typeof buildInventorySummary>[number];
}) {
  return (
    <article className="inventory-mobile-card">
      <div className="inventory-card-heading">
        <MedicineImage medicine={row.medicine} size="small" />
        <div className="inventory-card-title">
          <Link href={`/inventory/${row.pharmacyMedicine.id}`}>
            {row.medicine.brandName}
          </Link>
          <span>{row.medicine.genericName} · {row.medicine.strength}</span>
        </div>
        <StockStatusBadge status={row.stockStatus} />
      </div>
      <div className="inventory-card-data">
        <div><span>Available</span><strong>{row.availableQuantity} units</strong></div>
        <div><span>Active batches</span><strong>{row.activeBatches}</strong></div>
        <div><span>Nearest expiry</span><ExpiryDisplay row={row} /></div>
        <div><span>Form / pack</span><strong>{row.medicine.dosageForm} · {row.medicine.packSize}</strong></div>
      </div>
      {(row.expiringSoon > 0 || row.expired > 0) && (
        <div className="inventory-card-alerts">
          {row.expiringSoon > 0 && <span className="expiry-status expiry-status-expiring-soon">{row.expiringSoon} expiring soon</span>}
          {row.expired > 0 && <span className="expiry-status expiry-status-expired">{row.expired} expired</span>}
        </div>
      )}
      <Link className="inventory-card-link" href={`/inventory/${row.pharmacyMedicine.id}`}>
        View batch details <Icon name="arrowLeft" size={15} />
      </Link>
    </article>
  );
}

export function InventoryBrowser() {
  const pharmacyId = useActivePharmacyId();
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | StockStatus>("all");
  const [formFilter, setFormFilter] = useState<"all" | DosageForm>("all");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");
  const [sort, setSort] = useState<InventorySort>("name");

  const rows = useMemo(
    () => buildInventorySummary(
      pharmacyId,
      demoMedicines,
      demoPharmacyMedicines,
      demoInventoryBatches,
      DEMO_TODAY,
      DEMO_EXPIRY_WARNING_DAYS,
    ),
    [pharmacyId],
  );

  const visibleRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (searchMedicines([row.medicine], query).length === 0) return false;
      if (stockFilter !== "all" && row.stockStatus !== stockFilter) return false;
      if (formFilter !== "all" && row.medicine.dosageForm !== formFilter) return false;
      if (expiryFilter === "expiring" && row.expiringSoon === 0) return false;
      if (expiryFilter === "expired" && row.expired === 0) return false;
      if (
        expiryFilter === "clear" &&
        (row.expiringSoon > 0 || row.expired > 0)
      ) {
        return false;
      }
      return true;
    });

    return filtered.sort((left, right) => {
      if (sort === "quantity") {
        return right.availableQuantity - left.availableQuantity;
      }
      if (sort === "expiry") {
        return (
          (left.nearestExpiry ?? "9999-12-31").localeCompare(
            right.nearestExpiry ?? "9999-12-31",
          ) || left.medicine.brandName.localeCompare(right.medicine.brandName)
        );
      }
      return left.medicine.brandName.localeCompare(right.medicine.brandName);
    });
  }, [rows, query, stockFilter, formFilter, expiryFilter, sort]);

  const expiringItems = rows.reduce((total, row) => total + row.expiringSoon, 0);
  const expiredItems = rows.reduce((total, row) => total + row.expired, 0);
  const hasFilters =
    query !== "" ||
    stockFilter !== "all" ||
    formFilter !== "all" ||
    expiryFilter !== "all";

  return (
    <section className="inventory-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">STOCK MANAGEMENT</p>
          <h2>Inventory</h2>
          <p>Batch-backed quantities for this pharmacy workspace.</p>
        </div>
        <Link className="button button-primary" href="/inventory/add">
          <Icon name="plus" size={17} /> Add stock
        </Link>
      </div>

      <div className="inventory-demo-note" role="note">
        <span className="demo-badge">Demo snapshot · {formatIndianDate(DEMO_TODAY)}</span>
        <span>Available units exclude expired batches. No changes are saved.</span>
      </div>

      <div className="inventory-alert-summary">
        <div className="inventory-alert-pill inventory-alert-expiring">
          <Icon name="clock" size={17} />
          <strong>{expiringItems}</strong>
          <span>batches expiring in {DEMO_EXPIRY_WARNING_DAYS} days</span>
        </div>
        <div className="inventory-alert-pill inventory-alert-expired">
          <Icon name="alert" size={17} />
          <strong>{expiredItems}</strong>
          <span>expired batches with stock</span>
        </div>
      </div>

      <div className="inventory-controls">
        <label className="inventory-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search medicines</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, brand, generic or composition"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span className="sr-only">Filter by stock status</span>
          <select
            onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)}
            value={stockFilter}
          >
            <option value="all">All stock</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by dosage form</span>
          <select
            onChange={(event) => setFormFilter(event.target.value as typeof formFilter)}
            value={formFilter}
          >
            <option value="all">All forms</option>
            {dosageForms.map((form) => (
              <option key={form.value} value={form.value}>{form.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by expiry</span>
          <select
            onChange={(event) => setExpiryFilter(event.target.value as ExpiryFilter)}
            value={expiryFilter}
          >
            <option value="all">All expiry</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired stock</option>
            <option value="clear">No expiry alerts</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort inventory</span>
          <select
            onChange={(event) => setSort(event.target.value as InventorySort)}
            value={sort}
          >
            <option value="name">Sort: Name</option>
            <option value="quantity">Sort: Quantity</option>
            <option value="expiry">Sort: Nearest expiry</option>
          </select>
        </label>
        {hasFilters && (
          <button
            className="button button-quiet inventory-clear"
            onClick={() => {
              setQuery("");
              setStockFilter("all");
              setFormFilter("all");
              setExpiryFilter("all");
            }}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="inventory-result-count" aria-live="polite">
        {visibleRows.length} of {rows.length} medicines
      </p>

      {visibleRows.length === 0 ? (
        <div className="inventory-empty">
          <span className="placeholder-icon"><Icon name="inventory" size={24} /></span>
          <h3>{rows.length === 0 ? "No demo stock in this pharmacy" : "No medicines match"}</h3>
          <p>
            {rows.length === 0
              ? "This workspace has no sample inventory yet."
              : "Try another search or clear one or more filters."}
          </p>
          {rows.length > 0 && hasFilters && (
            <button
              className="button button-secondary"
              onClick={() => {
                setQuery("");
                setStockFilter("all");
                setFormFilter("all");
                setExpiryFilter("all");
              }}
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th scope="col">Medicine</th>
                  <th scope="col">Available</th>
                  <th scope="col">Active batches</th>
                  <th scope="col">Nearest expiry</th>
                  <th scope="col">Stock status</th>
                  <th scope="col">Retail / pack</th>
                  <th scope="col"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.pharmacyMedicine.id}>
                    <td>
                      <div className="inventory-medicine-cell">
                        <MedicineImage medicine={row.medicine} size="small" />
                        <span>
                          <Link href={`/inventory/${row.pharmacyMedicine.id}`}>{row.medicine.brandName}</Link>
                          <small>{row.medicine.genericName} · {row.medicine.strength} {row.medicine.dosageForm}</small>
                        </span>
                      </div>
                    </td>
                    <td><strong className="quantity-cell">{row.availableQuantity}</strong> units</td>
                    <td>{row.activeBatches}</td>
                    <td><ExpiryDisplay row={row} /></td>
                    <td><StockStatusBadge status={row.stockStatus} /></td>
                    <td>{formatINR(row.pharmacyMedicine.sellingPricePaise)}</td>
                    <td>
                      <Link
                        aria-label={`View ${row.medicine.brandName} batch details`}
                        className="table-detail-link"
                        href={`/inventory/${row.pharmacyMedicine.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="inventory-mobile-list">
            {visibleRows.map((row) => (
              <InventoryMedicineCard key={row.pharmacyMedicine.id} row={row} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
