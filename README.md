# Technical Screening Demo

A self-contained Next.js 14 application demonstrating three production-style
features:

1. **Multi-tenant middleware** — subdomain → tenant resolution via a mock Redis
   store, injected into request headers, with 404s for unknown tenants.
2. **PostGIS geofence API** — `POST /api/geofence/check` runs `ST_Contains`
   against a hardcoded polygon using Prisma `$queryRaw`.
3. **Realtime counter** — a Socket.io server broadcasts a shared counter to all
   connected clients in <500ms.

---

## 1. Project overview

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| Framework    | Next.js 14 (App Router)                     |
| Language     | TypeScript (`strict`, no `any`)             |
| ORM          | Prisma 5                                    |
| Database     | PostgreSQL + PostGIS                         |
| Realtime     | Socket.io 4 (custom Node server)            |
| Cache/Tenant | Mock Redis (in-memory, swappable interface) |
| Validation   | Zod                                         |
| Styling      | TailwindCSS                                 |

Everything runs from **one process / one port** — a custom `server.ts` serves
the Next.js app and the Socket.io server from the same HTTP listener, so Next
middleware and websockets share an origin.

### Project structure

```
.
├── server.ts                     # Custom Next.js + Socket.io HTTP server
├── prisma/
│   ├── schema.prisma             # Geofence model + PostGIS extension
│   ├── seed.ts                   # Seeds the hardcoded polygon + sample checks
│   ├── sql/setup.sql             # Equivalent raw-SQL setup (no Prisma needed)
│   └── migrations/0001_init/     # CREATE EXTENSION postgis + table
└── src/
    ├── middleware.ts             # FEATURE 1 entry point (Next middleware)
    ├── middleware/
    │   └── tenant-resolver.ts    # Subdomain extraction + tenant lookup
    ├── app/
    │   ├── page.tsx              # Homepage — shows resolved tenant
    │   ├── not-found.tsx         # Styled 404 (also used for unknown tenants)
    │   ├── tenant-not-found/     # Internal rewrite target → real 404 status
    │   ├── geofence/page.tsx     # FEATURE 2 UI
    │   ├── counter/page.tsx      # FEATURE 3 UI
    │   └── api/geofence/check/   # FEATURE 2 route handler (Zod validated)
    ├── components/               # TenantInfo, GeofenceChecker, Counter, …
    ├── lib/                      # env, logger, redis(mock), prisma, services
    └── socket/                   # Socket.io server, events contract, store
```

---

## 2. Setup instructions

Prerequisites: **Node 18+** and **PostgreSQL 14+ with the PostGIS extension
available**.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   then edit DATABASE_URL to point at your Postgres instance

# 3. Generate the Prisma client
npm run prisma:generate

# 4. Create the schema + enable PostGIS + seed the polygon
npm run prisma:migrate      # applies migrations (CREATE EXTENSION postgis)
npm run db:seed             # inserts the hardcoded geofence + runs sanity checks

# 5. Start the app (Next.js + Socket.io on one port)
npm run dev
```

Open <http://localhost:3000>.

---

## 3. PostgreSQL setup

If you don't already have Postgres running:

**macOS (Homebrew):**

```bash
brew install postgresql@16 postgis
brew services start postgresql@16
createdb screening_demo
```

**Docker (recommended — bundles PostGIS):**

```bash
docker run --name screening-postgis \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=screening_demo \
  -p 5432:5432 \
  -d postgis/postgis:16-3.4
```

Then set in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/screening_demo?schema=public"
```

---

## 4. PostGIS setup

PostGIS is enabled automatically — the initial migration runs
`CREATE EXTENSION IF NOT EXISTS postgis;` (see
`prisma/migrations/0001_init/migration.sql`), declared in `schema.prisma` via:

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}
```

If you prefer raw SQL (no Prisma), run the equivalent setup directly:

```bash
psql -d screening_demo -f prisma/sql/setup.sql
```

Verify PostGIS is active:

```bash
psql -d screening_demo -c "SELECT PostGIS_Version();"
```

---

## 5. Running locally

```bash
npm run dev      # development (ts-node custom server, HMR via Next)
npm run build    # production build of the Next app
npm run start    # run the production server (Next + Socket.io)
npm run typecheck  # tsc --noEmit (strict)
```

The server logs the URLs to try, including the tenant subdomains.

---

## 6. Testing subdomains (Feature 1)

`*.localhost` subdomains resolve to `127.0.0.1` automatically on modern OSes —
no `/etc/hosts` edits needed.

| URL                              | Result                          |
| -------------------------------- | ------------------------------- |
| `http://tenant1.localhost:3000`  | ✅ Acme Corporation (enterprise) |
| `http://tenant2.localhost:3000`  | ✅ Globex Industries (pro)       |
| `http://tenant3.localhost:3000`  | ✅ Initech LLC (free)            |
| `http://unknown.localhost:3000`  | ❌ HTTP 404 (styled page)        |
| `http://localhost:3000`          | Root host — no tenant context   |

The homepage shows the resolved tenant id/subdomain/name (read from the
`x-tenant-*` headers injected by `src/middleware.ts`). Watch the server console
for structured `tenant-resolver` log lines on each request.

