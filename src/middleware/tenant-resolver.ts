import { getTenantBySubdomain, type Tenant } from "@/lib/tenant-store";
import { createLogger } from "@/lib/logger";

const log = createLogger("tenant-resolver");

/** HTTP header used to forward the resolved tenant id to downstream handlers. */
export const TENANT_ID_HEADER = "x-tenant-id";
/** HTTP header used to forward the resolved subdomain. */
export const TENANT_SUBDOMAIN_HEADER = "x-tenant-subdomain";
/** HTTP header used to forward the resolved tenant display name. */
export const TENANT_NAME_HEADER = "x-tenant-name";

/**
 * Hostnames that are treated as "no subdomain" / the bare root. Requests to
 * these resolve to no tenant but are NOT 404'd — the homepage explains how to
 * use a tenant subdomain instead.
 */
const ROOT_HOSTS = new Set(["localhost", "127.0.0.1", ""]);

export type ResolutionOutcome =
  | { kind: "root" }
  | { kind: "found"; tenant: Tenant }
  | { kind: "unknown"; subdomain: string };

/**
 * Extract the tenant subdomain from a raw `Host` header value.
 *
 * Examples:
 *   "tenant1.localhost:3000" -> "tenant1"
 *   "tenant2.localhost"      -> "tenant2"
 *   "localhost:3000"         -> null  (root, no subdomain)
 *   "app.tenant1.localhost"  -> "app" (left-most label wins)
 */
export function extractSubdomain(host: string | null): string | null {
  if (!host) return null;

  // Drop the port if present.
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (ROOT_HOSTS.has(hostname)) return null;

  const labels = hostname.split(".");

  // We need at least <sub>.<root> to have a subdomain. For *.localhost that is
  // two labels; for *.example.com that is three.
  if (hostname.endsWith("localhost")) {
    return labels.length >= 2 ? labels[0] ?? null : null;
  }

  return labels.length >= 3 ? labels[0] ?? null : null;
}

/**
 * Resolve a request host to a tenant outcome. Pure-ish service that the
 * middleware composes with framework-level concerns (headers, redirects).
 */
export async function resolveTenant(host: string | null): Promise<ResolutionOutcome> {
  const subdomain = extractSubdomain(host);

  if (subdomain === null) {
    log.info("Resolved root host (no subdomain)", { host: host ?? "<none>" });
    return { kind: "root" };
  }

  const tenant = await getTenantBySubdomain(subdomain);

  if (!tenant) {
    log.warn("Tenant resolution failed", { host: host ?? "<none>", subdomain });
    return { kind: "unknown", subdomain };
  }

  log.info("Tenant resolved", {
    host: host ?? "<none>",
    subdomain,
    tenantId: tenant.id,
    plan: tenant.plan,
  });
  return { kind: "found", tenant };
}
