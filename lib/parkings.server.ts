import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  DayState,
  Parking,
  ParkingDayInfo,
  ParkingFullInfo,
  PktAvailability,
  PktReservation,
} from "@/types";

function normalizeDate(d: string | Date | null | undefined): string {
  if (d == null) return "";
  return typeof d === "string"
    ? d.slice(0, 10)
    : (d as Date).toISOString().slice(0, 10);
}

/** Group availability rows by calendar date (using start_datetime). Each row = one time slot; multiple rows per day = multiple slots. */
function groupAvailabilityByDate(
  rows: PktAvailability[]
): Map<string, PktAvailability[]> {
  const byDate = new Map<string, PktAvailability[]>();
  for (const row of rows) {
    const date = normalizeDate(row?.start_datetime);
    if (!date) continue;
    const list = byDate.get(date) ?? [];
    list.push(row);
    byDate.set(date, list);
  }
  return byDate;
}

/**
 * Derive calendar day state from pkt_availability records for that date.
 * - 0 records → default (base price)
 * - All is_available false → unavailable
 * - 1 record + is_available → default or custom-price if hourly_price overrides parking default
 * - 1 record + !is_available → unavailable
 * - Multiple records (time slots): any !is_available → time-slot-unavailable, else time-slots
 */
function availabilityToDays(
  rows: PktAvailability[],
  parking: Parking
): ParkingDayInfo[] {
  const byDate = groupAvailabilityByDate(rows);
  const dates = Array.from(byDate.keys()).sort();
  const parkingDefaultPrice =
    (parking as { base_hourly_price?: number | null }).base_hourly_price ??
    null;

  return dates.map((date) => {
    const slots = byDate.get(date)!;
    const allUnavailable = slots.every((s) => s?.is_available === false);
    const anyUnavailable = slots.some((s) => s?.is_available === false);

    let state: DayState;
    if (allUnavailable) {
      state = "unavailable";
    } else if (slots.length > 1) {
      state = anyUnavailable ? "time-slot-unavailable" : "time-slots";
    } else {
      // single record
      if (!slots[0]?.is_available) state = "unavailable";
      else if (
        parkingDefaultPrice != null &&
        slots[0]?.hourly_price != null &&
        slots[0].hourly_price !== parkingDefaultPrice
      ) {
        state = "custom-price";
      } else {
        state = "default";
      }
    }

    const price = slots[0]?.hourly_price ?? parkingDefaultPrice ?? undefined;
    return { date, state, price };
  });
}

/**
 * Server-side fetch of parkings for a host. Use in Server Components or layout
 * to pass initial parkings and avoid client-only race.
 */
export async function getParkingsByHostId(hostId: string): Promise<Parking[]> {
  const supabase = await createClient();
  const { data: parkings, error } = await supabase
    .from("pkt_parking")
    .select("*")
    .eq("host_id", hostId);

  if (error) {
    console.error("Error fetching parkings (server):", error.message);
    return [];
  }

  return (parkings ?? []) as Parking[];
}

/** Coerce id for DB: use number when it's a numeric string (integer PK), else keep string (UUID). */
function coerceParkingId(id: string): string | number {
  return /^\d+$/.test(id) ? parseInt(id, 10) : id;
}

/**
 * Fetches everything for one parking in one place: parking info (pkt_parking),
 * availability (pkt_availability by parking_id), reservations (pkt_reservations).
 * Use parking, availability, and reservations where needed. Calendar uses the derived `days` array.
 * Request frequency is limited by client-side React Query staleTime (7 days).
 */
export async function getParkingFullInfo(
  parkingId: string
): Promise<ParkingFullInfo | null> {
  const idParam = coerceParkingId(parkingId);
  try {
    const supabase = await createClient();

    const parkingRes = await supabase
      .from("pkt_parking")
      .select("*")
      .eq("id", idParam)
      .single();

    if (parkingRes.error || !parkingRes.data) {
      console.error(
        "Error fetching parking by id (server):",
        parkingRes.error?.message
      );
      return null;
    }
    const parking = parkingRes.data as Parking;

    const availabilityRes = await supabase
      .from("pkt_availability")
      .select(
        "id, parking_id, start_datetime, end_datetime, is_available, hourly_price, recurrence_rule"
      )
      .eq("parking_id", idParam)
      .order("start_datetime", { ascending: true });
    let availability: PktAvailability[] = [];
    if (availabilityRes.error) {
      console.warn(
        "Error fetching pkt_availability (server):",
        availabilityRes.error?.message
      );
    } else {
      availability = (availabilityRes.data ?? []) as PktAvailability[];
    }

    // Use admin client for reservations: RLS on pkt_reservations typically allows
    // drivers to see only their own rows. Hosts need to see ALL reservations for their parking.
    const admin = getSupabaseAdmin();
    let reservations: PktReservation[] = [];
    const reservationsRes = await admin
      .from("pkt_reservations")
      .select("*")
      .eq("parking_id", idParam);
    if (reservationsRes.error) {
      console.warn(
        "Error fetching pkt_reservations (server):",
        reservationsRes.error?.message
      );
    } else {
      reservations = (reservationsRes.data ?? []) as PktReservation[];
    }

    // Enrich reservations with driver name/surname using the admin client (bypasses RLS on pkt_driver).
    if (reservations.length > 0) {
      // Support both snake_case (driver_id) and camelCase (driverId) from Supabase
      const rawDriverIds = reservations.map(
        (r) => (r as Record<string, unknown>).driver_id ?? (r as Record<string, unknown>).driverId
      ).filter(Boolean);
      const driverIds = [...new Set(rawDriverIds.map((id) => String(id)))];

      if (driverIds.length > 0) {
        const { data: drivers, error: driversError } = await admin
          .from("pkt_driver")
          .select("id, name, surname")
          .in("id", driverIds);

        if (driversError) {
          console.error(
            "Error fetching drivers (admin) for reservations:",
            driversError.message
          );
        } else {
          const driverMap = new Map<
            string,
            { name: string | null; surname: string | null }
          >();

          for (const d of drivers ?? []) {
            const row = d as { id: string | number; name?: string | null; surname?: string | null };
            const id = String(row.id);
            driverMap.set(id, {
              name: row.name ?? null,
              surname: row.surname ?? null,
            });
          }

          reservations = reservations.map((r) => {
            const rid = String((r as Record<string, unknown>).driver_id ?? (r as Record<string, unknown>).driverId ?? "");
            return {
              ...r,
              driver: rid ? (driverMap.get(rid) ?? null) : null,
            };
          }) as PktReservation[];
        }
      }
    }

    const days = availabilityToDays(availability, parking);

    return { parking, availability, reservations, days };
  } catch (err) {
    console.error("[getParkingFullInfo] id:", parkingId, err);
    throw err;
  }
}

/**
 * Fetch minimal driver info (name, surname) for a given driver_id.
 * Uses the Supabase admin client (service role) to bypass RLS safely on the server.
 */
export async function getDriverInfoById(driverId: string) {
  if (!driverId) return null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("pkt_driver")
      .select("id, name, surname")
      .eq("id", driverId)
      .single();

    if (error || !data) {
      console.error("Error fetching driver by id (admin):", error?.message);
      return null;
    }

    return {
      id: data.id as string,
      name: (data as { name: string | null }).name ?? null,
      surname: (data as { surname: string | null }).surname ?? null,
    };
  } catch (err) {
    console.error("[getDriverInfoById] driverId:", driverId, err);
    return null;
  }
}

/** @deprecated Use getParkingFullInfo */
export async function getParkingWithAvailabilityById(parkingId: string) {
  return getParkingFullInfo(parkingId);
}
