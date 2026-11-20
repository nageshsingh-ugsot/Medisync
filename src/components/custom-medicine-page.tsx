"use client";

import Link from "next/link";
import { useState } from "react";
import { MedicineForm } from "@/components/medicine-form";
import { MedicineImage } from "@/components/medicine-image";
import type { Medicine } from "@/lib/types";

export function CustomMedicinePage() {
  const [preview, setPreview] = useState<Medicine | null>(null);
  const [exactMatch, setExactMatch] = useState<Medicine | undefined>();

  if (preview) {
    return (
      <section className="catalogue-page">
        <div className="page-heading-row">
          <div>
            <p className="eyebrow">MEDICINE CATALOGUE</p>
            <h2>Medicine preview ready</h2>
          </div>
          <span className="demo-badge">Not saved</span>
        </div>
        {exactMatch && (
          <div className="form-warning" role="status">
            A catalogue entry matches the composition, strength, dosage form, and pack size.
            Review both entries; MediSync does not merge them automatically.
          </div>
        )}
        <article className="medicine-preview-card">
          <MedicineImage medicine={preview} size="large" />
          <div>
            <h3>{preview.brandName}</h3>
            <p>{preview.genericName} · {preview.strength} · {preview.dosageForm}</p>
            <p>{preview.composition} · {preview.packSize}</p>
            <p>{preview.manufacturer}</p>
          </div>
        </article>
        <p className="form-demo-note">
          This preview is temporary. The medicine was not added to the catalogue.
        </p>
        <div className="form-actions">
          <Link className="button button-secondary" href="/medicines">Back to medicines</Link>
          <Link className="button button-primary" href="/inventory">Open inventory</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="catalogue-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">MEDICINE CATALOGUE</p>
          <h2>Add a custom medicine</h2>
          <p>Enter details from the product packaging. This is a local preview only.</p>
        </div>
        <Link className="button button-secondary" href="/medicines">Cancel</Link>
      </div>
      <MedicineForm
        onCreate={(medicine, match) => {
          setPreview(medicine);
          setExactMatch(match);
        }}
      />
    </section>
  );
}
