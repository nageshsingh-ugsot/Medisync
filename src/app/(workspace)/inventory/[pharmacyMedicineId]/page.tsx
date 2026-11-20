import { Suspense } from "react";
import { MedicineDetails } from "@/components/medicine-details";

export default function InventoryItemPage({
  params,
}: {
  params: Promise<{ pharmacyMedicineId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <section className="route-loading" role="status" aria-live="polite">
          Loading batch details…
        </section>
      }
    >
      <InventoryItemContent params={params} />
    </Suspense>
  );
}

async function InventoryItemContent({
  params,
}: {
  params: Promise<{ pharmacyMedicineId: string }>;
}) {
  const { pharmacyMedicineId } = await params;
  return <MedicineDetails pharmacyMedicineId={pharmacyMedicineId} />;
}
