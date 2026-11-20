import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";

export function AuthShell({
  title,
  description,
  children,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="auth-page">
      <div className="auth-back">
        <Brand href="/login" />
        {backHref && <Link href={backHref}>{backLabel ?? "Back"}</Link>}
      </div>
      <section aria-labelledby="auth-title" className="auth-card">
        <p className="eyebrow">MediSync account</p>
        {title && <h1 id="auth-title">{title}</h1>}
        {description && <p className="auth-description">{description}</p>}
        {children}
      </section>
      <p className="auth-footer">Built for better pharmacy operations.</p>
    </main>
  );
}
