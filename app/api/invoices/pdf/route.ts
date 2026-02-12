import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  hostId: string;
  month: string; // "YYYY-MM"
};

export async function POST(req: Request) {
  try {
    const { hostId, month }: Body = await req.json();

    if (!hostId || !month) {
      return NextResponse.json(
        { error: "Missing hostId or month" },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const anonKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error("[invoices/pdf] Missing Supabase env for edge function");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Function folder is "pdf-reservations-summary" (plural)
    const baseFnUrl = `${supabaseUrl}/functions/v1/pdf-reservations-summary`;
    const url = new URL(baseFnUrl);
    url.searchParams.set("month", month);
    url.searchParams.set("host_id", hostId);
    
    // Try to get the current user's access token so the edge function
    // can run in the context of the authenticated host.
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      apikey: anonKey,
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const edgeRes = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    const text = await edgeRes.text().catch(() => "");

    if (!edgeRes.ok) {
      console.error(
        "[invoices/pdf] Edge function error:",
        "status=",
        edgeRes.status,
        "body=",
        text
      );
      return NextResponse.json(
        {
          error: "Errore nella generazione della fattura",
          edgeStatus: edgeRes.status,
          edgeBody: text || null,
        },
        { status: edgeRes.status || 500 }
      );
    }

    // Edge returns JSON with { html }
    let html = "";
    try {
      const parsed = JSON.parse(text) as { html?: string; [key: string]: unknown };
      html =
        typeof parsed.html === "string"
          ? parsed.html
          : JSON.stringify(parsed, null, 2);
    } catch {
      html = text;
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[invoices/pdf] Unexpected error:", error);
    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}

