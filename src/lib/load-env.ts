import { loadEnvConfig } from "@next/env";

/**
 * Load `.env` / `.env.local` into `process.env` as a side effect on import.
 *
 * The custom `server.ts` runs under ts-node, which (unlike `next dev`/`start`)
 * does NOT auto-load env files. Importing THIS module first — before anything
 * that reads `process.env` (e.g. `@/lib/env`, `@/lib/prisma`) — guarantees the
 * variables are populated before they're parsed. ES module imports execute in
 * source order, so the import position matters.
 */
loadEnvConfig(process.cwd());
