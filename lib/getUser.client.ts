"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DriverData, HostData } from "@/types";

/**
 * Client-side function to get driver data for a given user ID
 * Use this in Client Components
 */
export async function getDriverData(
  userId: string
): Promise<DriverData | null> {
  const supabase = getSupabaseBrowserClient();

  const { data: driver, error } = await supabase
    .from("pkt_driver")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching driver data:", error.message);
    return null;
  }

  return driver;
}

/**
 * Client-side function to check if a user is a host
 * Returns host data if the user's driver_id exists in pkt_host table
 */
export async function getHostData(userId: string): Promise<HostData | null> {
  const supabase = getSupabaseBrowserClient();

  const { data: host, error } = await supabase
    .from("pkt_host")
    .select("*")
    .eq("driver_id", userId)
    .single();

  if (error) {
    // Not an error if host doesn't exist - just means user is not a host
    if (error.code !== "PGRST116") {
      console.error("Error fetching host data:", error.message);
    }
    return null;
  }

  return host;
}

/**
 * Client-side function to fetch all parkings for a given host ID
 */
export async function fetchParkingByHostId(hostId: string) {
  const supabase = getSupabaseBrowserClient();

  const { data: parkings, error } = await supabase
    .from("pkt_parking")
    .select("*")
    .eq("host_id", hostId);

  if (error) {
    // React Query and other consumers may cancel in-flight requests using
    // an AbortSignal. In that case we don't want to treat it as a real
    // application error or spam the console.
    const anyError = error as unknown as { name?: string; message?: string };
    if (anyError?.name === "AbortError") {
      console.debug("Parkings fetch aborted (likely due to component unmount or query cancellation).");
      return [];
    }

    console.error("Error fetching parkings:", anyError?.message ?? error);
    return [];
  }

  return parkings || [];
}
