import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { OnboardingPreview } from "@/components/onboarding-preview";
import { getAuthState } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="route-loading" role="status" aria-live="polite">
          Loading pharmacy setup…
        </main>
      }
    >
      <AuthenticatedOnboardingPage />
    </Suspense>
  );
}

async function AuthenticatedOnboardingPage() {
  if (!isSupabaseConfigured()) redirect("/login?setup=required");

  const { user, error } = await getAuthState();
  if (error) {
    return (
      <main className="route-error" role="alert">
        <h1>We couldn&apos;t verify your sign-in</h1>
        <p>{error}</p>
        <Link className="button button-secondary" href="/login">Go to sign in</Link>
      </main>
    );
  }
  if (!user) redirect("/login");

  return (
    <AuthShell
      backHref="/"
      backLabel="Back to workspace"
      description="Add a pharmacy workspace to your account."
      title="Set up your pharmacy"
    >
      <OnboardingPreview />
    </AuthShell>
  );
}
