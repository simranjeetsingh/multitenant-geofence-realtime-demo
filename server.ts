// MUST be the first import: populates process.env from .env before any module
// (env validation, Prisma) reads it. See src/lib/load-env.ts.
import "@/lib/load-env";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { attachSocketServer } from "@/socket/server";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

/**
 * Custom Node server that serves BOTH the Next.js app and the Socket.io server
 * from a single HTTP listener (one port, shared origin — keeps cookies/CORS
 * simple). Next's own middleware (multi-tenant resolution) still runs because
 * we delegate every non-socket request to Next's request handler.
 *
 * Started via `npm run dev` / `npm run start`.
 */
const log = createLogger("server");

const dev = env.NODE_ENV !== "production";
const port = env.PORT;

const app = next({ dev });
const handle = app.getRequestHandler();

async function bootstrap(): Promise<void> {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    // Socket.io attaches its own listeners; everything else goes to Next.
    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  });

  // FEATURE 3 — wire up the realtime counter namespace.
  attachSocketServer(httpServer);

  httpServer.listen(port, () => {
    log.info("Server ready", {
      url: `http://localhost:${port}`,
      mode: dev ? "development" : "production",
    });
    log.info("Try tenant subdomains", {
      tenant1: `http://tenant1.localhost:${port}`,
      tenant2: `http://tenant2.localhost:${port}`,
      unknown: `http://unknown.localhost:${port} (404)`,
    });
  });
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  log.error("Failed to start server", { message });
  process.exit(1);
});
