import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { getAuthState } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="route-loading" role="status" aria-live="polite">
          Loading sign in…
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

async function LoginPageContent() {
  const configured = isSupabaseConfigured();
  const { user, error } = await getAuthState();
  if (user) redirect("/");

  return (
    <AuthShell
      description="Sign in to your pharmacy workspace."
      title="Welcome back"
    >
      <LoginForm
        authError={configured ? error : null}
        configured={configured}
      />
    </AuthShell>
  );
}
