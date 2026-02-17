/**
 * Retry behavior of the SDK.
 *
 * Auto-retries transient errors (5xx, 429, network) with exponential backoff + jitter.
 */
import { SilentLogger, Splitwise } from "splitwise-sdk";
import { getExampleToken } from "./_env.js";

// ── Example 1: Default retry (3 attempts) ────────────────────────

const sw = new Splitwise({
  accessToken: getExampleToken(),
  logger: "debug", // shows retry logs with retryCount
  retry: {
    maxRetries: 3, // up to 3 retries (default)
    baseDelayMs: 500, // initial delay: 500ms
    maxDelayMs: 30_000, // max 30 seconds
  },
});

// On a 500 error, retries up to 3 times:
// Attempt 0: Request → 500 → delay ~500ms
// Attempt 1: Request → 500 → delay ~1000ms
// Attempt 2: Request → 500 → delay ~2000ms
// Attempt 3: Request → 200 → success

const { user } = await sw.users.getCurrentUser();
console.log("User:", user?.first_name);

// ── Example 2: Disable retry ─────────────────────────────────────

const noRetrySw = new Splitwise({
  accessToken: getExampleToken(),
  logger: new SilentLogger(),
  retry: { maxRetries: 0 },
});

try {
  await noRetrySw.users.getCurrentUser();
} catch (err) {
  console.log("Error without retry:", (err as Error).message);
}

// ── Example 3: Aggressive retry ──────────────────────────────────

const aggressiveSw = new Splitwise({
  accessToken: getExampleToken(),
  logger: "warn",
  retry: {
    maxRetries: 5, // more attempts
    baseDelayMs: 200, // shorter initial delay
    maxDelayMs: 10_000, // lower max delay
  },
});

const { groups } = await aggressiveSw.groups.getGroups();
console.log(`${groups?.length ?? 0} groups loaded`);
