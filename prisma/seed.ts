import { PrismaClient } from "@prisma/client";

/**
 * Seed script for FEATURE 2.
 *
 * Inserts a single hardcoded polygon geofence roughly covering Lower Manhattan
 * (NYC). The well-known test point { lat: 40.7128, lng: -74.0060 } falls inside
 * this polygon; a point such as { lat: 37.7749, lng: -122.4194 } (San Francisco)
 * falls outside.
 *
 * Run with: `npm run db:seed` (or automatically via `prisma migrate dev`).
 */
const prisma = new PrismaClient();

// Polygon vertices in (lng lat) order — PostGIS expects longitude first.
// A simple rectangle around Lower Manhattan.
const LOWER_MANHATTAN_WKT =
  "POLYGON((" +
  "-74.0200 40.7000, " +
  "-73.9900 40.7000, " +
  "-73.9900 40.7200, " +
  "-74.0200 40.7200, " +
  "-74.0200 40.7000" +
  "))";

async function main(): Promise<void> {
  // Idempotent reseed: clear existing rows so repeated runs stay clean.
  await prisma.$executeRaw`TRUNCATE TABLE geofences RESTART IDENTITY;`;

  await prisma.$executeRaw`
    INSERT INTO geofences (name, boundary)
    VALUES (
      'Lower Manhattan',
      ST_SetSRID(ST_GeomFromText(${LOWER_MANHATTAN_WKT}), 4326)
    );
  `;

  const rows = await prisma.$queryRaw<Array<{ id: number; name: string }>>`
    SELECT id, name FROM geofences ORDER BY id;
  `;

  // eslint-disable-next-line no-console
  console.log("Seeded geofences:", rows);

  // ---- Sample test data (sanity check the spatial query) -------------------
  const samples: Array<{ label: string; lat: number; lng: number }> = [
    { label: "NYC City Hall (inside)", lat: 40.7128, lng: -74.006 },
    { label: "San Francisco (outside)", lat: 37.7749, lng: -122.4194 },
    { label: "Null Island (outside)", lat: 0, lng: 0 },
  ];

  for (const s of samples) {
    const result = await prisma.$queryRaw<Array<{ inside: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM geofences
        WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint(${s.lng}, ${s.lat}), 4326))
      ) AS inside;
    `;
    // eslint-disable-next-line no-console
    console.log(`  ${s.label}: inside = ${result[0]?.inside ?? false}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
