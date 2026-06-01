import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Technical Screening Demo",
  description: "Multi-tenant middleware · PostGIS geofence · realtime counter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-bold text-slate-900">
                Screening<span className="text-brand">Demo</span>
              </Link>
              <div className="flex gap-5 text-sm font-medium text-slate-600">
                <Link href="/" className="hover:text-brand">
                  Tenant
                </Link>
                <Link href="/geofence" className="hover:text-brand">
                  Geofence
                </Link>
                <Link href="/counter" className="hover:text-brand">
                  Counter
                </Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
