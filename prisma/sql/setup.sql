-- ============================================================================
-- Manual PostGIS setup (FEATURE 2)
-- ----------------------------------------------------------------------------
-- This file lets you set up the geofence schema + seed data WITHOUT Prisma,
-- e.g. straight from `psql`. It mirrors what `prisma migrate` + `prisma db seed`
-- produce.
--
-- Usage:
--   createdb screening_demo
--   psql -d screening_demo -f prisma/sql/setup.sql
-- ============================================================================

-- 1. Enable PostGIS.
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Table.
CREATE TABLE IF NOT EXISTS geofences (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    boundary   geometry(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Spatial index.
CREATE INDEX IF NOT EXISTS geofences_boundary_idx
    ON geofences USING GIST (boundary);

-- 4. Seed one hardcoded polygon (Lower Manhattan, SRID 4326, lng/lat order).
TRUNCATE TABLE geofences RESTART IDENTITY;

INSERT INTO geofences (name, boundary)
VALUES (
    'Lower Manhattan',
    ST_SetSRID(
        ST_GeomFromText(
            'POLYGON((-74.0200 40.7000, -73.9900 40.7000, -73.9900 40.7200, -74.0200 40.7200, -74.0200 40.7000))'
        ),
        4326
    )
);

-- 5. Sample checks.
--   Expect inside = true:
SELECT ST_Contains(boundary, ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)) AS inside
FROM geofences WHERE name = 'Lower Manhattan';
--   Expect inside = false (San Francisco):
SELECT ST_Contains(boundary, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)) AS inside
FROM geofences WHERE name = 'Lower Manhattan';
