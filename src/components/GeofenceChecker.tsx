"use client";

import { useState } from "react";

interface CheckResponse {
  inside?: boolean;
  error?: string;
}

const PRESETS: ReadonlyArray<{ label: string; lat: number; lng: number }> = [
  { label: "NYC City Hall (inside)", lat: 40.7128, lng: -74.006 },
  { label: "San Francisco (outside)", lat: 37.7749, lng: -122.4194 },
  { label: "Null Island (outside)", lat: 0, lng: 0 },
];

/** Interactive client for POST /api/geofence/check (FEATURE 2). */
export function GeofenceChecker(): JSX.Element {
  const [lat, setLat] = useState("40.7128");
  const [lng, setLng] = useState("-74.0060");
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function check(): Promise<void> {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/geofence/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: Number(lat), lng: Number(lng) }),
      });
      const data = (await res.json()) as CheckResponse;
      if (!res.ok || typeof data.inside !== "boolean") {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setResult(data.inside);
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setLat(String(p.lat));
              setLng(String(p.lng));
            }}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm font-medium text-slate-700">
          Latitude
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Longitude
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={check}
        disabled={loading}
        className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "Checking…" : "Check point"}
      </button>

      {result !== null && (
        <div
          className={`rounded-lg p-4 text-sm font-semibold ${
            result
              ? "bg-green-50 text-green-800"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {result ? "✓ Inside the geofence" : "✗ Outside the geofence"}
          <pre className="mt-2 rounded bg-white/60 p-2 text-xs font-normal">
            {JSON.stringify({ inside: result }, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
