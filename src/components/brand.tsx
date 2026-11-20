import Link from "next/link";

export function Brand({
  compact = false,
  href = "/",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      aria-label={href === "/" ? "MediSync dashboard" : "MediSync sign in"}
      className="brand-lockup"
      href={href}
    >
      <span aria-hidden="true" className="brand-symbol">
        M<span>+</span>
      </span>
      {!compact && (
        <span className="brand-wordmark">
          <strong>MediSync</strong>
          <small>PHARMACY WORKSPACE</small>
        </span>
      )}
    </Link>
  );
}
