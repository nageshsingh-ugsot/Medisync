import Image from "next/image";
import { Icon } from "@/components/icon";
import type { Medicine } from "@/lib/types";

export function MedicineImage({
  medicine,
  size = "medium",
}: {
  medicine: Medicine;
  size?: "small" | "medium" | "large";
}) {
  const localImage =
    medicine.imageUrl?.startsWith("/") === true ? medicine.imageUrl : null;

  return (
    <span
      aria-label={
        localImage
          ? `${medicine.brandName} product image`
          : `No product image available for ${medicine.brandName}`
      }
      className={`medicine-image medicine-image-${size}`}
      role="img"
    >
      {localImage ? (
        <Image alt="" fill sizes="100px" src={localImage} />
      ) : (
        <>
          <Icon name="medicines" size={size === "large" ? 30 : 20} />
          {size !== "small" && <span>Image unavailable</span>}
        </>
      )}
    </span>
  );
}
