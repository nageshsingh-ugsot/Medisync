import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { getAuthState } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="route-loading" role="status" aria-live="polite">
          Checking your session…
        </main>
      }
    >
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}

async function AuthenticatedWorkspace({ children }: { children: ReactNode }) {
  await connection();
  if (!isSupabaseConfigured()) redirect("/login?setup=required");

  const { user, error } = await getAuthState();
  if (error) {
    return (
      <main className="route-error" role="alert">
        <h1>We couldn&apos;t verify your sign-in</h1>
        <p>{error}</p>
        <Link className="button button-secondary" href="/login">
          Go to sign in
        </Link>
      </main>
    );
  }
  if (!user) redirect("/login");

  return <AppShell userEmail={user.email}>{children}</AppShell>;
}
