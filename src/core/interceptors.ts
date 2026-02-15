/**
 * Interceptors for the HTTP client.
 *
 * Provides request/response interceptor infrastructure that:
 *   - Injects the Bearer token header
 *   - Generates and propagates requestId
 *   - Measures request duration
 *   - Logs request lifecycle events
 *   - Parses errors through the error hierarchy
 *   - Invokes retry logic for retryable failures
 */

import { randomUUID } from "node:crypto";
import { computeDelay, shouldRetry, type RetryConfig } from "../utils/retry.js";
import { bearerHeader, resolveToken, type TokenProvider } from "./auth.js";
import { NetworkError, parseHttpError, SplitwiseApiError } from "./errors.js";
import type { Logger } from "./logger.js";

export interface InterceptorContext {
  tokenProvider: TokenProvider;
  logger: Logger;
  retry: RetryConfig;
}

/**
 * Execute an HTTP request with auth injection, structured logging,
 * error parsing, and retry logic.
 */
export async function executeWithInterceptors<T>(
  ctx: InterceptorContext,
  method: string,
  endpoint: string,
  performRequest: (headers: Record<string, string>) => Promise<Response>,
): Promise<T> {
  const requestId = randomUUID();
  const { logger, retry } = ctx;

  let lastError: SplitwiseApiError | NetworkError | undefined;

  for (let attempt = 0; attempt <= retry.maxRetries; attempt++) {
    const startTime = performance.now();

    try {
      const token = await resolveToken(ctx.tokenProvider);
      const headers: Record<string, string> = {
        Authorization: bearerHeader(token),
        "Content-Type": "application/json",
      };

      logger.log({
        level: "debug",
        message: "request started",
        requestId,
        method,
        endpoint,
        retryCount: attempt,
      });

      const response = await performRequest(headers);
      const durationMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        logger.log({
          level: "info",
          message: "request succeeded",
          requestId,
          method,
          endpoint,
          status: response.status,
          durationMs,
          retryCount: attempt,
        });
        return (await response.json()) as T;
      }

      // Non-OK response → parse into typed error
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => undefined);
      }

      const error = parseHttpError(
        response.status,
        endpoint,
        requestId,
        body,
        response.headers.get("Retry-After"),
      );

      logger.log({
        level: "error",
        message: "request failed",
        requestId,
        method,
        endpoint,
        status: response.status,
        durationMs,
        retryCount: attempt,
        error: error.name,
      });

      if (shouldRetry(error, attempt, retry)) {
        lastError = error;
        const delay = computeDelay(error, attempt, retry);
        await sleep(delay);
        continue;
      }

      throw error;
    } catch (err) {
      const durationMs = Math.round(performance.now() - startTime);

      // Already a SplitwiseApiError re-thrown from above
      if (err instanceof SplitwiseApiError) {
        throw err;
      }

      // Network / fetch level error
      const networkError = new NetworkError(
        (err as Error).message ?? "Network request failed",
        err,
      );

      logger.log({
        level: "error",
        message: "request failed",
        requestId,
        method,
        endpoint,
        durationMs,
        retryCount: attempt,
        error: networkError.name,
      });

      if (shouldRetry(networkError, attempt, retry)) {
        lastError = networkError;
        const delay = computeDelay(networkError, attempt, retry);
        await sleep(delay);
        continue;
      }

      throw networkError;
    }
  }

  // If we exhausted retries, throw the last error
  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
