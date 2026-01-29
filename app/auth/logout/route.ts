import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
