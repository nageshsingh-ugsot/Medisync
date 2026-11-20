import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { UpdatePasswordForm } from "@/components/password-reset-forms";
import { getAuthState } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="route-loading" role="status" aria-live="polite">
          Checking your reset link…
        </main>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}

async function UpdatePasswordContent() {
  if (!isSupabaseConfigured()) {
    return (
      <AuthShell title="Reset your password">
        <p className="auth-error" role="alert">
          Supabase is not configured. Add its URL and anon key to .env.local.
        </p>
      </AuthShell>
    );
  }

  const { user, error } = await getAuthState();
  if (error || !user) {
    return (
      <AuthShell
        backHref="/login"
        backLabel="Back to sign in"
        description="Open the password reset link from your email first."
        title="Reset link needed"
      >
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!error && (
          <p className="form-notice" role="status">
            This page needs a valid reset link. Request a fresh link to continue.
          </p>
        )}
        <p className="auth-switch">
          <Link href="/forgot-password">Request a reset link</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      backHref="/login"
      backLabel="Cancel"
      description="Choose a new password for your MediSync account."
      title="Choose a new password"
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
