import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  hostId: string;
};

export async function POST(req: Request) {
  try {
    const { hostId }: Body = await req.json();

    if (!hostId) {
      return NextResponse.json(
        { error: "Missing hostId" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // 1) Get all parkings for this host
    const { data: parkings, error: parkingsError } = await admin
      .from("pkt_parking")
      .select("id")
      .eq("host_id", hostId);

    if (parkingsError) {
      console.error("[host-invoice-months] Error fetching parkings:", parkingsError);
      return NextResponse.json(
        { error: "Errore nel caricamento dei parcheggi" },
        { status: 500 }
      );
    }

    if (!parkings || parkings.length === 0) {
      return NextResponse.json({ months: [] });
    }

    const parkingIds = parkings
      .map((p) => (p as { id?: string | number }).id)
      .filter((id): id is string | number => id !== undefined && id !== null);

    if (parkingIds.length === 0) {
      return NextResponse.json({ months: [] });
    }

    // 2) Get all CONFIRMED reservations for these parkings and compute distinct months
    //    aligned with the edge function logic (uses end_datetime and status = 'confirmed').
    const { data: reservations, error: reservationsError } = await admin
      .from("pkt_reservations")
      .select("end_datetime, status")
      .in("parking_id", parkingIds)
      .eq("status", "confirmed");

    if (reservationsError) {
      console.error("[host-invoice-months] Error fetching reservations:", reservationsError);
      return NextResponse.json(
        { error: "Errore nel caricamento delle prenotazioni" },
        { status: 500 }
      );
    }

    const monthSet = new Set<string>();

    for (const r of reservations ?? []) {
      const raw = (r as { end_datetime?: string | Date }).end_datetime;
      if (!raw) continue;

      const d = typeof raw === "string" ? new Date(raw) : (raw as Date);
      if (Number.isNaN(d.getTime())) continue;

      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      monthSet.add(`${year}-${month}`);
    }

    // Only consider fully-ended months (strictly before the current month)
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = String(now.getUTCMonth() + 1).padStart(2, "0");
    const currentYearMonth = `${currentYear}-${currentMonth}`;

    const pastMonths = Array.from(monthSet).filter((m) => m < currentYearMonth);

    // Sort descending (latest first) and keep only the last 4 months
    const months = pastMonths
      .sort((a, b) => (a === b ? 0 : a > b ? -1 : 1))
      .slice(0, 4);

    return NextResponse.json({ months });
  } catch (error) {
    console.error("[host-invoice-months] Unexpected error:", error);
    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}

