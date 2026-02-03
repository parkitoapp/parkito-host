import { NextResponse } from "next/server";
import { getParkingFullInfo } from "@/lib/parkings.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing parking id" }, { status: 400 });
    }
    const data = await getParkingFullInfo(id);
    if (!data) {
      return NextResponse.json({ error: "Parking not found" }, { status: 404 });
    }
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=604800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[API /api/parking/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to load parking info", details: message },
      { status: 500 }
    );
  }
}
