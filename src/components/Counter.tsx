"use client";

import { useCounterSocket } from "@/lib/use-counter-socket";
import { ConnectionStatus } from "@/components/ConnectionStatus";

/**
 * Realtime counter widget (FEATURE 3).
 *
 * Open this page in two tabs: clicking Increment/Decrement in one updates both,
 * because the value is owned by the server and broadcast to every client.
 */
export function Counter(): JSX.Element {
  const { count, status, increment, decrement } = useCounterSocket();

  return (
    <div className="flex flex-col items-center gap-6">
      <ConnectionStatus status={status} />

      <div
        className="tabular-nums text-7xl font-bold text-slate-900"
        aria-label="counter value"
      >
        {count}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={status !== "connected"}
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-lg font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          − Decrement
        </button>
        <button
          type="button"
          onClick={increment}
          disabled={status !== "connected"}
          className="rounded-lg bg-brand px-6 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Increment
        </button>
      </div>

      <p className="max-w-md text-center text-sm text-slate-500">
        Open this page in a second tab and click a button — both tabs update in
        real time (typically &lt;100ms on localhost).
      </p>
    </div>
  );
}
