import { NextResponse } from "next/server";

const BASE_URL = "https://places.googleapis.com/v1/places";

export async function GET(request: Request) {
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "Google API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id");
  const sessionToken = searchParams.get("sessiontoken") ?? "";

  if (!placeId) {
    return NextResponse.json(
      { error: "Place ID is required" },
      { status: 400 }
    );
  }

  try {
    const url = `${BASE_URL}/${encodeURIComponent(placeId)}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "id,location,addressComponents,formattedAddress",
    };
    if (sessionToken) headers["X-Goog-Session-Token"] = sessionToken;

    const response = await fetch(`${url}?languageCode=it&regionCode=it`, {
      method: "GET",
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: json.error?.message ?? json.status ?? "Place details failed",
        },
        { status: response.status >= 500 ? 500 : 400 }
      );
    }

    return NextResponse.json(json);
  } catch (err) {
    console.error("[API /api/places/details]", err);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
