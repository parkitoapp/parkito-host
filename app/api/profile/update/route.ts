"use server"

import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Body = {
  phone: string | null
  iban: string | null
}

export async function POST(req: Request) {
  try {
    const [supabaseAdmin, supabase] = await Promise.all([
      (async () => getSupabaseAdmin())(),
      createClient(),
    ])

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phone, iban }: Body = await req.json()

    // 1) Update phone in auth.users.raw_user_meta_data
    if (phone) {
      const { error: phoneError } =
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          // Merge with existing metadata to mimic jsonb_set on raw_user_meta_data
          user_metadata: {
            ...(user.user_metadata ?? {}),
            phone,
          },
        })

      if (phoneError) {
        console.error("[profile/update] Phone update error:", phoneError)
        return NextResponse.json(
          { error: "Errore aggiornamento telefono" },
          { status: 500 },
        )
      }
    }

    // 2) Call edge function to update/create host with new IBAN (if provided)
    if (iban) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

      if (!supabaseUrl || !anonKey) {
        console.error("[profile/update] Missing Supabase env for edge function")
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 },
        )
      }

      const fnUrl = `${supabaseUrl}/functions/v1/create-host`

      const edgeRes = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          iban,
        }),
      })

      if (!edgeRes.ok) {
        const text = await edgeRes.text()
        console.error("[profile/update] Edge function error:", text)
        return NextResponse.json(
          { error: "Errore aggiornamento IBAN" },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[profile/update] Unexpected error:", error)
    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 },
    )
  }
}

