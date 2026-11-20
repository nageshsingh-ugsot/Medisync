import "server-only";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  email: string;
};

export async function getAuthState(): Promise<{
  user: AuthenticatedUser | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: "Supabase is not configured. Add its URL and anon key to .env.local.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return {
      user: null,
      error: "We couldn't read your sign-in session. Please sign in again.",
    };
  }
  if (!sessionData.session) return { user: null, error: null };

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return {
      user: null,
      error: "We couldn't verify your session. Check your connection and try again.",
    };
  }

  if (!data.user) {
    return { user: null, error: null };
  }

  return {
    user: { email: data.user.email ?? "Signed-in user" },
    error: null,
  };
}
