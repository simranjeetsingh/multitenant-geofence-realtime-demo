import { notFound } from "next/navigation";

/**
 * Internal target of the middleware rewrite for unknown tenants.
 *
 * Calling `notFound()` from a Server Component renders the nearest
 * `not-found.tsx` boundary with a genuine HTTP 404 status code.
 */
export default function TenantNotFoundPage(): never {
  notFound();
}
