/**
 * Caching behavior of the SDK.
 *
 * GET requests are automatically cached in-memory with TTL.
 * Identical concurrent requests are deduplicated.
 */
import { SilentLogger, Splitwise } from "splitwise-sdk";
import { getExampleToken } from "./_env.js";

// ── Example 1: Default cache ─────────────────────────────────────

const sw = new Splitwise({
  accessToken: getExampleToken(),
  logger: new SilentLogger(),
  cache: {
    enabled: true, // default
    defaultTtlMs: 300_000, // 5 minutes (default)
  },
});

// First call: executes HTTP request
console.time("First call");
const result1 = await sw.users.getCurrentUser();
console.timeEnd("First call");

// Second call: served from cache (no HTTP request)
console.time("Second call (cached)");
const result2 = await sw.users.getCurrentUser();
console.timeEnd("Second call (cached)");

console.log("Same data:", result1.user?.id === result2.user?.id);

// ── Example 2: Request deduplication ─────────────────────────────

// Concurrent requests are deduplicated — only ONE HTTP request
console.time("3x parallel");
const [a, b, c] = await Promise.all([
  sw.users.getCurrentUser(),
  sw.users.getCurrentUser(),
  sw.users.getCurrentUser(),
]);
console.timeEnd("3x parallel");
console.log(
  "All equal:",
  a.user?.id === b.user?.id && b.user?.id === c.user?.id,
);

// ── Example 3: Cache invalidation ───────────────────────────────

// Write operations invalidate the affected resource cache:
const { expenses } = await sw.expenses.getExpenses({ limit: 1 });
console.log("Cached expenses:", expenses?.length);

// createExpense automatically invalidates the expense cache
// await sw.expenses.createExpense({ cost: "5.00", description: "Coffee" });

// Next getExpenses call makes a fresh HTTP request
// const fresh = await sw.expenses.getExpenses({ limit: 1 });

// ── Example 4: Clear cache manually ──────────────────────────────

sw.clearCache();
console.log("Cache cleared");

// Next call makes a fresh HTTP request
const fresh = await sw.users.getCurrentUser();
console.log("Fresh data:", fresh.user?.first_name);

// ── Example 5: Disable cache ─────────────────────────────────────

const noCacheSw = new Splitwise({
  accessToken: getExampleToken(),
  logger: new SilentLogger(),
  cache: { enabled: false },
});

// Every call makes an HTTP request
await noCacheSw.users.getCurrentUser();
await noCacheSw.users.getCurrentUser(); // no cache, new request
