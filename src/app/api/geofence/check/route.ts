import { NextResponse } from "next/server";
import { z } from "zod";
import { isPointInsideGeofence } from "@/lib/geofence-service";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:geofence/check");

// PostGIS / spatial queries require a live DB connection, so force the Node
// runtime and skip any static optimisation.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Request body schema. Coordinates are validated against real-world bounds. */
const checkSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = checkSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const inside = await isPointInsideGeofence(parsed.data);
    return NextResponse.json({ inside });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error("Geofence check failed", { message });
    return NextResponse.json(
      { error: "Geofence check failed. Is PostGIS set up and seeded?" },
      { status: 500 },
    );
  }
}

/** Reject everything that isn't a POST with a clear 405. */
export function GET(): NextResponse {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with { lat, lng }." },
    { status: 405 },
  );
}
