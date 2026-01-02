"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { DriverData, HostData } from "@/types"

/**
 * Client-side function to get driver data for a given user ID
 * Use this in Client Components
 */
export async function getDriverData(userId: string): Promise<DriverData | null> {
    const supabase = getSupabaseBrowserClient()

    const { data: driver, error } = await supabase
        .from("pkt_driver")
        .select("*")
        .eq("id", userId)
        .single()

    if (error) {
        console.error("Error fetching driver data:", error.message)
        return null
    }

    return driver
}

/**
 * Client-side function to check if a user is a host
 * Returns host data if the user's driver_id exists in pkt_host table
 */
export async function getHostData(userId: string): Promise<HostData | null> {
    const supabase = getSupabaseBrowserClient()

    const { data: host, error } = await supabase
        .from("pkt_host")
        .select("*")
        .eq("driver_id", userId)
        .single()

    if (error) {
        // Not an error if host doesn't exist - just means user is not a host
        if (error.code !== "PGRST116") {
            console.error("Error fetching host data:", error.message)
        }
        return null
    }

    return host
}

