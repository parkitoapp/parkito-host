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
    const { parking_id, base_hourly_price, price } = body as {
      parking_id?: string | number;
      base_hourly_price?: number | string;
      price?: number | string;
    };

    if (!parking_id) {
      return NextResponse.json(
        { error: "Missing parking_id" },
        { status: 400 },
      );
    }

    const rawPrice = price ?? base_hourly_price;
    const numericPrice =
      typeof rawPrice === "number"
        ? rawPrice
        : typeof rawPrice === "string"
          ? Number(rawPrice)
          : NaN;

    if (!Number.isFinite(numericPrice)) {
      return NextResponse.json(
        { error: "Missing or invalid base_hourly_price" },
        { status: 400 },
      );
    }

    const payload = {
      parking_id,
      price: numericPrice,
    };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/update-hourly-price`, {
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
        { error: errPayload.error ?? "update-hourly-price failed" },
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
    console.error("[API /api/parking/update-hourly-price]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to update hourly price", details: message },
      { status: 500 },
    );
  }
}

