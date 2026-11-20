"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { MedicineImage } from "@/components/medicine-image";
import { searchMedicines } from "@/lib/inventory";
import { demoMedicines } from "@/lib/inventory-data";

export function CatalogueBrowser() {
  const [query, setQuery] = useState("");
  const medicines = useMemo(
    () => searchMedicines(demoMedicines, query),
    [query],
  );

  return (
    <section className="catalogue-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">SHARED CATALOGUE</p>
          <h2>Medicines</h2>
          <p>Product identity is separate from each pharmacy’s stock and pricing.</p>
        </div>
        <Link className="button button-primary" href="/medicines/new">
          <Icon name="plus" size={17} /> Add custom medicine
        </Link>
      </div>
      <div className="inventory-demo-note" role="note">
        <span className="demo-badge">Demo catalogue</span>
        <span>Sample products only. Similar names are not automatically merged.</span>
      </div>
      <label className="catalogue-search inventory-search">
        <Icon name="search" size={18} />
        <span className="sr-only">Search medicine catalogue</span>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by medicine, brand, generic or composition"
          type="search"
          value={query}
        />
      </label>
      <p className="inventory-result-count" aria-live="polite">
        {medicines.length} of {demoMedicines.length} medicines
      </p>
      {medicines.length === 0 ? (
        <div className="inventory-empty">
          <span className="placeholder-icon"><Icon name="medicines" size={24} /></span>
          <h3>No matching medicines</h3>
          <p>Try a shorter search, or add a custom medicine for this preview.</p>
          <Link className="button button-secondary" href="/medicines/new">
            Add custom medicine
          </Link>
        </div>
      ) : (
        <div className="catalogue-grid">
          {medicines.map((medicine) => (
            <article className="catalogue-card" key={medicine.id}>
              <div className="catalogue-card-top">
                <MedicineImage medicine={medicine} />
                <span className="catalogue-form">{medicine.dosageForm}</span>
              </div>
              <div className="catalogue-card-copy">
                <p className="catalogue-brand">{medicine.brandName}</p>
                <h3>{medicine.genericName}</h3>
                <p className="catalogue-composition">{medicine.composition}</p>
                <div className="medicine-specs">
                  <span>{medicine.strength}</span>
                  <span>{medicine.packSize}</span>
                </div>
                <p className="catalogue-manufacturer">{medicine.manufacturer}</p>
              </div>
              <Link className="catalogue-detail-link" href={`/medicines/${medicine.id}`}>
                Medicine details <Icon name="arrowLeft" size={15} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
