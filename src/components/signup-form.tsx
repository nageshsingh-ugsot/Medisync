"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthActionState } from "@/app/auth-actions";

const initialState: AuthActionState = { error: "", message: "" };

export function SignupForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <>
      {!configured && (
        <p className="auth-error" role="alert">
          Supabase is not configured. Add its URL and anon key to .env.local.
        </p>
      )}
      <form action={formAction} className="auth-form">
        <label>
          Owner name
          <input autoComplete="name" maxLength={120} name="ownerName" required />
        </label>
        <label>
          Pharmacy name
          <input autoComplete="organization" maxLength={160} name="pharmacyName" required />
        </label>
        <label>
          Area
          <input autoComplete="address-level2" maxLength={160} name="area" required />
        </label>
        <label>
          WhatsApp number
          <input
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={10}
            name="whatsapp"
            pattern="[6-9][0-9]{9}"
            placeholder="10-digit number"
            required
            type="tel"
          />
        </label>
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
            autoComplete="new-password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <label>
          Confirm password
          <input
            autoComplete="new-password"
            minLength={8}
            name="confirmPassword"
            required
            type="password"
          />
        </label>
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        {state.message && <p className="form-notice" role="status">{state.message}</p>}
        <button
          className="button button-primary button-full"
          disabled={!configured || pending}
          type="submit"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
