"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { MedicineForm } from "@/components/medicine-form";
import { MedicineImage } from "@/components/medicine-image";
import { ExpiryStatusBadge } from "@/components/stock-status-badge";
import {
  getExpiryStatus,
  searchMedicines,
  validateBatchDraft,
  type BatchDraft,
  type BatchDraftError,
  type ParsedBatchDraft,
} from "@/lib/inventory";
import {
  DEMO_EXPIRY_WARNING_DAYS,
  DEMO_TODAY,
  demoMedicines,
} from "@/lib/inventory-data";
import { formatINR, formatIndianDate } from "@/lib/format";
import type { Medicine } from "@/lib/types";
import { useActivePharmacyId } from "@/lib/workspace-context";

const initialBatch: BatchDraft = {
  batchNumber: "",
  quantityReceived: "",
  expiryDate: "",
  purchasePrice: "",
  mrp: "",
  receivedDate: DEMO_TODAY,
};

const steps = ["Medicine", "Batch details", "Review", "Confirmation"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol aria-label="Add stock steps" className="wizard-steps">
      {steps.map((label, index) => {
        const step = index + 1;
        return (
          <li
            aria-current={step === currentStep ? "step" : undefined}
            className={step <= currentStep ? "wizard-step wizard-step-active" : "wizard-step"}
            key={label}
          >
            <span>{step < currentStep ? <Icon name="check" size={15} /> : step}</span>
            <strong>{label}</strong>
          </li>
        );
      })}
    </ol>
  );
}

function DraftField({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
  ...inputProps
}: {
  label: string;
  name: keyof BatchDraft;
  value: string;
  error?: string;
  onChange: (field: keyof BatchDraft, value: string) => void;
  type?: "text" | "date";
  placeholder?: string;
  inputMode?: "numeric" | "decimal" | "text";
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="stock-form-field">
      {label}
      <input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        required={inputProps.required}
        type={type}
        value={value}
        {...inputProps}
      />
      {error && <span className="field-error" id={`${name}-error`}>{error}</span>}
    </label>
  );
}

