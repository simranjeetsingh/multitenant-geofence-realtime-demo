import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const log = createLogger("geofence-service");

/** A geographic point in WGS84 (SRID 4326). */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Shape returned by the PostGIS containment query. */
interface ContainsRow {
  inside: boolean;
}

/**
 * Determine whether a point falls inside ANY stored geofence polygon.
 *
 * Spatial logic runs entirely in PostgreSQL/PostGIS via `$queryRaw`:
 *   - ST_MakePoint(lng, lat)  builds a point geometry (note: lng first!).
 *   - ST_SetSRID(..., 4326)   tags it with the WGS84 spatial reference.
 *   - ST_Contains(poly, pt)   tests polygon containment.
 *
 * Parameters are passed through Prisma's tagged-template binding (`${}`), so the
 * query is fully parameterised and not vulnerable to SQL injection.
 */
export async function isPointInsideGeofence({ lat, lng }: LatLng): Promise<boolean> {
  const rows = await prisma.$queryRaw<ContainsRow[]>`
    SELECT EXISTS (
      SELECT 1
      FROM geofences
      WHERE ST_Contains(
        boundary,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )
    ) AS inside;
  `;

  const inside = rows[0]?.inside ?? false;
  log.info("Geofence check", { lat, lng, inside });
  return inside;
}
