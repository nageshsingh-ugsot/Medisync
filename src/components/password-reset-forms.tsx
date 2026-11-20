"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  updatePasswordAction,
  type AuthActionState,
} from "@/app/auth-actions";

const initialState: AuthActionState = { error: "", message: "" };

export function RequestPasswordResetForm({
  configured,
}: {
  configured: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <>
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
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        {state.message && <p className="form-notice" role="status">{state.message}</p>}
        <button
          className="button button-primary button-full"
          disabled={!configured || pending}
          type="submit"
        >
          {pending ? "Sending link…" : "Send reset link"}
        </button>
      </form>
      <p className="auth-switch">
        Remember your password? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <>
      <form action={formAction} className="auth-form">
        <label>
          New password
          <input
            autoComplete="new-password"
            minLength={8}
            name="password"
            placeholder="At least 8 characters"
            required
            type="password"
          />
        </label>
        <label>
          Confirm new password
          <input
            autoComplete="new-password"
            minLength={8}
            name="confirmPassword"
            placeholder="Enter the new password again"
            required
            type="password"
          />
        </label>
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        <button
          className="button button-primary button-full"
          disabled={pending}
          type="submit"
        >
          {pending ? "Updating password…" : "Update password"}
        </button>
      </form>
      <p className="auth-switch">
        <Link href="/forgot-password">Request another reset link</Link>
      </p>
    </>
  );
}
