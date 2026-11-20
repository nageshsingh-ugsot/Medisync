"use client";

import { useState } from "react";
import {
  DemoEmptyState,
  DemoLoadingState,
  DemoModeNotice,
  DemoPageHeading,
} from "@/components/demo-workspace-ui";
import { formatINR, formatIndianDate } from "@/lib/format";
import { getExpiryStatus } from "@/lib/inventory";
import { demoInventoryBatches } from "@/lib/inventory-data";
import { useDemoWorkspace } from "@/lib/workspace-demo-context";
import {
  getDemoAvailableQuantity,
  getDemoProducts,
  getIndiaDateKey,
  offsetIndiaDate,
} from "@/lib/workspace-demo";

export function ReportsDemoPage() {
  const { data, pharmacyId, ready, todayISO } = useDemoWorkspace();
  const [exportMessage, setExportMessage] = useState("");

  if (!ready) return <DemoLoadingState />;

  const sales = data?.sales ?? [];
  const products = getDemoProducts(pharmacyId, todayISO);
  const last7Start = offsetIndiaDate(todayISO, 6);
  const last30Start = offsetIndiaDate(todayISO, 29);
  const inRange = (date: string, start: string) => date >= start && date <= todayISO;
  const last7Sales = sales.filter((sale) => inRange(getIndiaDateKey(sale.createdAt), last7Start));
  const last30Sales = sales.filter((sale) => inRange(getIndiaDateKey(sale.createdAt), last30Start));
  const todaySales = sales.filter((sale) => getIndiaDateKey(sale.createdAt) === todayISO);
  const revenue = (items: typeof sales) =>
    items.reduce((total, sale) => total + sale.totalPaise, 0);

  const medicineTotals = new Map<string, { quantity: number; revenuePaise: number }>();
  for (const sale of last30Sales) {
    for (const item of sale.items) {
      const current = medicineTotals.get(item.medicineName) ?? { quantity: 0, revenuePaise: 0 };
      current.quantity += item.quantity;
      current.revenuePaise += item.quantity * item.unitPricePaise;
      medicineTotals.set(item.medicineName, current);
    }
  }
  const topMedicines = [...medicineTotals.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5);

  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const date = offsetIndiaDate(todayISO, 6 - index);
    return {
      date,
      revenuePaise: revenue(last7Sales.filter((sale) => getIndiaDateKey(sale.createdAt) === date)),
    };
  });
  const maxDailyRevenue = Math.max(1, ...chartDays.map((day) => day.revenuePaise));
  const lowStock = products.filter(
    (product) =>
      getDemoAvailableQuantity(product, data) <=
      (data?.settings.lowStockDefault ?? product.reorderThreshold),
  );
  const productByInventoryId = new Map(products.map((product) => [product.id, product]));
  const expiringBatches = demoInventoryBatches
    .filter(
      (batch) =>
        batch.pharmacyId === pharmacyId &&
        batch.availableQuantity > 0 &&
        getExpiryStatus(batch.expiryDate, todayISO, 30) === "expiring-soon",
    )
    .flatMap((batch) => {
      const product = productByInventoryId.get(batch.pharmacyMedicineId);
      return product ? [{ batch, product }] : [];
    });

  function downloadCsv() {
    const header = ["date", "receipt", "customer", "items", "total_inr"];
    const rows = sales.map((sale) => [
      getIndiaDateKey(sale.createdAt),
      sale.receiptNumber,
      sale.customerName || "Walk-in customer",
      sale.items.map((item) => `${item.medicineName} x ${item.quantity}`).join("; "),
      (sale.totalPaise / 100).toFixed(2),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((field) => `"${field.replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "medisync-demo-sales.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setExportMessage("Sample sales CSV downloaded.");
  }

  if (!data || sales.length === 0) {
    return (
      <section className="workspace-section-page demo-page">
        <DemoPageHeading
          title="Reports"
          description="Explore sample revenue, medicine and stock summaries."
        />
        <DemoModeNotice />
        <DemoEmptyState
          description="Load sample receipts and customers to calculate real totals from the browser demo dataset."
          title="No demo data to report yet"
        />
      </section>
    );
  }

  return (
    <section className="workspace-section-page demo-page">
      <DemoPageHeading
        title="Reports"
        description="Live summaries calculated from this pharmacy's local demo records."
        action={
          <button className="button button-secondary" onClick={downloadCsv} type="button">
            Download sales CSV
          </button>
        }
      />
      <DemoModeNotice />
      {exportMessage && <p className="demo-success" role="status">{exportMessage}</p>}
      <div className="demo-metric-grid">
        <article className="metric-card">
          <p>Revenue today</p><strong className="metric-value">{formatINR(revenue(todaySales))}</strong>
          <span className="metric-note">{todaySales.length} sample sale(s)</span>
        </article>
        <article className="metric-card">
          <p>Sales today</p><strong className="metric-value">{todaySales.length}</strong>
          <span className="metric-note">India business date</span>
        </article>
        <article className="metric-card">
          <p>Revenue · 7 days</p><strong className="metric-value">{formatINR(revenue(last7Sales))}</strong>
          <span className="metric-note">Through {formatIndianDate(todayISO)}</span>
        </article>
        <article className="metric-card">
          <p>Revenue · 30 days</p><strong className="metric-value">{formatINR(revenue(last30Sales))}</strong>
          <span className="metric-note">{last30Sales.length} sample sale(s)</span>
        </article>
      </div>
      <div className="demo-report-grid">
        <section className="panel demo-panel">
          <div className="panel-heading">
            <div><h3>Revenue · last 7 days</h3><p>Calculated from sample receipts.</p></div>
          </div>
          <div aria-label="Seven-day revenue bar chart" className="demo-chart">
            {chartDays.map((day) => (
              <div className="demo-chart-column" key={day.date}>
                <strong>{day.revenuePaise ? formatINR(day.revenuePaise) : "—"}</strong>
                <div className="demo-chart-track">
                  <span style={{ height: `${Math.max(4, day.revenuePaise / maxDailyRevenue * 100)}%` }} />
                </div>
                <small>{formatIndianDate(day.date).replace(/\s+\d{4}$/, "")}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel demo-panel">
          <div className="panel-heading">
            <div><h3>Top medicines</h3><p>By units sold in the last 30 days.</p></div>
          </div>
          {topMedicines.length ? (
            <ol className="demo-ranked-list">
              {topMedicines.map((item, index) => (
                <li key={item.name}>
                  <span className="demo-rank">{index + 1}</span>
                  <span><strong>{item.name}</strong><small>{item.quantity} unit(s)</small></span>
                  <strong>{formatINR(item.revenuePaise)}</strong>
                </li>
              ))}
            </ol>
          ) : <p className="demo-muted">No sample medicine sales in this period.</p>}
        </section>
        <section className="panel demo-panel">
          <div className="panel-heading">
            <div><h3>Low stock</h3><p>Using the saved demo reorder level.</p></div>
          </div>
          {lowStock.length ? (
            <ul className="demo-alert-list">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <span><strong>{product.name}</strong><small>{product.strength}</small></span>
                  <span className="demo-stock-alert">{getDemoAvailableQuantity(product, data)} left</span>
                </li>
              ))}
            </ul>
          ) : <p className="demo-muted">No medicines are below the reorder level.</p>}
        </section>
        <section className="panel demo-panel">
          <div className="panel-heading">
            <div><h3>Expiring within 30 days</h3><p>Sample batches with stock remaining.</p></div>
          </div>
          {expiringBatches.length ? (
            <ul className="demo-alert-list">
              {expiringBatches.map(({ batch, product }) => (
                <li key={batch.id}>
                  <span><strong>{product.name}</strong><small>Batch {batch.batchNumber} · {batch.availableQuantity} unit(s)</small></span>
                  <span className="demo-stock-alert">{formatIndianDate(batch.expiryDate)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="demo-muted">No sample batches expire within 30 days.</p>}
        </section>
      </div>
    </section>
  );
}
