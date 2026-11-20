import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { RequestPasswordResetForm } from "@/components/password-reset-forms";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type ForgotPasswordSearchParams = Promise<{
  error?: string | string[];
}>;

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: ForgotPasswordSearchParams;
}) {
  return (
    <Suspense
      fallback={
        <main className="route-loading" role="status" aria-live="polite">
          Loading password reset…
        </main>
      }
    >
      <ForgotPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ForgotPasswordContent({
  searchParams,
}: {
  searchParams: ForgotPasswordSearchParams;
}) {
  const search = await searchParams;
  const invalidLink = search.error === "invalid-link";

  return (
    <AuthShell
      backHref="/login"
      backLabel="Back to sign in"
      description="We'll email a secure link to reset your password."
      title="Reset your password"
    >
      {invalidLink && (
        <p className="auth-error" role="alert">
          That reset link is invalid or expired. Request a new one below.
        </p>
      )}
      <RequestPasswordResetForm configured={isSupabaseConfigured()} />
    </AuthShell>
  );
}
