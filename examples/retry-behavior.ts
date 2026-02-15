/**
 * Retry-Verhalten des SDK.
 *
 * Das SDK implementiert automatisches Retry mit Exponential Backoff + Jitter
 * für transiente Fehler (5xx, 429, Netzwerkfehler).
 */
import { SilentLogger, Splitwise } from "splitwise-sdk";
import { getExampleToken } from "./_env.js";

// ── Beispiel 1: Standard-Retry (3 Versuche) ─────────────────────

const sw = new Splitwise({
  accessToken: getExampleToken(),
  logger: "debug", // Zeigt Retry-Logs mit retryCount
  retry: {
    maxRetries: 3, // Bis zu 3 Wiederholungen (default)
    baseDelayMs: 500, // Startdelay: 500ms
    maxDelayMs: 30_000, // Maximal 30 Sekunden warten
  },
});

// Bei einem 500er-Fehler wird automatisch bis zu 3x wiederholt:
// Attempt 0: Request → 500 → Delay ~500ms
// Attempt 1: Request → 500 → Delay ~1000ms
// Attempt 2: Request → 500 → Delay ~2000ms
// Attempt 3: Request → 200 → Erfolg

const { user } = await sw.users.getCurrentUser();
console.log("User:", user?.first_name);

// ── Beispiel 2: Retry deaktivieren ───────────────────────────────

const noRetrySw = new Splitwise({
  accessToken: getExampleToken(),
  logger: new SilentLogger(),
  retry: { maxRetries: 0 },
});

try {
  await noRetrySw.users.getCurrentUser();
} catch (err) {
  console.log("Fehler ohne Retry:", (err as Error).message);
}

// ── Beispiel 3: Aggressives Retry ────────────────────────────────

const aggressiveSw = new Splitwise({
  accessToken: getExampleToken(),
  logger: "warn",
  retry: {
    maxRetries: 5, // Mehr Versuche
    baseDelayMs: 200, // Kürzerer Startdelay
    maxDelayMs: 10_000, // Niedrigerer Max-Delay
  },
});

const { groups } = await aggressiveSw.groups.getGroups();
console.log(`${groups?.length ?? 0} Gruppen geladen`);
