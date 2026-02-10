import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function handleLogout(request: Request) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
  }

  const url = new URL(request.url);
  const loginUrl = new URL("/login", url.origin);

  return NextResponse.redirect(loginUrl, {
    status: 303,
  });
}

export async function POST(request: Request) {
  return handleLogout(request);
}

// Allow full-page navigation via GET /auth/logout as well.
export async function GET(request: Request) {
  return handleLogout(request);
}
