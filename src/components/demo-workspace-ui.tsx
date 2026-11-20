"use client";

import type { ReactNode } from "react";
import { formatINR, formatIndianDate } from "@/lib/format";
import { useDemoWorkspace } from "@/lib/workspace-demo-context";
import type { DemoSale, DemoSettings } from "@/lib/workspace-demo";

export function DemoPageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading-row demo-page-heading">
      <div>
        <p className="eyebrow">PHARMACY WORKSPACE · DEMO</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function DemoModeNotice() {
  const { storageError } = useDemoWorkspace();
  return (
    <div className="demo-workspace-notice" role={storageError ? "alert" : "note"}>
      <strong>Browser-only demo</strong>
      <span>
        Sample records stay in this browser and are never sent to Supabase.
        No customer messaging is enabled for demo records.
      </span>
      {storageError && <span className="demo-storage-error">{storageError}</span>}
    </div>
  );
}

export function DemoEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { loadDemoData } = useDemoWorkspace();
  return (
    <section className="workspace-empty-state demo-empty-state">
      <span className="workspace-empty-icon" aria-hidden="true">D</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="button button-primary" onClick={loadDemoData} type="button">
        Load demo data
      </button>
    </section>
  );
}

export function DemoReceipt({
  sale,
  settings,
}: {
  sale: DemoSale;
  settings: DemoSettings;
}) {
  return (
    <section aria-label={`Receipt ${sale.receiptNumber}`} className="demo-receipt">
      <div className="demo-receipt-heading">
        <div>
          <p className="eyebrow">DEMO RECEIPT</p>
          <h3>{settings.pharmacyName}</h3>
          {settings.ownerName && <p>{settings.ownerName}</p>}
          {settings.area && <p>{settings.area}</p>}
          {settings.address && <p>{settings.address}</p>}
          {settings.whatsapp && <p>Phone: {settings.whatsapp}</p>}
          {settings.gstNumber && <p>GST: {settings.gstNumber}</p>}
        </div>
        <button
          className="button button-secondary demo-no-print"
          onClick={() => window.print()}
          type="button"
        >
          Print / Save PDF
        </button>
      </div>
      <div className="demo-receipt-meta">
        <span><strong>Receipt</strong> {sale.receiptNumber}</span>
        <span><strong>Date</strong> {formatIndianDate(sale.createdAt.slice(0, 10))}</span>
        {sale.customerName && <span><strong>Customer</strong> {sale.customerName}</span>}
      </div>
      <div className="demo-table-wrap">
        <table className="demo-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={`${sale.id}-${item.pharmacyMedicineId}`}>
                <td>{item.medicineName}</td>
                <td>{item.quantity}</td>
                <td>{formatINR(item.unitPricePaise)}</td>
                <td>{formatINR(item.unitPricePaise * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="demo-receipt-totals">
        <div><dt>Subtotal</dt><dd>{formatINR(sale.subtotalPaise)}</dd></div>
        <div><dt>Discount</dt><dd>−{formatINR(sale.discountPaise)}</dd></div>
        <div><dt>Tax</dt><dd>{formatINR(sale.taxPaise)}</dd></div>
        <div className="demo-receipt-total"><dt>Total</dt><dd>{formatINR(sale.totalPaise)}</dd></div>
      </dl>
      <p className="demo-receipt-footnote">
        Demonstration receipt only — not a tax invoice.
      </p>
    </section>
  );
}

export function DemoLoadingState() {
  return (
    <section className="workspace-section-page">
      <div className="route-loading" role="status" aria-live="polite">
        Loading your browser demo…
      </div>
    </section>
  );
}
