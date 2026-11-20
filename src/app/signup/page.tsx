import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import { getAuthState } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="route-loading" role="status" aria-live="polite">
          Loading account setup…
        </main>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}

async function SignupPageContent() {
  const configured = isSupabaseConfigured();
  const { user, error } = await getAuthState();
  if (user) redirect("/");

  return (
    <AuthShell
      description="Create your MediSync login and initial pharmacy workspace."
      title="Create an account"
    >
      {configured && error && <p className="auth-error" role="alert">{error}</p>}
      <SignupForm configured={configured} />
    </AuthShell>
  );
}
