"use client";

import Link from "next/link";
import { MedicineImage } from "@/components/medicine-image";
import { Icon } from "@/components/icon";
import { ExpiryStatusBadge, StockStatusBadge } from "@/components/stock-status-badge";
import {
  calculateAvailableQuantity,
  countActiveBatches,
  getExpiryCounts,
  getExpiryStatus,
  getStockStatus,
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

export function MedicineDetails({
  medicineId,
  pharmacyMedicineId,
}: {
  medicineId?: string;
  pharmacyMedicineId?: string;
}) {
  const pharmacyId = useActivePharmacyId();
  const pharmacyMedicine = pharmacyMedicineId
    ? demoPharmacyMedicines.find(
        (item) =>
          item.id === pharmacyMedicineId && item.pharmacyId === pharmacyId,
      )
    : demoPharmacyMedicines.find(
        (item) =>
          item.medicineId === medicineId && item.pharmacyId === pharmacyId,
      );
  const resolvedMedicineId = pharmacyMedicine?.medicineId ?? medicineId;
  const medicine = demoMedicines.find((item) => item.id === resolvedMedicineId);

  if (!medicine) {
    return (
      <section className="inventory-empty">
        <h2>Medicine not found</h2>
        <p>This item is not in the demo catalogue or the active pharmacy.</p>
        <Link className="button button-secondary" href="/inventory">Back to inventory</Link>
      </section>
    );
  }

  const batches = pharmacyMedicine
    ? demoInventoryBatches
        .filter((batch) => batch.pharmacyMedicineId === pharmacyMedicine.id)
        .sort(
          (left, right) =>
            left.expiryDate.localeCompare(right.expiryDate) ||
            left.batchNumber.localeCompare(right.batchNumber),
        )
    : [];
  const availableQuantity = pharmacyMedicine
    ? calculateAvailableQuantity(pharmacyMedicine.id, demoInventoryBatches, DEMO_TODAY)
    : 0;
  const expiryCounts = pharmacyMedicine
    ? getExpiryCounts(
        pharmacyMedicine.id,
        demoInventoryBatches,
        DEMO_TODAY,
        DEMO_EXPIRY_WARNING_DAYS,
      )
    : { expiringSoon: 0, expired: 0 };

  return (
    <section className="medicine-detail-page">
      <div className="detail-back-row">
        <Link className="back-link" href={pharmacyMedicineId ? "/inventory" : "/medicines"}>
          <Icon name="arrowLeft" size={17} />
          {pharmacyMedicineId ? "Back to inventory" : "Back to medicines"}
        </Link>
        <span className="demo-badge">Demo data · not live</span>
      </div>
      <article className="medicine-detail-card">
        <MedicineImage medicine={medicine} size="large" />
        <div className="medicine-detail-copy">
          <p className="eyebrow">MEDICINE DETAILS</p>
          <h2>{medicine.brandName}</h2>
          <p className="detail-generic">{medicine.genericName}</p>
          <div className="medicine-specs">
            <span>{medicine.strength}</span>
            <span>{medicine.dosageForm}</span>
            <span>{medicine.packSize}</span>
          </div>
          <p className="detail-composition">{medicine.composition}</p>
          <p className="catalogue-manufacturer">Manufacturer · {medicine.manufacturer}</p>
        </div>
        {pharmacyMedicine && (
          <Link className="button button-primary medicine-detail-add" href="/inventory/add">
            <Icon name="plus" size={17} /> Add stock
          </Link>
        )}
      </article>

      <section aria-labelledby="pharmacy-stock-title" className="panel medicine-stock-panel">
        <div className="panel-heading">
          <div>
            <h3 id="pharmacy-stock-title">Pharmacy stock</h3>
            <p>SKU and batch records for the active workspace</p>
          </div>
          {pharmacyMedicine ? (
            <StockStatusBadge
              status={getStockStatus(
                availableQuantity,
                pharmacyMedicine.reorderThreshold,
              )}
            />
          ) : (
            <span className="demo-badge">No stock record</span>
          )}
        </div>
        {pharmacyMedicine ? (
          <>
            <div className="medicine-stock-summary">
              <div><span>Available units</span><strong>{availableQuantity}</strong></div>
              <div><span>Active batches</span><strong>{countActiveBatches(pharmacyMedicine.id, demoInventoryBatches, DEMO_TODAY)}</strong></div>
              <div><span>Retail / pack</span><strong>{formatINR(pharmacyMedicine.sellingPricePaise)}</strong></div>
              <div><span>Reorder threshold</span><strong>{pharmacyMedicine.reorderThreshold} units</strong></div>
            </div>
            {(expiryCounts.expiringSoon > 0 || expiryCounts.expired > 0) && (
              <div className="detail-expiry-alerts">
                {expiryCounts.expiringSoon > 0 && (
                  <span className="expiry-status expiry-status-expiring-soon">
                    {expiryCounts.expiringSoon} batch(es) expiring within {DEMO_EXPIRY_WARNING_DAYS} days
                  </span>
                )}
                {expiryCounts.expired > 0 && (
                  <span className="expiry-status expiry-status-expired">
                    {expiryCounts.expired} expired batch(es) with quantity
                  </span>
                )}
              </div>
            )}
            <h4 className="batch-section-title">Batch details</h4>
            {batches.length === 0 ? (
              <div className="detail-empty">No sample batches for this medicine.</div>
            ) : (
              <>
                <div className="batch-table-wrap">
                  <table className="batch-table">
                    <thead>
                      <tr>
                        <th scope="col">Batch number</th>
                        <th scope="col">Received</th>
                        <th scope="col">Available</th>
                        <th scope="col">Expiry</th>
                        <th scope="col">Purchase / unit</th>
                        <th scope="col">Batch MRP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((batch) => {
                        const expiryStatus = getExpiryStatus(
                          batch.expiryDate,
                          DEMO_TODAY,
                          DEMO_EXPIRY_WARNING_DAYS,
                        );
                        return (
                          <tr
                            className={expiryStatus === "expired" ? "batch-row-expired" : ""}
                            key={batch.id}
                          >
                            <td><strong>{batch.batchNumber}</strong></td>
                            <td>{batch.quantityReceived} · {formatIndianDate(batch.receivedDate)}</td>
                            <td>{batch.availableQuantity} units</td>
                            <td>
                              <span className="batch-expiry-cell">
                                {formatIndianDate(batch.expiryDate)}
                                <ExpiryStatusBadge status={expiryStatus} />
                              </span>
                            </td>
                            <td>{formatINR(batch.purchasePricePaise)}</td>
                            <td>{batch.mrpPaise === null ? "—" : formatINR(batch.mrpPaise)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="batch-mobile-list">
                  {batches.map((batch) => {
                    const expiryStatus = getExpiryStatus(
                      batch.expiryDate,
                      DEMO_TODAY,
                      DEMO_EXPIRY_WARNING_DAYS,
                    );
                    return (
                      <article
                        className={`batch-mobile-card ${expiryStatus === "expired" ? "batch-row-expired" : ""}`}
                        key={batch.id}
                      >
                        <div className="batch-mobile-heading">
                          <strong>{batch.batchNumber}</strong>
                          <ExpiryStatusBadge status={expiryStatus} />
                        </div>
                        <div className="batch-mobile-data">
                          <div><span>Expiry</span><strong>{formatIndianDate(batch.expiryDate)}</strong></div>
                          <div><span>Available</span><strong>{batch.availableQuantity} units</strong></div>
                          <div><span>Received</span><strong>{batch.quantityReceived} · {formatIndianDate(batch.receivedDate)}</strong></div>
                          <div><span>Purchase / unit</span><strong>{formatINR(batch.purchasePricePaise)}</strong></div>
                          <div><span>Batch MRP</span><strong>{batch.mrpPaise === null ? "—" : formatINR(batch.mrpPaise)}</strong></div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
            <p className="detail-stock-note">
              Expired batch quantities are shown for review but excluded from available stock.
            </p>
          </>
        ) : (
          <div className="detail-empty">
            This shared catalogue item has no stock record in the selected demo pharmacy.
          </div>
        )}
      </section>
      <div className="inventory-demo-note">
        <Icon name="shield" size={16} />
        <span>Demonstration only. Batch details are not saved or changed.</span>
      </div>
    </section>
  );
}
