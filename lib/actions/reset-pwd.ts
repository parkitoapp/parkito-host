"use server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function checkEmailForReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim()

    console.log("[checkEmailForReset] Searching for email:", normalizedEmail)

    // Use admin client to bypass RLS for email lookup
    let supabase
    try {
        supabase = getSupabaseAdmin()
    } catch (error) {
        console.error("[checkEmailForReset] Admin client error:", error)
        return {
            success: false,
            error: "Configurazione server mancante. Contatta l'assistenza.",
            isDriver: false,
            isHost: false
        }
    }

    // Check if email belongs to a driver
    const { data: driver, error: driverError } = await supabase
        .from("pkt_driver")
        .select("id, email")
        .eq("email", normalizedEmail)
        .maybeSingle()

    console.log("[checkEmailForReset] Driver query result:", { driver, driverError })

    if (driverError) {
        console.error("[checkEmailForReset] Error querying driver:", driverError)
        return {
            success: false,
            error: `Errore database: ${driverError.message} (code: ${driverError.code})`,
            isDriver: false,
            isHost: false
        }
    }

    if (!driver) {
        console.log("[checkEmailForReset] No driver found for email:", normalizedEmail)
        return {
            success: false,
            error: "Email non trovata",
            isDriver: false,
            isHost: false
        }
    }

    // Check if driver is a host
    const { data: host, error: hostError } = await supabase
        .from("pkt_host")
        .select("id")
        .eq("driver_id", driver.id)
        .maybeSingle()

    if (hostError) {
        console.error("Error querying host:", hostError)
        return {
            success: false,
            error: hostError.message,
            isDriver: true,
            isHost: false
        }
    }

    if (!host) {
        return {
            success: false,
            error: "Questa email non è associata a un account host",
            isDriver: true,
            isHost: false
        }
    }

    return {
        success: true,
        isDriver: true,
        isHost: true
    }
}

