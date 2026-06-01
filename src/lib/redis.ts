import { createLogger } from "@/lib/logger";

const log = createLogger("mock-redis");

/**
 * Minimal Redis-like interface.
 *
 * The demo only needs a key/value store with a hash-style API for tenant
 * lookups, so we model the small surface we actually use. Swapping this for a
 * real client (e.g. `ioredis`) later only requires matching these signatures.
 */
export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  hget(hash: string, field: string): Promise<string | null>;
  hset(hash: string, field: string, value: string): Promise<void>;
  hgetall(hash: string): Promise<Record<string, string>>;
}

/**
 * In-memory mock implementation of {@link RedisLike}.
 *
 * Works in both the Edge (middleware) and Node runtimes because it relies only
 * on a plain `Map`. State is per-process, which is exactly what we want for a
 * self-contained demo — no external Redis server required.
 */
class MockRedis implements RedisLike {
  private readonly store = new Map<string, string>();
  private readonly hashes = new Map<string, Map<string, string>>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async hget(hash: string, field: string): Promise<string | null> {
    return this.hashes.get(hash)?.get(field) ?? null;
  }

  async hset(hash: string, field: string, value: string): Promise<void> {
    const existing = this.hashes.get(hash) ?? new Map<string, string>();
    existing.set(field, value);
    this.hashes.set(hash, existing);
  }

  async hgetall(hash: string): Promise<Record<string, string>> {
    const map = this.hashes.get(hash);
    if (!map) return {};
    return Object.fromEntries(map.entries());
  }
}

/**
 * Singleton accessor.
 *
 * Module state can be reset between Hot-Module-Reload cycles in dev, so we cache
 * the instance on `globalThis` to keep a stable store across reloads.
 */
const globalForRedis = globalThis as unknown as { __mockRedis?: RedisLike };

export const redis: RedisLike = globalForRedis.__mockRedis ?? new MockRedis();

if (!globalForRedis.__mockRedis) {
  globalForRedis.__mockRedis = redis;
  log.info("Mock Redis initialised");
}
