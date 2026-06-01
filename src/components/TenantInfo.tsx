import type { Tenant } from "@/lib/tenant-store";

interface TenantInfoProps {
  tenant: Pick<Tenant, "id" | "subdomain" | "name"> | null;
}

/** Displays the tenant resolved by the middleware, or a hint for the root host. */
export function TenantInfo({ tenant }: TenantInfoProps): JSX.Element {
  if (!tenant) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-amber-900">No tenant context</h2>
        <p className="mt-1 text-sm text-amber-800">
          You&apos;re on the root host. Visit a tenant subdomain to see resolution
          in action, e.g.{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5">
            tenant1.localhost:3000
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-green-900">Tenant resolved</h2>
      </div>
      <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="font-medium text-green-800">Tenant ID</dt>
        <dd className="font-mono text-green-900">{tenant.id}</dd>
        <dt className="font-medium text-green-800">Subdomain</dt>
        <dd className="font-mono text-green-900">{tenant.subdomain}</dd>
        <dt className="font-medium text-green-800">Name</dt>
        <dd className="text-green-900">{tenant.name}</dd>
      </dl>
      <p className="mt-4 text-xs text-green-700">
        Injected by <code>src/middleware.ts</code> via the{" "}
        <code>x-tenant-*</code> request headers.
      </p>
    </div>
  );
}
