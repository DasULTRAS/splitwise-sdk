import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NetworkError,
  RateLimitError,
  SplitwiseApiError,
} from "../../src/core/errors.js";
import {
  computeDelay,
  DEFAULT_RETRY_CONFIG,
  shouldRetry,
} from "../../src/utils/retry.js";

describe("Retry", () => {
  describe("shouldRetry", () => {
    it("should retry a retryable error on first attempt", () => {
      const err = new SplitwiseApiError("fail", 500, "/api", "r1");
      assert.equal(shouldRetry(err, 0, DEFAULT_RETRY_CONFIG), true);
    });

    it("should retry a network error", () => {
      const err = new NetworkError("timeout");
      assert.equal(shouldRetry(err, 0, DEFAULT_RETRY_CONFIG), true);
    });

    it("should not retry when max retries reached", () => {
      const err = new SplitwiseApiError("fail", 500, "/api", "r1");
      assert.equal(shouldRetry(err, 3, DEFAULT_RETRY_CONFIG), false);
    });

    it("should not retry a non-retryable error", () => {
      const err = new SplitwiseApiError("fail", 400, "/api", "r1");
      assert.equal(shouldRetry(err, 0, DEFAULT_RETRY_CONFIG), false);
    });

    it("should not retry when maxRetries is 0", () => {
      const err = new SplitwiseApiError("fail", 500, "/api", "r1");
      assert.equal(
        shouldRetry(err, 0, { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 }),
        false,
      );
    });

    it("should retry 429 errors", () => {
      const err = new RateLimitError("/api", "r1", 10);
      assert.equal(shouldRetry(err, 0, DEFAULT_RETRY_CONFIG), true);
    });

    it("should retry 502 errors", () => {
      const err = new SplitwiseApiError("fail", 502, "/api", "r1");
      assert.equal(shouldRetry(err, 0, DEFAULT_RETRY_CONFIG), true);
    });

    it("should retry 503 errors", () => {
      const err = new SplitwiseApiError("fail", 503, "/api", "r1");
      assert.equal(shouldRetry(err, 0, DEFAULT_RETRY_CONFIG), true);
    });
  });

  describe("computeDelay", () => {
    it("should use retryAfter from RateLimitError", () => {
      const err = new RateLimitError("/api", "r1", 5);
      const delay = computeDelay(err, 0, DEFAULT_RETRY_CONFIG);
      assert.equal(delay, 5000); // 5 seconds * 1000
    });

    it("should cap retryAfter at maxDelayMs", () => {
      const err = new RateLimitError("/api", "r1", 60);
      const delay = computeDelay(err, 0, {
        ...DEFAULT_RETRY_CONFIG,
        maxDelayMs: 10_000,
      });
      assert.equal(delay, 10_000);
    });

    it("should use exponential backoff for non-RateLimit errors", () => {
      const err = new SplitwiseApiError("fail", 500, "/api", "r1");
      const delay = computeDelay(err, 0, DEFAULT_RETRY_CONFIG);
      // baseDelay * 2^0 = 500, jitter makes it 0..500
      assert.ok(delay >= 0 && delay <= 500);
    });

    it("should increase delay with attempt number", () => {
      const err = new SplitwiseApiError("fail", 500, "/api", "r1");
      // attempt 2: baseDelay * 2^2 = 2000, jitter makes it 0..2000
      const delay = computeDelay(err, 2, DEFAULT_RETRY_CONFIG);
      assert.ok(delay >= 0 && delay <= 2000);
    });

    it("should cap exponential at maxDelayMs", () => {
      const err = new SplitwiseApiError("fail", 500, "/api", "r1");
      const delay = computeDelay(err, 10, {
        ...DEFAULT_RETRY_CONFIG,
        maxDelayMs: 5000,
      });
      assert.ok(delay <= 5000);
    });
  });
});
