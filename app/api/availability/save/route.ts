import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  computeDatesFromRipetizione,
  type RipetizioneValue,
} from "@/lib/availability-dates";

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
    let {
      parking_id,
      dates: datesInput,
      ripetizione,
      selectedDateStr,
      rangeStart,
      rangeEnd,
      availabilityType,
      startTime,
      endTime,
      hourly_price,
    } = body;

    if (!parking_id || !availabilityType) {
      return NextResponse.json(
        { error: "Missing parking_id or availabilityType" },
        { status: 400 }
      );
    }

    const validTypes = ["ALWAYS_AVAILABLE", "TIME_SLOT", "UNAVAILABLE"];
    if (!validTypes.includes(availabilityType)) {
      return NextResponse.json(
        { error: `Invalid availabilityType: ${availabilityType}` },
        { status: 400 }
      );
    }

    let dates: string[];
    if (Array.isArray(datesInput) && datesInput.length > 0) {
      dates = datesInput;
    } else if (ripetizione && selectedDateStr) {
      dates = computeDatesFromRipetizione(
        ripetizione as RipetizioneValue,
        selectedDateStr,
        rangeStart,
        rangeEnd
      );
    } else {
      return NextResponse.json(
        { error: "Missing dates or (ripetizione + selectedDateStr)" },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      parking_id,
      dates,
      availabilityType,
      hourly_price: hourly_price ?? null,
    };

    if (availabilityType === "TIME_SLOT" || availabilityType === "UNAVAILABLE") {
      if (startTime && endTime) {
        payload.startTime = startTime;
        payload.endTime = endTime;
      } else {
        payload.startTime = { hour: 0, minute: 0 };
        payload.endTime = { hour: 23, minute: 59 };
      }
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/save-availability`, {
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
        { error: errPayload.error ?? "save-availability failed" },
        { status: res.status }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { results: [] };
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[API /api/availability/save]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to save availability", details: message },
      { status: 500 }
    );
  }
}
