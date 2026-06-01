"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import {
  SOCKET_PATH,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@/socket/events";

type CounterSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseCounterSocket {
  count: number;
  status: ConnectionStatus;
  increment: () => void;
  decrement: () => void;
}

/**
 * React hook encapsulating the Socket.io client for FEATURE 3.
 *
 * Connects to the same-origin Socket.io server, tracks connection status for
 * the UI indicator, and exposes increment/decrement actions. The counter value
 * is always driven by server broadcasts (`counter:update`) so every tab stays
 * in sync.
 */
export function useCounterSocket(): UseCounterSocket {
  const socketRef = useRef<CounterSocket | null>(null);
  const [count, setCount] = useState<number>(0);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const socket: CounterSocket = io({
      path: SOCKET_PATH,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.io.on("reconnect_attempt", () => setStatus("connecting"));
    socket.on("counter:update", (value) => setCount(value));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const increment = useCallback(() => {
    socketRef.current?.emit("counter:increment");
  }, []);

  const decrement = useCallback(() => {
    socketRef.current?.emit("counter:decrement");
  }, []);

  return { count, status, increment, decrement };
}
