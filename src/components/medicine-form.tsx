"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { findExactMedicineMatch } from "@/lib/inventory";
import { demoMedicines } from "@/lib/inventory-data";
import type { DosageForm, Medicine } from "@/lib/types";

type MedicineDraft = Omit<Medicine, "id" | "imageUrl">;

const emptyDraft: MedicineDraft = {
  brandName: "",
  genericName: "",
  composition: "",
  strength: "",
  dosageForm: "tablet",
  packSize: "",
  manufacturer: "",
};

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

export function MedicineForm({
  onCreate,
  onCancel,
}: {
  onCreate: (medicine: Medicine, exactMatch?: Medicine) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");

  function update<K extends keyof MedicineDraft>(field: K, value: MedicineDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate: Medicine = {
      ...draft,
      brandName: draft.brandName.trim(),
      genericName: draft.genericName.trim(),
      composition: draft.composition.trim(),
      strength: draft.strength.trim(),
      packSize: draft.packSize.trim(),
      manufacturer: draft.manufacturer.trim(),
      id: "custom-preview",
      imageUrl: null,
    };

    if (
      !candidate.brandName ||
      !candidate.genericName ||
      !candidate.composition ||
      !candidate.strength ||
      !candidate.packSize ||
      !candidate.manufacturer
    ) {
      setError("Complete all medicine details before continuing.");
      return;
    }

    setError("");
    onCreate(candidate, findExactMedicineMatch(candidate, demoMedicines));
  }

  return (
    <form className="medicine-form" onSubmit={submit}>
      <div className="medicine-form-heading">
        <div>
          <h3>Custom medicine details</h3>
          <p>Use the package label; similar names are not enough to identify a match.</p>
        </div>
        <span className="demo-badge">Preview only</span>
      </div>
      <div className="medicine-form-grid">
        <label>
          Brand name
          <input
            onChange={(event) => update("brandName", event.target.value)}
            required
            value={draft.brandName}
          />
        </label>
        <label>
          Generic name
          <input
            onChange={(event) => update("genericName", event.target.value)}
            required
            value={draft.genericName}
          />
        </label>
        <label>
          Composition
          <input
            onChange={(event) => update("composition", event.target.value)}
            required
            value={draft.composition}
          />
        </label>
        <label>
          Strength
          <input
            onChange={(event) => update("strength", event.target.value)}
            placeholder="For example, 500 mg"
            required
            value={draft.strength}
          />
        </label>
        <label>
          Dosage form
          <select
            onChange={(event) => update("dosageForm", event.target.value as DosageForm)}
            value={draft.dosageForm}
          >
            {dosageForms.map((form) => (
              <option key={form.value} value={form.value}>{form.label}</option>
            ))}
          </select>
        </label>
        <label>
          Pack size
          <input
            onChange={(event) => update("packSize", event.target.value)}
            placeholder="For example, 10 tablets"
            required
            value={draft.packSize}
          />
        </label>
        <label className="medicine-form-wide">
          Manufacturer
          <input
            onChange={(event) => update("manufacturer", event.target.value)}
            required
            value={draft.manufacturer}
          />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        {onCancel && (
          <button className="button button-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        )}
        <button className="button button-primary" type="submit">
          <Icon name="check" size={17} /> Preview medicine
        </button>
      </div>
      <p className="form-demo-note">
        This entry is not added to the shared catalogue or saved.
      </p>
    </form>
  );
}
