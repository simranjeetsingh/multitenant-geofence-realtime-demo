import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { counterStore } from "@/socket/counter-store";
import {
  SOCKET_PATH,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@/socket/events";
import { createLogger } from "@/lib/logger";

const log = createLogger("socket-server");

type TypedServer = IOServer<ClientToServerEvents, ServerToClientEvents>;

/**
 * Attach the Socket.io server to an existing HTTP server and wire up the
 * counter handlers. Returns the typed io instance.
 *
 * Behaviour:
 *   - On connect, the client immediately receives the current value.
 *   - increment/decrement mutate the shared store and broadcast the new value
 *     to ALL connected clients, so every open tab updates in well under 500ms.
 */
export function attachSocketServer(httpServer: HttpServer): TypedServer {
  const io: TypedServer = new IOServer(httpServer, {
    path: SOCKET_PATH,
    cors: { origin: true, credentials: true },
  });

  io.on("connection", (socket) => {
    log.info("Client connected", { id: socket.id, clients: io.engine.clientsCount });

    // Send the current value to the freshly-connected client.
    socket.emit("counter:update", counterStore.get());

    socket.on("counter:increment", () => {
      const value = counterStore.increment();
      log.info("Counter incremented", { by: socket.id, value });
      io.emit("counter:update", value); // broadcast to everyone (incl. sender)
    });

    socket.on("counter:decrement", () => {
      const value = counterStore.decrement();
      log.info("Counter decremented", { by: socket.id, value });
      io.emit("counter:update", value);
    });

    socket.on("disconnect", (reason) => {
      log.info("Client disconnected", { id: socket.id, reason });
    });
  });

  log.info("Socket.io server attached", { path: SOCKET_PATH });
  return io;
}
