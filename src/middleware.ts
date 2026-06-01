import { NextRequest, NextResponse } from "next/server";
import {
  resolveTenant,
  TENANT_ID_HEADER,
  TENANT_SUBDOMAIN_HEADER,
  TENANT_NAME_HEADER,
} from "@/middleware/tenant-resolver";

/**
 * FEATURE 1 — Multi-tenant middleware.
 *
 * For every matched request we:
 *   1. Extract the subdomain from the `Host` header.
 *   2. Look the tenant up in the (mock Redis backed) tenant store.
 *   3. Inject the resolved tenant id/subdomain/name into request headers so
 *      downstream Server Components & route handlers can read them.
 *   4. Rewrite unknown tenants to a route that returns a real HTTP 404.
 *
 * The `matcher` below excludes Next internals and static assets so we only pay
 * the resolution cost on real page/API requests.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get("host");
  const outcome = await resolveTenant(host);

  if (outcome.kind === "unknown") {
    // Rewrite to a server component that calls `notFound()`, yielding a styled
    // 404 page with a genuine 404 status code.
    const url = request.nextUrl.clone();
    url.pathname = "/tenant-not-found";
    return NextResponse.rewrite(url, { status: 404 });
  }

  // Forward request with tenant context injected into headers.
  const requestHeaders = new Headers(request.headers);

  if (outcome.kind === "found") {
    requestHeaders.set(TENANT_ID_HEADER, outcome.tenant.id);
    requestHeaders.set(TENANT_SUBDOMAIN_HEADER, outcome.tenant.subdomain);
    requestHeaders.set(TENANT_NAME_HEADER, outcome.tenant.name);
  } else {
    // Root host: clear any spoofed headers so downstream code can't be tricked.
    requestHeaders.delete(TENANT_ID_HEADER);
    requestHeaders.delete(TENANT_SUBDOMAIN_HEADER);
    requestHeaders.delete(TENANT_NAME_HEADER);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on everything except Next internals, the favicon and the Socket.io path.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|socket.io).*)"],
};
