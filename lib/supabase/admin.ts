import { createClient } from '@supabase/supabase-js'

/**
 * Admin client that bypasses RLS using the service role key.
 * ONLY use this for server-side operations that need to bypass RLS.
 * NEVER expose this client or its key to the browser.
 */
export function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL
    const serviceRoleKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_PROJECT_URL')
    }

    if (!serviceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY - add it to your .env.local file')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

