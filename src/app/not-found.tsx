import Link from "next/link";

/**
 * Global 404 boundary. Rendered both for genuinely missing routes and — via the
 * middleware rewrite — for requests to unknown tenant subdomains (FEATURE 1).
 */
export default function NotFound(): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-7xl font-black text-brand">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Tenant not found</h1>
      <p className="max-w-md text-slate-600">
        The subdomain you requested isn&apos;t a registered tenant. Try one of
        the known tenants, e.g.{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
          tenant1.localhost:3000
        </code>
        .
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
      >
        Back home
      </Link>
    </div>
  );
}
