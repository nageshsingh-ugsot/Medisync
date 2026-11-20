"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInAction, type AuthActionState } from "@/app/auth-actions";

const initialState: AuthActionState = { error: "", message: "" };

export function LoginForm({
  configured,
  authError,
}: {
  configured: boolean;
  authError: string | null;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const searchParams = useSearchParams();
  const passwordUpdated = searchParams.get("passwordUpdated") === "1";

  return (
    <>
      {passwordUpdated && (
        <p className="form-notice" role="status">
          Your password has been updated. Sign in with the new password.
        </p>
      )}
      {authError && <p className="auth-error" role="alert">{authError}</p>}
      {!configured && (
        <p className="auth-error" role="alert">
          Supabase is not configured. Add its URL and anon key to .env.local.
        </p>
      )}
      <form action={formAction} className="auth-form">
        <label>
          Email address
          <input
            autoComplete="email"
            name="email"
            placeholder="you@pharmacy.com"
            required
            type="email"
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            minLength={8}
            name="password"
            placeholder="At least 8 characters"
            required
            type="password"
          />
        </label>
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        <button
          className="button button-primary button-full"
          disabled={!configured || pending}
          type="submit"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="auth-forgot-link">
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
      <p className="auth-switch">
        New to MediSync? <Link href="/signup">Create an account</Link>
      </p>
    </>
  );
}
