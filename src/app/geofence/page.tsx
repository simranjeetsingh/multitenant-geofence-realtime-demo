import { GeofenceChecker } from "@/components/GeofenceChecker";

export const metadata = { title: "Geofence Check · Screening Demo" };

export default function GeofencePage(): JSX.Element {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Feature 2 · PostGIS Geofence
        </h1>
        <p className="max-w-2xl text-slate-600">
          Submit a coordinate. The server runs{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
            ST_Contains
          </code>{" "}
          against a hardcoded polygon (Lower Manhattan) via Prisma{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
            $queryRaw
          </code>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <GeofenceChecker />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800">curl example</h2>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`curl -X POST http://localhost:3000/api/geofence/check \\
  -H "Content-Type: application/json" \\
  -d '{"lat": 40.7128, "lng": -74.0060}'
# => {"inside":true}`}
        </pre>
      </div>
    </div>
  );
}
