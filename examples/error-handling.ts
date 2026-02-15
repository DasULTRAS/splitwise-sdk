/**
 * Fehlerbehandlung mit typisierten Error-Klassen.
 *
 * Das SDK wirft spezifische Fehlerklassen für verschiedene HTTP-Statuscodes.
 * Diese können über `instanceof` abgefangen und behandelt werden.
 */
import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  SilentLogger,
  Splitwise,
  SplitwiseApiError,
  ValidationError,
} from "splitwise-sdk";
import { getExampleToken } from "./_env.js";

const sw = new Splitwise({
  accessToken: getExampleToken(),
  logger: new SilentLogger(),
  retry: { maxRetries: 0 }, // Retries deaktivieren für dieses Beispiel
});

// ── Beispiel 1: Ressource nicht gefunden ─────────────────────────

async function getExpenseById(id: number): Promise<void> {
  try {
    const result = await sw.expenses.getExpense(id);
    console.log("Ausgabe gefunden:", result.expense?.description);
  } catch (err) {
    if (err instanceof NotFoundError) {
      console.log(`Ausgabe ${id} nicht gefunden (Status: ${err.status})`);
      console.log(`Endpunkt: ${err.endpoint}`);
      console.log(`Request-ID: ${err.requestId}`);
    } else {
      throw err;
    }
  }
}

await getExpenseById(999999999);

// ── Beispiel 2: Authentifizierungsfehler ─────────────────────────

async function testInvalidToken(): Promise<void> {
  const badClient = new Splitwise({
    accessToken: "invalid-token",
    logger: new SilentLogger(),
    retry: { maxRetries: 0 },
  });

  try {
    await badClient.users.getCurrentUser();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      console.log("\nAuthentifizierungsfehler: Token ist ungültig");
      console.log(`Status: ${err.status}`);
    }
  }
}

await testInvalidToken();

// ── Beispiel 3: Catch-all für API-Fehler ─────────────────────────

async function safeRequest(): Promise<void> {
  try {
    await sw.users.getCurrentUser();
    console.log("\nRequest erfolgreich");
  } catch (err) {
    if (err instanceof RateLimitError) {
      console.log(`Rate Limit! Retry nach ${err.retryAfter} Sekunden`);
    } else if (err instanceof ValidationError) {
      console.log("Validierungsfehler:", err.details);
    } else if (err instanceof NetworkError) {
      console.log("Netzwerkfehler:", err.message);
    } else if (err instanceof SplitwiseApiError) {
      // Catch-all für alle anderen API-Fehler
      console.log(`API-Fehler ${err.status}: ${err.message}`);
      console.log(`Retryable: ${err.retryable}`);
    }
  }
}

await safeRequest();
