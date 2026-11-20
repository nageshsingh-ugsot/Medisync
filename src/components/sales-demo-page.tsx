"use client";

import { useMemo, useState } from "react";
import {
  DemoEmptyState,
  DemoLoadingState,
  DemoModeNotice,
  DemoPageHeading,
  DemoReceipt,
} from "@/components/demo-workspace-ui";
import { formatINR, formatIndianDate } from "@/lib/format";
import { useDemoWorkspace } from "@/lib/workspace-demo-context";
import { getIndiaDateKey, type DemoSale } from "@/lib/workspace-demo";

const EMPTY_SALES: DemoSale[] = [];

export function SalesDemoPage() {
  const { data, ready, todayISO } = useDemoWorkspace();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedSale, setSelectedSale] = useState<DemoSale | null>(null);
  const sales = data?.sales ?? EMPTY_SALES;
  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        const date = getIndiaDateKey(sale.createdAt);
        const query = search.trim().toLocaleLowerCase("en-IN");
        const matchesSearch =
          !query ||
          sale.receiptNumber.toLocaleLowerCase("en-IN").includes(query) ||
          sale.customerName.toLocaleLowerCase("en-IN").includes(query);
        return (
          matchesSearch &&
          (!fromDate || date >= fromDate) &&
          (!toDate || date <= toDate)
        );
      }),
    [sales, search, fromDate, toDate],
  );
  const totalPaise = filteredSales.reduce((sum, sale) => sum + sale.totalPaise, 0);

  if (!ready) return <DemoLoadingState />;

  return (
    <section className="workspace-section-page demo-page">
      <DemoPageHeading
        title="Sales"
        description="Search sample receipts, filter by date and reprint a bill."
      />
      <DemoModeNotice />
      {!data || sales.length === 0 ? (
        <DemoEmptyState
          description="Load sample customers and receipts to explore search, date filters and reprinting."
          title="No demo sales yet"
        />
      ) : (
        <>
          <section className="panel demo-panel demo-sales-summary">
            <div>
              <span>Filtered sales</span>
              <strong>{filteredSales.length}</strong>
            </div>
            <div>
              <span>Filtered total</span>
              <strong>{formatINR(totalPaise)}</strong>
            </div>
            <p>Today in India: {formatIndianDate(todayISO)}</p>
          </section>
          <section className="panel demo-panel">
            <div className="demo-filter-row">
              <label className="demo-field">
                <span>Search receipt or customer</span>
                <input
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="RS-000001 or a customer name"
                  value={search}
                />
              </label>
              <label className="demo-field">
                <span>From</span>
                <input
                  max={toDate || undefined}
                  onChange={(event) => setFromDate(event.target.value)}
                  type="date"
                  value={fromDate}
                />
              </label>
              <label className="demo-field">
                <span>To</span>
                <input
                  min={fromDate || undefined}
                  onChange={(event) => setToDate(event.target.value)}
                  type="date"
                  value={toDate}
                />
              </label>
            </div>
            <div className="demo-table-wrap">
              <table className="demo-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Receipt</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{formatIndianDate(getIndiaDateKey(sale.createdAt))}</td>
                      <td><strong>{sale.receiptNumber}</strong></td>
                      <td>{sale.customerName || "Walk-in customer"}</td>
                      <td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                      <td>{formatINR(sale.totalPaise)}</td>
                      <td>
                        <button
                          className="button button-secondary demo-table-action"
                          onClick={() => setSelectedSale(sale)}
                          type="button"
                        >
                          Reprint
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td className="demo-no-results" colSpan={6}>
                        No receipts match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          {selectedSale && (
            <DemoReceipt
              settings={data.settings}
              sale={selectedSale}
            />
          )}
        </>
      )}
    </section>
  );
}
