import Link from "next/link";
import { getCurrentTenant } from "@/lib/current-tenant";
import { listTenants } from "@/lib/tenant-store";
import { TenantInfo } from "@/components/TenantInfo";

// Reads request headers (tenant context) → must be dynamic.
export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<JSX.Element> {
  const tenant = getCurrentTenant();
  const allTenants = await listTenants();

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">
          Technical Screening Demo
        </h1>
        <p className="max-w-2xl text-slate-600">
          Three self-contained features: multi-tenant middleware, a PostGIS
          geofence API, and a realtime Socket.io counter.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Feature 1 · Multi-tenant resolution
        </h2>
        <TenantInfo tenant={tenant} />

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-700">
            Registered tenants
          </h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {allTenants.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-slate-500">
                  {t.subdomain}.localhost:3000
                </span>
                <span className="text-slate-700">{t.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase text-slate-500">
                  {t.plan}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between py-2 text-sm text-red-600">
              <span className="font-mono">unknown.localhost:3000</span>
              <span>→ returns HTTP 404</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/geofence"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand hover:shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Feature 2 · Geofence API →
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            POST a lat/lng and PostGIS tells you if it&apos;s inside the polygon.
          </p>
        </Link>
        <Link
          href="/counter"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand hover:shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Feature 3 · Realtime counter →
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Socket.io broadcast — open two tabs and watch them sync.
          </p>
        </Link>
      </section>
    </div>
  );
}
