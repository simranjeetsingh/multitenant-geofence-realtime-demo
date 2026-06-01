import type { ConnectionStatus as Status } from "@/lib/use-counter-socket";

const STYLES: Record<Status, { dot: string; label: string; text: string }> = {
  connected: { dot: "bg-green-500", label: "Connected", text: "text-green-700" },
  connecting: { dot: "bg-amber-500 animate-pulse", label: "Connecting…", text: "text-amber-700" },
  disconnected: { dot: "bg-red-500", label: "Disconnected", text: "text-red-700" },
};

/** Small pill showing the live Socket.io connection state. */
export function ConnectionStatus({ status }: { status: Status }): JSX.Element {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium ${s.text}`}
      role="status"
      aria-live="polite"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}
