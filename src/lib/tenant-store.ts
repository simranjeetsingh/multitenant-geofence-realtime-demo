import { redis } from "@/lib/redis";
import { createLogger } from "@/lib/logger";

const log = createLogger("tenant-store");

/** Public shape of a tenant record as stored and returned by the app. */
export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
}

/** Redis hash key under which all tenants are stored, keyed by subdomain. */
const TENANTS_HASH = "tenants";

/**
 * Seed data for the demo. In a real system this would live in the database and
 * be cached into Redis; here we hydrate the mock Redis store directly.
 */
const SEED_TENANTS: readonly Tenant[] = [
  { id: "tnt_0001", subdomain: "tenant1", name: "Acme Corporation", plan: "enterprise" },
  { id: "tnt_0002", subdomain: "tenant2", name: "Globex Industries", plan: "pro" },
  { id: "tnt_0003", subdomain: "tenant3", name: "Initech LLC", plan: "free" },
];

let seeded = false;

/**
 * Idempotently load the seed tenants into the mock Redis store.
 *
 * Called lazily on the first lookup so middleware never has to be ordered after
 * a separate bootstrap step.
 */
async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  for (const tenant of SEED_TENANTS) {
    await redis.hset(TENANTS_HASH, tenant.subdomain, JSON.stringify(tenant));
  }
  seeded = true;
  log.info("Seeded tenant store", { count: SEED_TENANTS.length });
}

/**
 * Look up a tenant by its subdomain. Returns `null` when no tenant matches,
 * which the middleware translates into a 404 response.
 */
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  await ensureSeeded();
  const raw = await redis.hget(TENANTS_HASH, subdomain.toLowerCase());
  if (!raw) return null;
  return JSON.parse(raw) as Tenant;
}

/** Return every known tenant. Useful for the homepage and debugging. */
export async function listTenants(): Promise<Tenant[]> {
  await ensureSeeded();
  const all = await redis.hgetall(TENANTS_HASH);
  return Object.values(all).map((raw) => JSON.parse(raw) as Tenant);
}
