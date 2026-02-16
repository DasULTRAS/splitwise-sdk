import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { DEFAULT_CACHE_CONFIG, RequestCache } from "../../src/utils/cache.js";

describe("RequestCache", () => {
  let cache: RequestCache;

  beforeEach(() => {
    cache = new RequestCache({ ...DEFAULT_CACHE_CONFIG });
  });

  describe("tokenFingerprint", () => {
    it("should return a 16-char hex string", () => {
      const fp = RequestCache.tokenFingerprint("my-token");
      assert.equal(fp.length, 16);
      assert.match(fp, /^[0-9a-f]{16}$/);
    });

    it("should return different fingerprints for different tokens", () => {
      const fp1 = RequestCache.tokenFingerprint("token-a");
      const fp2 = RequestCache.tokenFingerprint("token-b");
      assert.notEqual(fp1, fp2);
    });

    it("should return the same fingerprint for the same token", () => {
      const fp1 = RequestCache.tokenFingerprint("same-token");
      const fp2 = RequestCache.tokenFingerprint("same-token");
      assert.equal(fp1, fp2);
    });
  });

  describe("get/set", () => {
    it("should return undefined on cache miss", () => {
      assert.equal(cache.get("nonexistent"), undefined);
    });

    it("should cache and retrieve a value", () => {
      const key = cache.buildKey("/test", undefined, "fp1");
      cache.set(key, { data: 42 }, "/test");
      assert.deepEqual(cache.get(key), { data: 42 });
    });

    it("should return undefined for expired entries", async () => {
      const shortTtlCache = new RequestCache({
        enabled: true,
        defaultTtlMs: 1, // 1ms TTL
      });
      const key = shortTtlCache.buildKey("/test", undefined, "fp1");
      shortTtlCache.set(key, { data: 42 }, "/test");

      // Wait for expiry
      await new Promise((r) => setTimeout(r, 10));
      assert.equal(shortTtlCache.get(key), undefined);
    });
  });

  describe("token-specific keys", () => {
    it("should not share cache between different tokens", () => {
      const key1 = cache.buildKey("/test", undefined, "fingerprint-a");
      const key2 = cache.buildKey("/test", undefined, "fingerprint-b");

      cache.set(key1, { user: "alice" }, "/test");
      cache.set(key2, { user: "bob" }, "/test");

      assert.deepEqual(cache.get(key1), { user: "alice" });
      assert.deepEqual(cache.get(key2), { user: "bob" });
    });
  });

  describe("buildKey", () => {
    it("should include endpoint and token fingerprint", () => {
      const key = cache.buildKey("/api/test", undefined, "fp123");
      assert.ok(key.includes("fp123"));
      assert.ok(key.includes("/api/test"));
    });

    it("should include params in key", () => {
      const key1 = cache.buildKey("/api", { a: 1 }, "fp");
      const key2 = cache.buildKey("/api", { a: 2 }, "fp");
      assert.notEqual(key1, key2);
    });

    it("should produce stable keys regardless of param order", () => {
      const key1 = cache.buildKey("/api", { a: 1, b: 2 }, "fp");
      const key2 = cache.buildKey("/api", { b: 2, a: 1 }, "fp");
      assert.equal(key1, key2);
    });
  });

  describe("invalidate", () => {
    it("should remove entries matching the prefix", () => {
      const key1 = cache.buildKey("/get_group/1", undefined, "fp");
      const key2 = cache.buildKey("/get_group/2", undefined, "fp");
      const key3 = cache.buildKey("/get_expenses", undefined, "fp");

      cache.set(key1, "a", "/get_group/1");
      cache.set(key2, "b", "/get_group/2");
      cache.set(key3, "c", "/get_expenses");

      cache.invalidate("/get_group");

      assert.equal(cache.get(key1), undefined);
      assert.equal(cache.get(key2), undefined);
      assert.equal(cache.get(key3), "c"); // unaffected
    });

    it("should not over-invalidate similar endpoint names", () => {
      const keyGroup = cache.buildKey("/get_group", undefined, "fp");
      const keyGroups = cache.buildKey("/get_groups", undefined, "fp");

      cache.set(keyGroup, "single", "/get_group");
      cache.set(keyGroups, "list", "/get_groups");

      cache.invalidate("/get_group");

      assert.equal(cache.get(keyGroup), undefined); // invalidated
      assert.equal(cache.get(keyGroups), "list"); // NOT invalidated
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      const key = cache.buildKey("/test", undefined, "fp");
      cache.set(key, "data", "/test");
      cache.clear();
      assert.equal(cache.get(key), undefined);
    });
  });

  describe("dedup", () => {
    it("should deduplicate concurrent requests", async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 50));
        return { data: "result" };
      };

      const key = "dedup-key";
      const [r1, r2, r3] = await Promise.all([
        cache.dedup(key, factory),
        cache.dedup(key, factory),
        cache.dedup(key, factory),
      ]);

      assert.equal(callCount, 1); // Only one actual call
      assert.deepEqual(r1, { data: "result" });
      assert.deepEqual(r2, { data: "result" });
      assert.deepEqual(r3, { data: "result" });
    });

    it("should allow new requests after dedup completes", async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        return callCount;
      };

      const key = "dedup-key-2";
      const r1 = await cache.dedup(key, factory);
      const r2 = await cache.dedup(key, factory);

      assert.equal(callCount, 2); // Two separate calls
      assert.equal(r1, 1);
      assert.equal(r2, 2);
    });
  });

  describe("disabled cache", () => {
    it("should return undefined on get when disabled", () => {
      const disabledCache = new RequestCache({
        enabled: false,
        defaultTtlMs: 300_000,
      });
      const key = disabledCache.buildKey("/test", undefined, "fp");
      disabledCache.set(key, "data", "/test");
      assert.equal(disabledCache.get(key), undefined);
    });
  });

  describe("TTL overrides", () => {
    it("should use endpoint-specific TTL", async () => {
      const c = new RequestCache({
        enabled: true,
        defaultTtlMs: 100_000,
        ttlOverrides: {
          "/get_currencies": 1, // 1ms
        },
      });

      const key = c.buildKey("/get_currencies", undefined, "fp");
      c.set(key, "cached", "/get_currencies");

      // Should be cached initially
      assert.equal(c.get(key), "cached");

      // Wait for TTL to expire
      await new Promise((r) => setTimeout(r, 10));
      assert.equal(c.get(key), undefined);

      c.dispose();
    });
  });

  describe("dispose", () => {
    it("should clear all entries and stop sweep timer", () => {
      const c = new RequestCache({ ...DEFAULT_CACHE_CONFIG });
      const key = c.buildKey("/test", undefined, "fp");
      c.set(key, "data", "/test");
      c.dispose();
      assert.equal(c.get(key), undefined);
    });

    it("should be safe to call multiple times", () => {
      const c = new RequestCache({ ...DEFAULT_CACHE_CONFIG });
      c.dispose();
      c.dispose(); // should not throw
    });
  });

  describe("sweep", () => {
    it("should remove expired entries during sweep", async () => {
      const c = new RequestCache({
        enabled: true,
        defaultTtlMs: 1, // 1ms TTL
      });

      const key1 = c.buildKey("/a", undefined, "fp");
      const key2 = c.buildKey("/b", undefined, "fp");
      c.set(key1, "expired", "/a");
      c.set(key2, "expired", "/b");

      // Wait for entries to expire
      await new Promise((r) => setTimeout(r, 10));

      // Add a non-expired entry
      const c2 = new RequestCache({
        enabled: true,
        defaultTtlMs: 60_000,
      });
      const key3 = c2.buildKey("/c", undefined, "fp");
      c2.set(key3, "fresh", "/c");

      // Expired entries should return undefined on get
      assert.equal(c.get(key1), undefined);
      assert.equal(c.get(key2), undefined);
      assert.equal(c2.get(key3), "fresh");

      c.dispose();
      c2.dispose();
    });
  });
});
