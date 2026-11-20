"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string;
  message: string;
};

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readRawString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured. Add its URL and anon key to .env.local.",
      message: "",
    };
  }

  const email = readString(formData, "email");
  const password = readRawString(formData, "password");
  if (!email || !password) {
    return { error: "Enter your email and password.", message: "" };
  }

  const supabase = await createSupabaseServerClient(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message, message: "" };

  redirect("/");
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured. Add its URL and anon key to .env.local.",
      message: "",
    };
  }

  const email = readString(formData, "email");
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "Enter a valid email address.", message: "" };
  }

  const requestHeaders = await headers();
  const originHeader = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  let origin: URL;
  try {
    if (!originHeader) throw new Error("Missing request origin.");
    origin = new URL(originHeader);
  } catch {
    return {
      error: "Could not determine this app's address. Reload the page and try again.",
      message: "",
    };
  }
  if (
    (origin.protocol !== "http:" && origin.protocol !== "https:") ||
    (host && origin.host !== host)
  ) {
    return {
      error: "The password reset request came from an unexpected address.",
      message: "",
    };
  }

  const redirectTo = new URL("/auth/confirm", origin);
  const supabase = await createSupabaseServerClient(true);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo.toString(),
  });

  if (error) {
    return {
      error: "We couldn't send a reset email. Check the address and try again.",
      message: "",
    };
  }

  return {
    error: "",
    message:
      "If an account exists for that email, a password reset link has been sent.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured. Add its URL and anon key to .env.local.",
      message: "",
    };
  }

  const password = readRawString(formData, "password");
  const confirmPassword = readRawString(formData, "confirmPassword");
  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters.", message: "" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", message: "" };
  }

  const supabase = await createSupabaseServerClient(true);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error: "We couldn't update the password. Request a fresh reset link and try again.",
      message: "",
    };
  }

  redirect("/login?passwordUpdated=1");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured. Add its URL and anon key to .env.local.",
      message: "",
    };
  }

  const ownerName = readString(formData, "ownerName");
  const phone = readString(formData, "whatsapp").replace(/\D/g, "");
  const pharmacyName = readString(formData, "pharmacyName");
  const area = readString(formData, "area");
  const email = readString(formData, "email");
  const password = readRawString(formData, "password");
  const confirmPassword = readRawString(formData, "confirmPassword");

  if (!ownerName || !pharmacyName || !area || !email) {
    return { error: "Complete all pharmacy and account fields.", message: "" };
  }
  if (ownerName.length > 120 || pharmacyName.length > 160 || area.length > 160) {
    return { error: "Check the name, pharmacy name, and area lengths.", message: "" };
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return { error: "Enter a valid 10-digit Indian WhatsApp number.", message: "" };
  }
  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters.", message: "" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", message: "" };
  }

  const supabase = await createSupabaseServerClient(true);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        owner_name: ownerName,
        whatsapp: `91${phone}`,
        pharmacy_name: pharmacyName,
        area,
      },
    },
  });

  if (error) return { error: error.message, message: "" };
  if (data.session) redirect("/");

  return {
    error: "",
    message: "Account created. Check your email to confirm it, then sign in.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient(true);
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Could not sign out. Please try again.");
  redirect("/login");
}
