-- FEATURE 2 — PostGIS geofence schema.

-- 1. Enable the PostGIS extension (provides geometry types & spatial functions).
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Geofence table. `boundary` is a WGS84 (SRID 4326) polygon geometry.
CREATE TABLE "geofences" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "boundary" geometry(Polygon, 4326) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

-- 3. Spatial index so ST_Contains lookups stay fast as the table grows.
CREATE INDEX "geofences_boundary_idx" ON "geofences" USING GIST ("boundary");
