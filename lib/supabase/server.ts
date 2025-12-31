import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getEnvVariables() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabasePublishableKey) {
        throw new Error('Missing Supabase environment variables')
    }
    return { supabaseUrl, supabasePublishableKey }
}

export async function createClient() {
    const { supabaseUrl, supabasePublishableKey } = getEnvVariables()
    const cookieStore = await cookies()

    return createServerClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch (error) {
                        console.error('Error setting cookies:', error)
                    }
                },
            },
        }
    )
}