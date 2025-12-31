'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SupaSchema } from '@/types'

let client: SupabaseClient<SupaSchema> | null = null;

function getEnvVariables() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabasePublishableKey) {
        throw new Error('Missing Supabase environment variables')
    }
    return { supabaseUrl, supabasePublishableKey }
}


export function getSupabaseBrowserClient(): SupabaseClient<SupaSchema> {
    if (client) return client;

    const { supabaseUrl, supabasePublishableKey } = getEnvVariables();
    client = createBrowserClient<SupaSchema>(supabaseUrl, supabasePublishableKey);
    return client;
}