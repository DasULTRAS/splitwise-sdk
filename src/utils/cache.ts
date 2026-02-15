/**
 * In-memory TTL cache with token-specific keys and request deduplication.
 *
 * - Only caches GET requests.
 * - Cache keys include endpoint, query params, and a token fingerprint.
 * - In-flight deduplication prevents duplicate concurrent requests.
 * - Write operations (POST/PUT/PATCH/DELETE) invalidate relevant resource caches.
 */

import { createHash } from "node:crypto";

export interface CacheConfig {
  /** Whether caching is enabled. Default: true. */
  enabled: boolean;
  /** Default TTL in milliseconds. Default: 300 000 (5 min). */
  defaultTtlMs: number;
  /** Per-endpoint TTL overrides. Keys are endpoint path prefixes. */
  ttlOverrides?: Record<string, number>;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  defaultTtlMs: 300_000,
  ttlOverrides: {
    "/get_currencies": 86_400_000, // 24h – rarely changes
    "/get_categories": 86_400_000, // 24h – rarely changes
  },
};

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

export class RequestCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(private readonly config: CacheConfig) {}

  /**
   * Build a cache key that is token-specific.
   */
  buildKey(
    endpoint: string,
    params: Record<string, unknown> | undefined,
    tokenFingerprint: string,
  ): string {
    const paramStr = params
      ? JSON.stringify(params, Object.keys(params).sort())
      : "";
    return `${tokenFingerprint}:${endpoint}:${paramStr}`;
  }

  /**
   * Hash a token into a short fingerprint to avoid storing raw tokens in cache keys.
   */
  static tokenFingerprint(token: string): string {
    return createHash("sha256").update(token).digest("hex").slice(0, 16);
  }

  /**
   * Try to get a cached value. Returns undefined on miss or expiry.
   */
  get<T>(key: string): T | undefined {
    if (!this.config.enabled) return undefined;

    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Store a value in the cache.
   */
  set<T>(key: string, value: T, endpoint: string): void {
    if (!this.config.enabled) return;

    const ttl = this.getTtl(endpoint);
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Deduplicate concurrent GET requests to the same endpoint+params.
   * If an identical request is already in-flight, await its result.
   */
  async dedup<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = factory().finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, promise);
    return promise;
  }

  /**
   * Invalidate all cache entries whose key contains the given resource prefix.
   * Called after mutating operations.
   */
  invalidate(resourcePrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(resourcePrefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.cache.clear();
    this.inflight.clear();
  }

  private getTtl(endpoint: string): number {
    if (this.config.ttlOverrides) {
      for (const [prefix, ttl] of Object.entries(this.config.ttlOverrides)) {
        if (endpoint.startsWith(prefix)) return ttl;
      }
    }
    return this.config.defaultTtlMs;
  }
}
