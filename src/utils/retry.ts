/**
 * Retry utilities for the Splitwise SDK.
 *
 * - Exponential backoff with jitter
 * - Respects `Retry-After` header (RateLimitError)
 * - Only retries retryable errors: network errors + HTTP 408/429/500/502/503/504
 */

import type { NetworkError, SplitwiseApiError } from "../core/errors.js";

export interface RetryConfig {
  /** Maximum number of retries. Default: 3. Set to 0 to disable. */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff. Default: 500. */
  baseDelayMs: number;
  /** Maximum delay in milliseconds. Default: 30 000. */
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 30_000,
};

type RetryableError = (SplitwiseApiError | NetworkError) & {
  retryable: boolean;
};

/**
 * Determine whether a given error should be retried.
 */
export function shouldRetry(
  error: RetryableError,
  attempt: number,
  config: RetryConfig,
): boolean {
  if (attempt >= config.maxRetries) return false;
  return error.retryable;
}

/**
 * Compute the delay before the next retry attempt.
 *
 * Uses exponential backoff with full jitter, capped at `maxDelayMs`.
 * If the error is a RateLimitError with a `retryAfter` value, that
 * value (in seconds) takes precedence.
 */
export function computeDelay(
  error: RetryableError,
  attempt: number,
  config: RetryConfig,
): number {
  // Respect Retry-After header for 429/503
  const retryAfter = (error as unknown as { retryAfter?: number }).retryAfter;
  if (typeof retryAfter === "number") {
    return Math.min(retryAfter * 1000, config.maxDelayMs);
  }

  // Exponential backoff with full jitter
  const exponential = config.baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, config.maxDelayMs);
  return Math.round(Math.random() * capped);
}
