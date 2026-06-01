import { headers } from "next/headers";
import {
  TENANT_ID_HEADER,
  TENANT_SUBDOMAIN_HEADER,
  TENANT_NAME_HEADER,
} from "@/middleware/tenant-resolver";
import type { Tenant } from "@/lib/tenant-store";

/**
 * Read the tenant injected by the middleware from the incoming request headers.
 *
 * Returns `null` on the bare root host (no subdomain). Server Components and
 * route handlers can call this without re-running tenant resolution.
 */
export function getCurrentTenant(): Pick<Tenant, "id" | "subdomain" | "name"> | null {
  const h = headers();
  const id = h.get(TENANT_ID_HEADER);
  const subdomain = h.get(TENANT_SUBDOMAIN_HEADER);
  const name = h.get(TENANT_NAME_HEADER);

  if (!id || !subdomain || !name) return null;

  return { id, subdomain, name };
}
