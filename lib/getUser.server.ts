import { createClient } from "@/lib/supabase/server"
import type { UserWithDriver } from "@/types"

/**
 * Server-side function to get the authenticated user and their driver/host data
 * Use this in Server Components, layouts, or API routes
 */
export async function getUser(): Promise<UserWithDriver | null> {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    // Fetch driver data from pkt_driver table
    const { data: driver, error: driverError } = await supabase
        .from("pkt_driver")
        .select("*")
        .eq("id", user.id)
        .single()

    if (driverError && driverError.code !== "PGRST116") {
        console.error("Error fetching driver data:", driverError.message)
    }

    // Fetch host data from pkt_host table
    const { data: host, error: hostError } = await supabase
        .from("pkt_host")
        .select("*")
        .eq("driver_id", user.id)
        .single()

    if (hostError && hostError.code !== "PGRST116") {
        console.error("Error fetching host data:", hostError.message)
    }

    return {
        id: user.id,
        email: user.email ?? null,
        driver: driver ?? null,
        host: host ?? null,
    }
}

