import { Counter } from "@/components/Counter";

export const metadata = { title: "Realtime Counter · Screening Demo" };

export default function CounterPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Feature 3 · Realtime Counter
        </h1>
        <p className="max-w-2xl text-slate-600">
          The counter value lives on the Socket.io server. Every change is
          broadcast to all connected clients.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-12">
        <Counter />
      </div>
    </div>
  );
}
