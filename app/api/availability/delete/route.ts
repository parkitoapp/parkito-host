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

    const body = await request.json().catch(() => ({}));
    const { availability_id, availability_ids } = body as {
      availability_id?: number | string;
      availability_ids?: Array<number | string>;
    };

    const idsToDelete: Array<number | string> =
      Array.isArray(availability_ids) && availability_ids.length > 0
        ? availability_ids
        : availability_id != null
          ? [availability_id]
          : [];

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: "Missing availability_id or availability_ids" },
        { status: 400 }
      );
    }

    const callDeleteOne = async (id: number | string) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ availability_id: id }),
      });
      const text = await res.text();
      if (!res.ok && res.status !== 404) {
        let errPayload: { error?: string } = {};
        try {
          errPayload = JSON.parse(text);
        } catch {
          errPayload = { error: text || "Edge function error" };
        }
        throw new Error(errPayload.error ?? "delete-availability failed");
      }
      return text;
    };

    await Promise.all(idsToDelete.map((id) => callDeleteOne(id)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /api/availability/delete]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to delete availability", details: message },
      { status: 500 }
    );
  }
}
