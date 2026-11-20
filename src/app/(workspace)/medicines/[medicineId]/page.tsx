import { Suspense } from "react";
import { MedicineDetails } from "@/components/medicine-details";

export default function MedicineDetailPage({
  params,
}: {
  params: Promise<{ medicineId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <section className="route-loading" role="status" aria-live="polite">
          Loading medicine details…
        </section>
      }
    >
      <MedicineDetailContent params={params} />
    </Suspense>
  );
}

async function MedicineDetailContent({
  params,
}: {
  params: Promise<{ medicineId: string }>;
}) {
  const { medicineId } = await params;
  return <MedicineDetails medicineId={medicineId} />;
}