Quick check from the CLI:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: tenant1.localhost" http://localhost:3000   # 200
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: unknown.localhost" http://localhost:3000   # 404
```

---

## 7. Testing the geofence endpoint (Feature 2)

UI: open <http://localhost:3000/geofence> and use the presets, or call the API
directly:

```bash
# Inside the polygon → {"inside":true}
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Content-Type: application/json" \
  -d '{"lat": 40.7128, "lng": -74.0060}'

# Outside the polygon (San Francisco) → {"inside":false}
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Content-Type: application/json" \
  -d '{"lat": 37.7749, "lng": -122.4194}'

# Invalid body → 400 with Zod error details
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Content-Type: application/json" \
  -d '{"lat": 999}'
```

**Sample test data**

| Location               | lat       | lng         | Expected `inside` |
| ---------------------- | --------- | ----------- | ----------------- |
| NYC City Hall          | 40.7128   | -74.0060    | `true`            |
| San Francisco          | 37.7749   | -122.4194   | `false`           |
| Null Island            | 0         | 0           | `false`           |

The geofence is a rectangle over Lower Manhattan:
`POLYGON((-74.0200 40.7000, -73.9900 40.7000, -73.9900 40.7200, -74.0200 40.7200, -74.0200 40.7000))`.

---

## 8. Testing the realtime counter (Feature 3)

1. Open <http://localhost:3000/counter> in **two browser tabs**.
2. Click **+ Increment** (or **− Decrement**) in either tab.
3. Both tabs update near-instantly (typically <100ms on localhost, well under
   the 500ms target).

The connection-status pill (green / amber / red) reflects the live Socket.io
connection. The counter value is owned by the server (`counter-store.ts`) and
re-broadcast to every client on each change, so a newly opened tab immediately
receives the current value.

---

## 9. Screenshots

> Add screenshots / screen recordings here.

| Feature              | Screenshot                                  |
| -------------------- | ------------------------------------------- |
| Tenant resolution    | `docs/screenshots/tenant.png` _(add me)_    |
| Unknown tenant 404   | `docs/screenshots/404.png` _(add me)_       |
| Geofence check       | `docs/screenshots/geofence.png` _(add me)_  |
| Realtime counter     | `docs/screenshots/counter.gif` _(add me)_   |

_(Create a `docs/screenshots/` folder and drop images in to populate this
section.)_

---

## 10. Architecture explanation

### Feature 1 — Multi-tenant middleware

```
Request (Host: tenant1.localhost:3000)
        │
        ▼
src/middleware.ts ──► tenant-resolver.extractSubdomain()  "tenant1"
        │                       │
        │                       ▼
        │            tenant-store.getTenantBySubdomain()
        │                       │  (reads mock Redis hash "tenants")
        │            ┌──────────┴───────────┐
        │         found                  unknown
        │            │                      │
        ▼            ▼                      ▼
  inject x-tenant-* headers      rewrite → /tenant-not-found
        │                          (notFound() → HTTP 404)
        ▼
  Server Components read headers via lib/current-tenant.ts
```

- The **mock Redis** (`lib/redis.ts`) implements a small `RedisLike` interface
  (`get/set/hget/hset/…`) backed by an in-memory `Map`. Replacing it with a real
  client later only requires matching that interface — no call-site changes.
- Tenant lookups are seeded lazily into the store on first access, so middleware
  needs no separate bootstrap step.
- Unknown tenants are **rewritten** to an internal route that calls Next's
  `notFound()`, producing a genuine `404` status with the styled `not-found.tsx`
  page (rather than a soft 200 with error content).

### Feature 2 — PostGIS geofence API

- The `Geofence.boundary` column is a `geometry(Polygon, 4326)`. Prisma can't
  model spatial types, so it's declared `Unsupported(...)` and all spatial work
  goes through **`$queryRaw`**.
- `geofence-service.ts` builds the point with
  `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` and tests membership with
  `ST_Contains`. Coordinates are bound via Prisma's tagged template, so the query
  is parameterised (no SQL injection).
- The route handler (`app/api/geofence/check/route.ts`) validates the body with
  **Zod** (lat ∈ [-90,90], lng ∈ [-180,180]), and returns structured errors:
  `400` for bad input, `500` if the DB/PostGIS isn't ready.

### Feature 3 — Realtime counter

- A **custom server** (`server.ts`) starts Next.js and attaches Socket.io to the
  same HTTP server, so both share one port/origin.
- The event contract (`socket/events.ts`) is a typed interface imported by both
  server and client — events are fully typed end-to-end, no stringly-typed
  payloads.
- The shared value lives in `socket/counter-store.ts` (encapsulated so it could
  be swapped for Redis pub/sub to scale across instances). On every
  increment/decrement the server `io.emit`s `counter:update` to **all** clients;
  new connections receive the current value on `connect`.

### Cross-cutting

- **Strict TypeScript**, `noUncheckedIndexedAccess`, and an ESLint rule banning
  `any`.
- **Validated environment** (`lib/env.ts`) parses `process.env` once through Zod
  and fails fast with a readable message.
- **Structured logging** (`lib/logger.ts`) emits one JSON line per event and
  works in the Edge (middleware), Node (API), and server runtimes alike.
- **Clean services**: transport/framework concerns (routes, middleware, sockets)
  are kept separate from reusable logic (`lib/*-service.ts`, `tenant-store`,
  `counter-store`).
```
