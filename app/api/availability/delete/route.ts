import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
if (!SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_PROJECT_URL is not set");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { availability_id } = body;

    if (!availability_id) {
      return NextResponse.json(
        { error: "Missing availability_id" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/delete-availability`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ availability_id }),
      }
    );

    const text = await res.text();
    if (!res.ok) {
      // 404 = already deleted or not found; treat as success so bulk save can continue
      if (res.status === 404) {
        return NextResponse.json({ success: true, deleted: false });
      }
      let errPayload: { error?: string } = {};
      try {
        errPayload = JSON.parse(text);
      } catch {
        errPayload = { error: text || "Edge function error" };
      }
      return NextResponse.json(
        { error: errPayload.error ?? "delete-availability failed" },
        { status: res.status }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true };
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[API /api/availability/delete]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to delete availability", details: message },
      { status: 500 }
    );
  }
}
