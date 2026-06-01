/**
 * Shared Socket.io event contract (FEATURE 3).
 *
 * Importing the same typed interfaces on the server and client guarantees both
 * ends agree on event names and payload shapes — no stringly-typed events.
 */

/** Events the server emits to clients. */
export interface ServerToClientEvents {
  /** Current counter value broadcast after every change and on connect. */
  "counter:update": (value: number) => void;
}

/** Events clients emit to the server. */
export interface ClientToServerEvents {
  /** Increment the shared counter by one. */
  "counter:increment": () => void;
  /** Decrement the shared counter by one. */
  "counter:decrement": () => void;
}

/** Socket.io path. Kept in one place so server & client never drift. */
export const SOCKET_PATH = "/socket.io";
