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

    const {
      id,
      address,
      in_ztl,
      accepts_gpl,
      spots_count,
      base_hourly_price,
      weight,
      floors_count,
      dimensions,
      perks,
      parking_type_id,
      vehicle_type_id,
    } = body as {
      id?: string | number;
      address?: {
        street?: string;
        city?: string;
        postalCode?: string;
        lat?: number;
        lng?: number;
      };
      in_ztl?: boolean;
      accepts_gpl?: boolean;
      spots_count?: number;
      base_hourly_price?: number;
      weight?: string | number;
      floors_count?: number;
      dimensions?: unknown;
      perks?: unknown;
      parking_type_id?: number;
      vehicle_type_id?: number;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Missing parking id" },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      id,
      address,
      in_ztl,
      accepts_gpl,
      spots_count,
      base_hourly_price,
      weight,
      floors_count,
      dimensions,
      perks,
      parking_type_id,
      vehicle_type_id,
    };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/update-parking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      let errPayload: { error?: string } = {};
      try {
        errPayload = JSON.parse(text);
      } catch {
        errPayload = { error: text || "Edge function error" };
      }
      return NextResponse.json(
        { error: errPayload.error ?? "update-parking failed" },
        { status: res.status },
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
    console.error("[API /api/parking/update]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to update parking", details: message },
      { status: 500 },
    );
  }
}

