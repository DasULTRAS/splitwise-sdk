/**
 * Error handling with typed error classes.
 *
 * The SDK throws specific error classes per HTTP status code.
 * Use `instanceof` to handle them.
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
  retry: { maxRetries: 0 }, // disable retries for this example
});

// ── Example 1: Resource not found ────────────────────────────────

async function getExpenseById(id: number): Promise<void> {
  try {
    const result = await sw.expenses.getExpense(id);
    console.log("Expense found:", result.expense?.description);
  } catch (err) {
    if (err instanceof NotFoundError) {
      console.log(`Expense ${id} not found (status: ${err.status})`);
      console.log(`Endpoint: ${err.endpoint}`);
      console.log(`Request ID: ${err.requestId}`);
    } else {
      throw err;
    }
  }
}

await getExpenseById(999999999);

// ── Example 2: Authentication error ─────────────────────────────

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
      console.log("\nAuthentication error: token is invalid");
      console.log(`Status: ${err.status}`);
    }
  }
}

await testInvalidToken();

// ── Example 3: Catch-all for API errors ──────────────────────────

async function safeRequest(): Promise<void> {
  try {
    await sw.users.getCurrentUser();
    console.log("\nRequest succeeded");
  } catch (err) {
    if (err instanceof RateLimitError) {
      console.log(`Rate limited! Retry after ${err.retryAfter} seconds`);
    } else if (err instanceof ValidationError) {
      console.log("Validation error:", err.details);
    } else if (err instanceof NetworkError) {
      console.log("Network error:", err.message);
    } else if (err instanceof SplitwiseApiError) {
      // catch-all for other API errors
      console.log(`API error ${err.status}: ${err.message}`);
      console.log(`Retryable: ${err.retryable}`);
    }
  }
}

await safeRequest();
