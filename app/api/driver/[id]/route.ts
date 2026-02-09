import { NextResponse } from "next/server";
import { getDriverInfoById } from "@/lib/parkings.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing driver id" }, { status: 400 });
    }
    const driver = await getDriverInfoById(id);
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }
    return NextResponse.json(driver);
  } catch (err) {
    console.error("[API /api/driver/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to load driver", details: message },
      { status: 500 }
    );
  }
}
