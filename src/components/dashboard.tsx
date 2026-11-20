"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { demoDashboard } from "@/lib/demo-data";
import {
  buildInventorySummary,
  getExpiryStatus,
} from "@/lib/inventory";
import {
  DEMO_EXPIRY_WARNING_DAYS,
  DEMO_TODAY,
  demoInventoryBatches,
  demoMedicines,
  demoPharmacyMedicines,
} from "@/lib/inventory-data";
import { formatINR, formatIndianDate } from "@/lib/format";
import { useActivePharmacyId } from "@/lib/workspace-context";

export function Dashboard() {
  const pharmacyId = useActivePharmacyId();
  const inventory = buildInventorySummary(
    pharmacyId,
    demoMedicines,
    demoPharmacyMedicines,
    demoInventoryBatches,
    DEMO_TODAY,
    DEMO_EXPIRY_WARNING_DAYS,
  );
  const totalStockUnits = inventory.reduce(
    (total, item) => total + item.availableQuantity,
    0,
  );
  const lowStockMedicines = inventory.filter(
    (item) => item.stockStatus === "low-stock",
  ).length;
  const outOfStockMedicines = inventory.filter(
    (item) => item.stockStatus === "out-of-stock",
  ).length;
  const inventoryStatus = [
    {
      label: "Healthy stock",
      count: inventory.filter((item) => item.stockStatus === "in-stock").length,
      tone: "healthy",
    },
    { label: "Low stock", count: lowStockMedicines, tone: "low" },
    { label: "Out of stock", count: outOfStockMedicines, tone: "critical" },
  ];
  const expiringItems = demoInventoryBatches
    .filter(
      (batch) =>
        batch.pharmacyId === pharmacyId &&
        batch.availableQuantity > 0 &&
        getExpiryStatus(
          batch.expiryDate,
          DEMO_TODAY,
          DEMO_EXPIRY_WARNING_DAYS,
        ) === "expiring-soon",
    )
    .flatMap((batch) => {
      const medicine = demoMedicines.find(
        (item) =>
          item.id ===
          demoPharmacyMedicines.find(
            (pharmacyMedicine) =>
              pharmacyMedicine.id === batch.pharmacyMedicineId,
          )?.medicineId,
      );
      return medicine
        ? [{
            medicine: medicine.brandName,
            batch: batch.batchNumber,
            expiresOn: batch.expiryDate,
            units: batch.availableQuantity,
          }]
        : [];
    })
    .sort((left, right) => left.expiresOn.localeCompare(right.expiresOn));
  const expiringBatchCount = inventory.reduce(
    (total, item) => total + item.expiringSoon,
    0,
  );
  const totalMedicines = inventory.length;

  const metrics = [
    {
      label: "Total medicines",
      value: totalMedicines.toLocaleString("en-IN"),
      note: "In this pharmacy",
      icon: "medicines" as const,
      tone: "teal",
    },
    {
      label: "Total stock units",
      value: totalStockUnits.toLocaleString("en-IN"),
      note: "Available · excludes expired",
      icon: "inventory" as const,
      tone: "blue",
    },
    {
      label: "Low-stock medicines",
      value: lowStockMedicines.toString(),
      note: "At or below reorder level",
      icon: "alert" as const,
      tone: "amber",
    },
    {
      label: "Expiring batches",
      value: expiringBatchCount.toString(),
      note: `Within ${DEMO_EXPIRY_WARNING_DAYS} days`,
      icon: "calendar" as const,
      tone: "red",
    },
    {
      label: "Today’s sales",
      value: formatINR(demoDashboard.todaySalesPaise),
      note: "Asia/Kolkata",
      icon: "sales" as const,
      tone: "green",
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h2>Welcome, Arjun</h2>
          <p>Here’s what’s happening at your pharmacy today.</p>
        </div>
        <div className="dashboard-date">
          <Icon name="calendar" size={17} />
          <span>Today · Asia/Kolkata</span>
        </div>
      </section>

      <div className="demo-banner" role="note">
        <span className="demo-banner-icon"><Icon name="shield" size={18} /></span>
        <div>
          <strong>Demonstration data</strong>
          <p>These sample figures are for preview only. No live inventory, sales, or customer data is connected.</p>
        </div>
      </div>

      <section aria-label="Demonstration metrics" className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className={`metric-icon metric-icon-${metric.tone}`}>
              <Icon name={metric.icon} size={19} />
            </div>
            <p>{metric.label}</p>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-note">{metric.note}</span>
          </article>
        ))}
      </section>

      <div className="dashboard-grid">
        <section aria-labelledby="inventory-status-title" className="panel inventory-panel">
          <div className="panel-heading">
            <div>
              <h3 id="inventory-status-title">Inventory status</h3>
              <p>Current pharmacy batch totals</p>
            </div>
            <Link className="subtle-link" href="/inventory">View inventory</Link>
          </div>
          <div
            aria-label={`${inventoryStatus[0].count} healthy, ${lowStockMedicines} low-stock, ${outOfStockMedicines} out-of-stock medicines`}
            className="stock-meter"
            role="img"
          >
            {inventoryStatus.map((item) => (
              <span
                className={`stock-meter-${item.tone}`}
                key={item.tone}
                style={{
                  width: `${totalMedicines > 0 ? (item.count / totalMedicines) * 100 : 0}%`,
                }}
              />
            ))}
          </div>
          <div className="stock-legend">
            {inventoryStatus.map((item) => (
              <div className="stock-legend-item" key={item.tone}>
                <span className={`status-dot status-dot-${item.tone}`} />
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <div className="inventory-footnote">
            <Icon name="alert" size={16} />
            <span>{outOfStockMedicines} medicines currently have no available stock.</span>
          </div>
        </section>

        <section aria-labelledby="activity-title" className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h3 id="activity-title">Recent activity</h3>
              <p>Latest sample workspace updates</p>
            </div>
            <Icon className="panel-heading-icon" name="activity" size={19} />
          </div>
          {pharmacyId === "green-cross" ? (
            <ul className="activity-list">
              {demoDashboard.recentActivity.map((item) => (
              <li className="activity-item" key={item.id}>
                <span className={`activity-icon activity-icon-${item.tone}`}>
                  <Icon name={item.icon} size={17} />
                </span>
                <div className="activity-copy">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <time>{item.time}</time>
              </li>
              ))}
            </ul>
          ) : (
            <p className="inventory-empty-compact">
              No sample activity is available for this pharmacy.
            </p>
          )}
        </section>

        <section aria-labelledby="expiry-title" className="panel expiry-panel">
          <div className="panel-heading">
            <div>
              <h3 id="expiry-title">Expiring soon</h3>
              <p>Sample batches · {DEMO_EXPIRY_WARNING_DAYS}-day warning window</p>
            </div>
            <Link className="subtle-link" href="/inventory">Review batches</Link>
          </div>
          {expiringItems.length > 0 ? (
            <ul className="expiry-list">
              {expiringItems.map((item) => (
              <li className="expiry-item" key={item.batch}>
                <span className="medicine-avatar"><Icon name="medicines" size={18} /></span>
                <div className="expiry-medicine">
                  <strong>{item.medicine}</strong>
                  <span>Batch {item.batch} · {item.units} units</span>
                </div>
                <div className="expiry-date">
                  <span>Expires</span>
                  <strong>{formatIndianDate(item.expiresOn)}</strong>
                </div>
              </li>
              ))}
            </ul>
          ) : (
            <p className="inventory-empty-compact">No expiring demo batches.</p>
          )}
        </section>

        <section aria-labelledby="sales-summary-title" className="panel sales-panel">
          <div className="panel-heading">
            <div>
              <h3 id="sales-summary-title">Sales snapshot</h3>
              <p>Today · demonstration figures</p>
            </div>
            <span className="sales-icon"><Icon name="sales" size={19} /></span>
          </div>
          <strong className="sales-total">{formatINR(demoDashboard.todaySalesPaise)}</strong>
          <p className="sales-caption">Sample sales total for this workspace.</p>
          <Link className="button button-secondary" href="/sales">Explore sales history</Link>
        </section>
      </div>
    </div>
  );
}