export function AddStockWizard() {
  const pharmacyId = useActivePharmacyId();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [customMedicineOpen, setCustomMedicineOpen] = useState(false);
  const [medicineMatch, setMedicineMatch] = useState<Medicine | undefined>();
  const [medicineError, setMedicineError] = useState("");
  const [batchDraft, setBatchDraft] = useState(initialBatch);
  const [batchErrors, setBatchErrors] = useState<BatchDraftError>({});
  const [batchReview, setBatchReview] = useState<ParsedBatchDraft | null>(null);

  const matchingMedicines = useMemo(
    () => searchMedicines(demoMedicines, search),
    [search],
  );
  const expiryStatus = batchDraft.expiryDate
    ? getExpiryStatus(
        batchDraft.expiryDate,
        DEMO_TODAY,
        DEMO_EXPIRY_WARNING_DAYS,
      )
    : null;

  function updateBatch(field: keyof BatchDraft, value: string) {
    setBatchDraft((current) => ({ ...current, [field]: value }));
    setBatchErrors((current) => ({ ...current, [field]: undefined }));
  }

  function continueToBatch() {
    if (!selectedMedicine) {
      setMedicineError("Choose a catalogue medicine or create a custom medicine.");
      return;
    }
    setMedicineError("");
    setStep(2);
  }

  function continueToReview() {
    const result = validateBatchDraft(batchDraft);
    if (!result.valid) {
      setBatchErrors(result.errors);
      return;
    }
    setBatchErrors({});
    setBatchReview(result.batch);
    setStep(3);
  }

  function completeDemoEntry() {
    setStep(4);
  }

  return (
    <section className="stock-wizard-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">INVENTORY WORKFLOW</p>
          <h2>Add stock</h2>
          <p>Review medicine and batch details before the demo confirmation.</p>
        </div>
        <Link className="button button-secondary" href="/inventory">
          Cancel
        </Link>
      </div>
      <div className="inventory-demo-note" role="note">
        <span className="demo-badge">Demo only</span>
        <span>Workspace {pharmacyId} · Nothing will be saved or added to inventory.</span>
      </div>
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <section aria-labelledby="stock-medicine-step" className="wizard-panel">
          <p className="eyebrow">STEP 1 OF 4</p>
          <h3 id="stock-medicine-step">Choose a medicine</h3>
          <p className="wizard-help">
            Select the exact strength, form, and pack size. Similar names can be different products.
          </p>
          <label className="inventory-search wizard-search">
            <Icon name="search" size={18} />
            <span className="sr-only">Search medicine catalogue</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search catalogue"
              type="search"
              value={search}
            />
          </label>
          {selectedMedicine && (
            <div className="selected-medicine" role="status">
              <MedicineImage medicine={selectedMedicine} size="small" />
              <div>
                <strong>{selectedMedicine.brandName}</strong>
                <span>{selectedMedicine.genericName} · {selectedMedicine.strength} · {selectedMedicine.dosageForm} · {selectedMedicine.packSize}</span>
              </div>
              <button
                aria-label="Clear selected medicine"
                className="button button-quiet"
                onClick={() => {
                  setSelectedMedicine(null);
                  setMedicineMatch(undefined);
                }}
                type="button"
              >
                Change
              </button>
            </div>
          )}
          <div className="wizard-medicine-list">
            {matchingMedicines.map((medicine) => (
              <button
                aria-pressed={selectedMedicine?.id === medicine.id}
                className={`wizard-medicine-option ${selectedMedicine?.id === medicine.id ? "wizard-medicine-selected" : ""}`}
                key={medicine.id}
                onClick={() => {
                  setSelectedMedicine(medicine);
                  setMedicineMatch(undefined);
                  setMedicineError("");
                }}
                type="button"
              >
                <MedicineImage medicine={medicine} size="small" />
                <span>
                  <strong>{medicine.brandName}</strong>
                  <small>{medicine.genericName} · {medicine.strength} · {medicine.dosageForm} · {medicine.packSize}</small>
                </span>
                {selectedMedicine?.id === medicine.id && <Icon name="check" size={17} />}
              </button>
            ))}
            {matchingMedicines.length === 0 && (
              <p className="wizard-no-results">No catalogue match. You can enter a custom medicine below.</p>
            )}
          </div>
          {medicineMatch && (
            <div className="form-warning" role="status">
              “{medicineMatch.brandName}” matches composition, strength, form, and pack size.
              Review it carefully; nothing is merged automatically.
            </div>
          )}
          {customMedicineOpen ? (
            <MedicineForm
              onCancel={() => setCustomMedicineOpen(false)}
              onCreate={(medicine, exactMatch) => {
                setSelectedMedicine(medicine);
                setMedicineMatch(exactMatch);
                setCustomMedicineOpen(false);
                setMedicineError("");
              }}
            />
          ) : (
            <button
              className="button button-secondary wizard-custom-button"
              onClick={() => setCustomMedicineOpen(true)}
              type="button"
            >
              <Icon name="plus" size={16} /> Create a custom medicine
            </button>
          )}
          {medicineError && <p className="form-error" role="alert">{medicineError}</p>}
          <div className="wizard-footer">
            <span>Catalogue search does not combine similar products.</span>
            <button className="button button-primary" onClick={continueToBatch} type="button">
              Continue <Icon name="chevron" size={16} />
            </button>
          </div>
        </section>
      )}

      {step === 2 && selectedMedicine && (
        <section aria-labelledby="batch-info-step" className="wizard-panel">
          <p className="eyebrow">STEP 2 OF 4</p>
          <h3 id="batch-info-step">Enter batch information</h3>
          <div className="wizard-selected-summary">
            <MedicineImage medicine={selectedMedicine} size="small" />
            <span><strong>{selectedMedicine.brandName}</strong><small>{selectedMedicine.genericName} · {selectedMedicine.strength} · {selectedMedicine.packSize}</small></span>
            <button className="text-button" onClick={() => setStep(1)} type="button">Change</button>
          </div>
          <p className="form-demo-note">
            New batch available quantity starts at quantity received. Prices are entered in INR and parsed to integer paise.
          </p>
          <div className="stock-form-grid">
            <DraftField
              error={batchErrors.batchNumber}
              label="Batch number"
              name="batchNumber"
              onChange={updateBatch}
              placeholder="For example, B-24018"
              required
              value={batchDraft.batchNumber}
            />
            <DraftField
              error={batchErrors.quantityReceived}
              inputMode="numeric"
              label="Quantity received"
              name="quantityReceived"
              onChange={updateBatch}
              placeholder="Whole units"
              required
              value={batchDraft.quantityReceived}
            />
            <DraftField
              error={batchErrors.expiryDate}
              label="Expiry date"
              name="expiryDate"
              onChange={updateBatch}
              required
              type="date"
              value={batchDraft.expiryDate}
            />
            <DraftField
              error={batchErrors.receivedDate}
              label="Received date"
              name="receivedDate"
              onChange={updateBatch}
              required
              type="date"
              value={batchDraft.receivedDate}
            />
            <DraftField
              error={batchErrors.purchasePrice}
              inputMode="decimal"
              label="Purchase price / unit (₹)"
              name="purchasePrice"
              onChange={updateBatch}
              placeholder="0.00"
              required
              value={batchDraft.purchasePrice}
            />
            <DraftField
              error={batchErrors.mrp}
              inputMode="decimal"
              label="Batch MRP / unit (₹) · optional"
              name="mrp"
              onChange={updateBatch}
              placeholder="Leave blank if not set"
              value={batchDraft.mrp}
            />
          </div>
          {expiryStatus === "expired" && (
            <div className="form-warning form-warning-expired" role="alert">
              This batch is expired as of {formatIndianDate(DEMO_TODAY)}. It will be clearly flagged
              and excluded from available stock in this preview.
            </div>
          )}
          {expiryStatus === "expiring-soon" && (
            <div className="form-warning" role="status">
              This batch expires within the {DEMO_EXPIRY_WARNING_DAYS}-day warning window.
            </div>
          )}
          <div className="wizard-footer">
            <button className="button button-secondary" onClick={() => setStep(1)} type="button">
              <Icon name="arrowLeft" size={16} /> Back
            </button>
            <button className="button button-primary" onClick={continueToReview} type="button">
              Review batch <Icon name="chevron" size={16} />
            </button>
          </div>
        </section>
      )}

      {step === 3 && selectedMedicine && batchReview && (
        <section aria-labelledby="stock-review-step" className="wizard-panel">
          <p className="eyebrow">STEP 3 OF 4</p>
          <h3 id="stock-review-step">Review stock entry</h3>
          <p className="wizard-help">Check the product and batch details. This is still a preview.</p>
          <div className="stock-review-card">
            <div className="stock-review-medicine">
              <MedicineImage medicine={selectedMedicine} size="medium" />
              <div>
                <strong>{selectedMedicine.brandName}</strong>
                <span>{selectedMedicine.genericName} · {selectedMedicine.strength} · {selectedMedicine.dosageForm}</span>
                <span>{selectedMedicine.composition} · {selectedMedicine.packSize}</span>
                <span>{selectedMedicine.manufacturer}</span>
              </div>
            </div>
            <dl className="stock-review-grid">
              <div><dt>Batch number</dt><dd>{batchReview.batchNumber}</dd></div>
              <div><dt>Quantity received</dt><dd>{batchReview.quantityReceived} units</dd></div>
              <div><dt>Available after receipt</dt><dd>{batchReview.availableQuantity} units</dd></div>
              <div><dt>Expiry date</dt><dd>{formatIndianDate(batchReview.expiryDate)}</dd></div>
              <div><dt>Purchase / unit</dt><dd>{formatINR(batchReview.purchasePricePaise)}</dd></div>
              <div><dt>Batch MRP / unit</dt><dd>{batchReview.mrpPaise === null ? "Not set" : formatINR(batchReview.mrpPaise)}</dd></div>
              <div><dt>Received date</dt><dd>{formatIndianDate(batchReview.receivedDate)}</dd></div>
              <div><dt>Expiry status</dt><dd><ExpiryStatusBadge status={getExpiryStatus(batchReview.expiryDate, DEMO_TODAY, DEMO_EXPIRY_WARNING_DAYS)} /></dd></div>
            </dl>
          </div>
          <div className="wizard-footer">
            <button className="button button-secondary" onClick={() => setStep(2)} type="button">
              <Icon name="arrowLeft" size={16} /> Edit batch
            </button>
            <button className="button button-primary" onClick={completeDemoEntry} type="button">
              Confirm demo entry <Icon name="check" size={16} />
            </button>
          </div>
        </section>
      )}

      {step === 4 && selectedMedicine && batchReview && (
        <section aria-labelledby="stock-complete-title" className="wizard-panel wizard-complete">
          <span className="wizard-complete-icon"><Icon name="check" size={25} /></span>
          <p className="eyebrow">STEP 4 OF 4</p>
          <h3 id="stock-complete-title">Demo entry reviewed</h3>
          <p className="wizard-help">
            {batchReview.quantityReceived} units of {selectedMedicine.brandName} · batch {batchReview.batchNumber}.
          </p>
          <div className="form-warning" role="status">
            No inventory was changed. This confirmation is temporary and will disappear when you leave or refresh.
          </div>
          <div className="wizard-footer wizard-footer-centered">
            <Link className="button button-secondary" href="/inventory">Back to inventory</Link>
            <button
              className="button button-quiet"
              onClick={() => {
                setStep(1);
                setSelectedMedicine(null);
                setBatchDraft(initialBatch);
                setBatchReview(null);
              }}
              type="button"
            >
              Start another preview
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
