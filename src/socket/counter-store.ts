/**
 * Shared counter state for FEATURE 3.
 *
 * Encapsulated behind a small service so the transport (Socket.io) stays
 * decoupled from where the value lives. For the demo it's an in-memory value;
 * swapping in Redis (for multi-instance fan-out) would only touch this file.
 */
class CounterStore {
  private value = 0;

  get(): number {
    return this.value;
  }

  increment(): number {
    this.value += 1;
    return this.value;
  }

  decrement(): number {
    this.value -= 1;
    return this.value;
  }
}

// Cache on globalThis so dev hot-reload keeps the counter value stable.
const globalForCounter = globalThis as unknown as { __counterStore?: CounterStore };

export const counterStore: CounterStore =
  globalForCounter.__counterStore ?? new CounterStore();

globalForCounter.__counterStore = counterStore;
