import { NextResponse } from "next/server";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

export async function GET(request: Request) {
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "Google API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input") ?? "";
  const sessionToken = searchParams.get("sessiontoken") ?? "";

  if (!input || typeof input !== "string" || input.trim().length < 3) {
    return NextResponse.json(
      { error: "Input must be at least 3 characters" },
      { status: 400 }
    );
  }

  try {
    const payload: Record<string, unknown> = {
      input: input.trim(),
      languageCode: "it",
      includedRegionCodes: ["it"],
    };
    if (sessionToken) payload.sessionToken = sessionToken;

    const response = await fetch(AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            json.error?.message ?? json.status ?? "Places autocomplete failed",
        },
        { status: response.status >= 500 ? 500 : 400 }
      );
    }

    return NextResponse.json(json);
  } catch (err) {
    console.error("[API /api/places/autocomplete]", err);
    return NextResponse.json(
      { error: "Failed to fetch place suggestions" },
      { status: 500 }
    );
  }
}
