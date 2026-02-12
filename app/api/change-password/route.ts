"use server";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  password: string;
};

export async function POST(req: Request) {
  try {
    const [supabase, admin] = await Promise.all([
      createClient(),
      (async () => getSupabaseAdmin())(),
    ]);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sessione non valida. Esegui nuovamente l'accesso." },
        { status: 401 }
      );
    }

    const { password }: Body = await req.json();

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (error) {
      console.error("[change-password] Error updating password:", error);
      return NextResponse.json(
        {
          error:
            error.message ?? "Errore durante l'aggiornamento della password.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[change-password] Unexpected error:", error);
    return NextResponse.json(
      { error: "Errore interno. Riprova più tardi." },
      { status: 500 }
    );
  }
}
