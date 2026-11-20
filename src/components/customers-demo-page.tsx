"use client";

import { useState, type FormEvent } from "react";
import {
  DemoEmptyState,
  DemoLoadingState,
  DemoModeNotice,
  DemoPageHeading,
} from "@/components/demo-workspace-ui";
import { formatINR, formatIndianDate } from "@/lib/format";
import { useDemoWorkspace } from "@/lib/workspace-demo-context";
import { getIndiaDateKey, type DemoCustomer } from "@/lib/workspace-demo";

const blankForm = { name: "", phone: "", notes: "" };

export function CustomersDemoPage() {
  const { data, ready, updateData } = useDemoWorkspace();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  if (!ready) return <DemoLoadingState />;

  const customers = data?.customers ?? [];
  const query = search.trim().toLocaleLowerCase("en-IN");
  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.phone} ${customer.notes}`
      .toLocaleLowerCase("en-IN")
      .includes(query),
  );
  const selectedCustomer =
    customers.find((customer) => customer.id === selectedId) ??
    filteredCustomers[0] ??
    null;
  const purchaseHistory = selectedCustomer
    ? (data?.sales ?? []).filter(
        (sale) =>
          sale.customerId === selectedCustomer.id ||
          (!!selectedCustomer.phone && sale.customerPhone === selectedCustomer.phone),
      )
    : [];

  function beginAdd() {
    setForm(blankForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
  }

  function beginEdit(customer: DemoCustomer) {
    setForm({
      name: customer.name,
      phone: customer.phone,
      notes: customer.notes,
    });
    setEditingId(customer.id);
    setShowForm(true);
    setError("");
  }

  function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name) {
      setError("Enter the customer name.");
      return;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      setError("Enter a 10-digit sample phone number or leave it blank.");
      return;
    }
    const duplicate = customers.find(
      (customer) => customer.phone && customer.phone === phone && customer.id !== editingId,
    );
    if (duplicate) {
      setError("A demo customer with this phone number already exists.");
      return;
    }
    const existing = editingId
      ? customers.find((customer) => customer.id === editingId)
      : undefined;
    if (editingId && !existing) {
      setError("This demo customer could not be found. Reload the page and try again.");
      return;
    }

    const customer: DemoCustomer = existing
      ? {
          ...existing,
          name,
          phone,
          notes: form.notes.trim(),
        }
      : {
          id: `demo-customer-${crypto.randomUUID()}`,
          name,
          phone,
          notes: form.notes.trim(),
          createdAt: new Date().toISOString(),
          isDemo: true,
          refills: [],
        };
    updateData((current) => ({
      ...current,
      customers: editingId
        ? current.customers.map((item) => item.id === editingId ? customer : item)
        : [customer, ...current.customers],
    }));
    setSelectedId(customer.id);
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  return (
    <section className="workspace-section-page demo-page">
      <DemoPageHeading
        title="Customers"
        description="Manage sample customer records, purchases and refill reminders."
        action={
          data?.customers.length ? (
            <button className="button button-primary" onClick={beginAdd} type="button">
              Add demo customer
            </button>
          ) : undefined
        }
      />
      <DemoModeNotice />
      {!data || customers.length === 0 ? (
        <DemoEmptyState
          description="Load sample customers and purchase history, or create a customer after loading the demo workspace."
          title="No demo customers yet"
        />
      ) : (
        <div className="demo-customer-layout">
          <section className="panel demo-panel demo-customer-list">
            <div className="panel-heading">
              <div><h3>Customer list</h3><p>{customers.length} browser-only records</p></div>
            </div>
            <label className="demo-field">
              <span>Search customers</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, phone or notes"
                value={search}
              />
            </label>
            <div className="demo-customer-items">
              {filteredCustomers.map((customer) => (
                <button
                  aria-pressed={selectedCustomer?.id === customer.id}
                  className={`demo-customer-item ${selectedCustomer?.id === customer.id ? "demo-customer-item-active" : ""}`}
                  key={customer.id}
                  onClick={() => setSelectedId(customer.id)}
                  type="button"
                >
                  <span className="demo-customer-avatar">{customer.name.charAt(0).toUpperCase()}</span>
                  <span><strong>{customer.name}</strong><small>{customer.phone || "No phone number"}</small></span>
                  <span className="demo-record-badge">DEMO</span>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="demo-muted demo-no-results">No customers match your search.</p>
              )}
            </div>
          </section>
          <section className="panel demo-panel demo-customer-detail">
            {showForm ? (
              <>
                <div className="panel-heading">
                  <div>
                    <h3>{editingId ? "Edit demo customer" : "Add demo customer"}</h3>
                    <p>These details are stored only in this browser.</p>
                  </div>
                </div>
                <form className="demo-form-stack" onSubmit={saveCustomer}>
                  <label className="demo-field">
                    <span>Name</span>
                    <input
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      required
                      value={form.name}
                    />
                  </label>
                  <label className="demo-field">
                    <span>Phone <small>Optional</small></span>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "") }))}
                      value={form.phone}
                    />
                  </label>
                  <label className="demo-field">
                    <span>Notes</span>
                    <textarea
                      onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                      rows={3}
                      value={form.notes}
                    />
                  </label>
                  {error && <p className="demo-inline-error" role="alert">{error}</p>}
                  <div className="demo-review-actions">
                    <button className="button button-secondary" onClick={() => setShowForm(false)} type="button">
                      Cancel
                    </button>
                    <button className="button button-primary" type="submit">Save demo customer</button>
                  </div>
                </form>
              </>
            ) : selectedCustomer ? (
              <>
                <div className="panel-heading">
                  <div>
                    <span className="demo-record-badge">DEMO CUSTOMER</span>
                    <h3 className="demo-detail-title">{selectedCustomer.name}</h3>
                    <p>{selectedCustomer.phone || "No phone number saved"}</p>
                  </div>
                  <button className="button button-secondary" onClick={() => beginEdit(selectedCustomer)} type="button">
                    Edit
                  </button>
                </div>
                {selectedCustomer.notes && <p className="demo-customer-notes">{selectedCustomer.notes}</p>}
                <div className="demo-detail-section">
                  <h4>Purchase history</h4>
                  {purchaseHistory.length ? (
                    <div className="demo-table-wrap">
                      <table className="demo-table">
                        <thead><tr><th>Date</th><th>Receipt</th><th>Total</th></tr></thead>
                        <tbody>
                          {purchaseHistory.map((sale) => (
                            <tr key={sale.id}>
                              <td>{formatIndianDate(getIndiaDateKey(sale.createdAt))}</td>
                              <td>{sale.receiptNumber}</td>
                              <td>{formatINR(sale.totalPaise)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="demo-muted">No sample purchases for this customer yet.</p>}
                </div>
                <div className="demo-detail-section">
                  <h4>Active refill reminders</h4>
                  {selectedCustomer.refills.filter((refill) => refill.active).length ? (
                    <ul className="demo-refill-list">
                      {selectedCustomer.refills.filter((refill) => refill.active).map((refill) => (
                        <li key={`${refill.medicineName}-${refill.dueDate}`}>
                          <span><strong>{refill.medicineName}</strong><small>Reminder due {formatIndianDate(refill.dueDate)}</small></span>
                          <span className="demo-record-badge">DEMO ONLY</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="demo-muted">No active sample reminders.</p>}
                  <p className="demo-muted">WhatsApp messaging is disabled for all sample customers.</p>
                </div>
              </>
            ) : (
              <p className="demo-muted">Select a customer to see their details.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
