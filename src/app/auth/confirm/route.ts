import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

function resetLinkError(request: NextRequest) {
  const url = new URL("/forgot-password", request.url);
  url.searchParams.set("error", "invalid-link");
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!isSupabaseConfigured() || !code) return resetLinkError(request);

  const supabase = await createSupabaseServerClient(true);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return resetLinkError(request);

  return NextResponse.redirect(new URL("/update-password", request.url));
}
