/**
 * Caching-Verhalten des SDK.
 *
 * Das SDK cached GET-Anfragen automatisch mit einem In-Memory TTL-Cache
 * und dedupliziert gleichzeitige identische Requests.
 */
import { SilentLogger, Splitwise } from "splitwise-sdk";
import { getExampleToken } from "./_env.js";

// ── Beispiel 1: Standard-Cache ───────────────────────────────────

const sw = new Splitwise({
  accessToken: getExampleToken(),
  logger: new SilentLogger(),
  cache: {
    enabled: true, // default
    defaultTtlMs: 300_000, // 5 Minuten (default)
  },
});

// Erster Aufruf: HTTP-Request wird ausgeführt
console.time("Erster Aufruf");
const result1 = await sw.users.getCurrentUser();
console.timeEnd("Erster Aufruf");

// Zweiter Aufruf: Aus dem Cache (kein HTTP-Request)
console.time("Zweiter Aufruf (cached)");
const result2 = await sw.users.getCurrentUser();
console.timeEnd("Zweiter Aufruf (cached)");

console.log("Gleiche Daten:", result1.user?.id === result2.user?.id);

// ── Beispiel 2: Request-Deduplication ────────────────────────────

// Gleichzeitige Requests werden dedupliziert – nur EIN HTTP-Request
console.time("3x parallel");
const [a, b, c] = await Promise.all([
  sw.users.getCurrentUser(),
  sw.users.getCurrentUser(),
  sw.users.getCurrentUser(),
]);
console.timeEnd("3x parallel");
console.log(
  "Alle gleich:",
  a.user?.id === b.user?.id && b.user?.id === c.user?.id,
);

// ── Beispiel 3: Cache-Invalidation ──────────────────────────────

// Schreibende Operationen invalidieren den Cache der betroffenen Ressource:
const { expenses } = await sw.expenses.getExpenses({ limit: 1 });
console.log("Gecachte Ausgaben:", expenses?.length);

// createExpense invalidiert automatisch den Expense-Cache
// await sw.expenses.createExpense({ cost: "5.00", description: "Kaffee" });

// Nächster getExpenses-Aufruf macht einen frischen HTTP-Request
// const fresh = await sw.expenses.getExpenses({ limit: 1 });

// ── Beispiel 4: Cache manuell leeren ─────────────────────────────

sw.clearCache();
console.log("Cache geleert");

// Nächster Aufruf macht wieder einen HTTP-Request
const fresh = await sw.users.getCurrentUser();
console.log("Frische Daten:", fresh.user?.first_name);

// ── Beispiel 5: Cache deaktivieren ───────────────────────────────

const noCacheSw = new Splitwise({
  accessToken: getExampleToken(),
  logger: new SilentLogger(),
  cache: { enabled: false },
});

// Jeder Aufruf macht einen HTTP-Request
await noCacheSw.users.getCurrentUser();
await noCacheSw.users.getCurrentUser(); // Kein Cache, neuer Request
