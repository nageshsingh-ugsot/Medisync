"use client";

import { useMemo, useState } from "react";
import {
  DemoModeNotice,
  DemoPageHeading,
  DemoReceipt,
  DemoLoadingState,
} from "@/components/demo-workspace-ui";
import { formatINR } from "@/lib/format";
import { parseINRToPaise } from "@/lib/inventory";
import { useDemoWorkspace } from "@/lib/workspace-demo-context";
import {
  calculateDemoTotals,
  createEmptyDemoWorkspaceData,
  getDemoAvailableQuantity,
  getDemoProducts,
  type DemoCustomer,
  type DemoSale,
} from "@/lib/workspace-demo";

export function BillingDemoPage() {
  const {
    data,
    loadDemoData,
    pharmacyId,
    ready,
    todayISO,
    updateData,
  } = useDemoWorkspace();
  const products = useMemo(
    () => getDemoProducts(pharmacyId, todayISO || undefined),
    [pharmacyId, todayISO],
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [receipt, setReceipt] = useState<DemoSale | null>(null);
  const [error, setError] = useState("");

  if (!ready) return <DemoLoadingState />;

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.genericName} ${product.strength}`
      .toLocaleLowerCase("en-IN")
      .includes(search.trim().toLocaleLowerCase("en-IN")),
  );
  const activeProductId = filteredProducts.some(
    (product) => product.id === selectedProductId,
  )
    ? selectedProductId
    : filteredProducts[0]?.id ?? "";
  const items = Object.entries(cart).flatMap(([id, quantity]) => {
    const product = products.find((candidate) => candidate.id === id);
    return product ? [{ product, quantity }] : [];
  });
  const subtotalPaise = items.reduce(
    (total, item) => total + item.product.pricePaise * item.quantity,
    0,
  );
  const discountPaise = parseINRToPaise(discountInput) ?? 0;
  const totals = calculateDemoTotals(
    subtotalPaise,
    discountPaise,
    data?.settings.taxPercent ?? 5,
  );

  function addProduct() {
    const product = filteredProducts.find(
      (candidate) => candidate.id === activeProductId,
    );
    if (!product) {
      setError("There are no in-stock sample medicines for this workspace.");
      return;
    }
    const currentQuantity = cart[product.id] ?? 0;
    const available = getDemoAvailableQuantity(product, data);
    if (currentQuantity >= available) {
      setError(`Only ${available} unit(s) are available for ${product.name}.`);
      return;
    }
    setError("");
    setCart((current) => ({ ...current, [product.id]: currentQuantity + 1 }));
  }

  function changeQuantity(productId: string, quantity: number) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) return;
    if (quantity <= 0) {
      setCart((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      return;
    }
    if (quantity > getDemoAvailableQuantity(product, data)) {
      setError(
        `Only ${getDemoAvailableQuantity(product, data)} unit(s) are available for ${product.name}.`,
      );
      return;
    }
    setError("");
    setCart((current) => ({ ...current, [productId]: quantity }));
  }

  function reviewBill() {
    if (items.length === 0) {
      setError("Add at least one medicine before reviewing the bill.");
      return;
    }
    if (
      discountInput.trim() !== "" &&
      parseINRToPaise(discountInput) === null
    ) {
      setError("Enter a valid discount amount in rupees.");
      return;
    }
    if (discountPaise > subtotalPaise) {
      setError("Discount cannot be greater than the subtotal.");
      return;
    }
    if (customerPhone && !/^\d{10}$/.test(customerPhone.trim())) {
      setError("Enter a 10-digit sample phone number or leave it blank.");
      return;
    }
    setError("");
    setReviewing(true);
  }

  function confirmSale() {
    const customerLabel = customerName.trim();
    const phone = customerPhone.trim();
    const customerMatch = data?.customers.find(
      (customer) => phone && customer.phone === phone,
    );
    const customer: DemoCustomer | null =
      customerLabel || phone
        ? customerMatch ?? {
            id: `demo-customer-${crypto.randomUUID()}`,
            name: customerLabel || "Walk-in customer",
            phone,
            notes: "",
            createdAt: new Date().toISOString(),
            isDemo: true,
            refills: [],
          }
        : null;
    const nextNumber =
      Math.max(
        0,
        ...(data?.sales.map((sale) =>
          Number(sale.receiptNumber.replace(/\D/g, "")) || 0,
        ) ?? []),
      ) + 1;
    const sale: DemoSale = {
      id: `demo-sale-${crypto.randomUUID()}`,
      receiptNumber: `RS-${String(nextNumber).padStart(6, "0")}`,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? "",
      customerPhone: customer?.phone ?? "",
      createdAt: new Date().toISOString(),
      items: items.map(({ product, quantity }) => ({
        pharmacyMedicineId: product.id,
        medicineName: product.name,
        quantity,
        unitPricePaise: product.pricePaise,
      })),
      subtotalPaise,
      discountPaise: totals.discountPaise,
      taxPaise: totals.taxPaise,
      totalPaise: totals.totalPaise,
    };

    updateData((current) => {
      const customers = [...current.customers];
      if (customer) {
        const index = customers.findIndex((item) => item.id === customer.id);
        if (index >= 0) {
          customers[index] = {
            ...customers[index],
            name: customerLabel || customers[index].name,
            phone: phone || customers[index].phone,
          };
        } else {
          customers.unshift(customer);
        }
      }
      const inventoryQuantities = { ...current.inventoryQuantities };
      for (const item of sale.items) {
        const product = products.find(
          (candidate) => candidate.id === item.pharmacyMedicineId,
        );
        if (product) {
          inventoryQuantities[product.id] =
            getDemoAvailableQuantity(product, current) - item.quantity;
        }
      }
      return {
        ...current,
        customers,
        sales: [sale, ...current.sales],
        inventoryQuantities,
      };
    });
    setReceipt(sale);
    setCart({});
    setCustomerName("");
    setCustomerPhone("");
    setDiscountInput("");
    setReviewing(false);
    setError("");
  }

  function startNewBill() {
    setReceipt(null);
    setReviewing(false);
  }

  return (
    <section className="workspace-section-page demo-page">
      <DemoPageHeading
        title="Billing"
        description="Build a sample bill, check available stock, then review and confirm it."
        action={
          receipt ? (
            <button className="button button-secondary" onClick={startNewBill} type="button">
              New bill
            </button>
          ) : undefined
        }
      />
      <DemoModeNotice />
      {receipt ? (
        <DemoReceipt
          settings={data?.settings ?? createEmptyDemoWorkspaceData(pharmacyId).settings}
          sale={receipt}
        />
      ) : (
        <>
          {!data && (
            <div className="demo-inline-empty">
              <span>No sample sales or customers are loaded.</span>
              <button className="button button-secondary" onClick={loadDemoData} type="button">
                Load demo data
              </button>
            </div>
          )}
          <div className="demo-billing-layout">
            <section className="panel demo-panel demo-billing-controls">
              <div className="panel-heading">
                <div>
                  <h3>{reviewing ? "Review this bill" : "Create a bill"}</h3>
                  <p>This checkout changes only your browser demo data.</p>
                </div>
                <span className="demo-step">{reviewing ? "STEP 2 OF 2" : "STEP 1 OF 2"}</span>
              </div>
              {!reviewing ? (
                <>
                  <div className="demo-form-grid">
                    <label className="demo-field">
                      <span>Customer name <small>Optional</small></span>
                      <input
                        autoComplete="off"
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Walk-in customer"
                        value={customerName}
                      />
                    </label>
                    <label className="demo-field">
                      <span>Phone number <small>Optional, demo only</small></span>
                      <input
                        autoComplete="off"
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(event) => setCustomerPhone(event.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit number"
                        value={customerPhone}
                      />
                    </label>
                  </div>
                  <div className="demo-product-picker">
                    <label className="demo-field">
                      <span>Search sample inventory</span>
                      <input
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Brand, generic or strength"
                        value={search}
                      />
                    </label>
                    <label className="demo-field">
                      <span>Medicine</span>
                      <select
                        onChange={(event) => setSelectedProductId(event.target.value)}
                        value={activeProductId}
                      >
                        {filteredProducts.map((product) => (
                          <option disabled={getDemoAvailableQuantity(product, data) <= 0} key={product.id} value={product.id}>
                            {product.name} · {product.strength} · {getDemoAvailableQuantity(product, data)} in stock
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="button button-primary" onClick={addProduct} type="button">
                      Add medicine
                    </button>
                  </div>
                  {items.length > 0 ? (
                    <div className="demo-table-wrap">
                      <table className="demo-table">
                        <thead>
                          <tr><th>Medicine</th><th>Available</th><th>Qty</th><th>Amount</th><th /></tr>
                        </thead>
                        <tbody>
                          {items.map(({ product, quantity }) => (
                            <tr key={product.id}>
                              <td>
                                <strong>{product.name}</strong>
                                <small>{product.genericName} · {product.strength}</small>
                              </td>
                              <td>{getDemoAvailableQuantity(product, data)}</td>
                              <td>
                                <input
                                  aria-label={`Quantity for ${product.name}`}
                                  className="demo-quantity-input"
                                  max={getDemoAvailableQuantity(product, data)}
                                  min={0}
                                  onChange={(event) => changeQuantity(product.id, Number(event.target.value))}
                                  type="number"
                                  value={quantity}
                                />
                              </td>
                              <td>{formatINR(product.pricePaise * quantity)}</td>
                              <td>
                                <button
                                  aria-label={`Remove ${product.name}`}
                                  className="button button-quiet demo-remove-button"
                                  onClick={() => changeQuantity(product.id, 0)}
                                  type="button"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="demo-muted demo-cart-empty">
                      Search the sample inventory and add a medicine to get started.
                    </p>
                  )}
                  {error && <p className="demo-inline-error" role="alert">{error}</p>}
                  <button className="button button-primary" onClick={reviewBill} type="button">
                    Review bill
                  </button>
                </>
              ) : (
                <div className="demo-review">
                  <p>
                    {customerName.trim() || "Walk-in customer"}
                    {customerPhone && ` · ${customerPhone}`}
                  </p>
                  {items.map(({ product, quantity }) => (
                    <div className="demo-review-line" key={product.id}>
                      <span>{product.name} × {quantity}</span>
                      <strong>{formatINR(product.pricePaise * quantity)}</strong>
                    </div>
                  ))}
                  {error && <p className="demo-inline-error" role="alert">{error}</p>}
                  <div className="demo-review-actions">
                    <button className="button button-secondary" onClick={() => setReviewing(false)} type="button">
                      Back to edit
                    </button>
                    <button className="button button-primary" onClick={confirmSale} type="button">
                      Confirm demo sale
                    </button>
                  </div>
                </div>
              )}
            </section>
            <aside className="panel demo-panel demo-bill-summary">
              <div className="panel-heading">
                <div><h3>Bill summary</h3><p>Tax from Settings</p></div>
              </div>
              <div className="demo-summary-lines">
                <div><span>Subtotal</span><strong>{formatINR(subtotalPaise)}</strong></div>
                <label className="demo-summary-discount">
                  <span>Discount (₹)</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) => setDiscountInput(event.target.value)}
                    placeholder="0.00"
                    value={discountInput}
                  />
                </label>
                <div><span>Tax ({data?.settings.taxPercent ?? 5}%)</span><strong>{formatINR(totals.taxPaise)}</strong></div>
                <div className="demo-summary-total"><span>Total</span><strong>{formatINR(totals.totalPaise)}</strong></div>
              </div>
              <p className="demo-muted">
                Stock is checked against this pharmacy&apos;s unexpired sample batches.
                Confirming a bill updates only the local demo stock tally.
              </p>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
