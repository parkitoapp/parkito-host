import { createClient } from "@/lib/supabase/server";
import type { Parking } from "@/types";

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
