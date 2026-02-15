import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NetworkError,
  NotFoundError,
  parseHttpError,
  RateLimitError,
  SplitwiseApiError,
  SplitwiseError,
  ValidationError,
} from "../../src/core/errors.js";

describe("Error Hierarchy", () => {
  describe("SplitwiseError", () => {
    it("should be an instance of Error", () => {
      const err = new SplitwiseError("test");
      assert.ok(err instanceof Error);
      assert.ok(err instanceof SplitwiseError);
      assert.equal(err.message, "test");
      assert.equal(err.name, "SplitwiseError");
    });

    it("should support a cause", () => {
      const cause = new Error("root cause");
      const err = new SplitwiseError("wrapper", cause);
      assert.equal(err.cause, cause);
    });
  });

  describe("SplitwiseApiError", () => {
    it("should include status, endpoint, and requestId", () => {
      const err = new SplitwiseApiError("fail", 500, "/test", "req-1", {
        detail: "x",
      });
      assert.ok(err instanceof SplitwiseError);
      assert.ok(err instanceof SplitwiseApiError);
      assert.equal(err.status, 500);
      assert.equal(err.endpoint, "/test");
      assert.equal(err.requestId, "req-1");
      assert.deepEqual(err.details, { detail: "x" });
    });

    it("should mark 500 as retryable", () => {
      const err = new SplitwiseApiError("fail", 500, "/test", "req-1");
      assert.equal(err.retryable, true);
    });

    it("should mark 400 as not retryable", () => {
      const err = new SplitwiseApiError("fail", 400, "/test", "req-1");
      assert.equal(err.retryable, false);
    });
  });

  describe("AuthenticationError", () => {
    it("should have status 401", () => {
      const err = new AuthenticationError("/api", "req-1");
      assert.equal(err.status, 401);
      assert.equal(err.name, "AuthenticationError");
      assert.ok(err instanceof SplitwiseApiError);
      assert.equal(err.retryable, false);
    });
  });

  describe("AuthorizationError", () => {
    it("should have status 403", () => {
      const err = new AuthorizationError("/api", "req-1");
      assert.equal(err.status, 403);
      assert.equal(err.name, "AuthorizationError");
      assert.equal(err.retryable, false);
    });
  });

  describe("NotFoundError", () => {
    it("should have status 404", () => {
      const err = new NotFoundError("/api/123", "req-1");
      assert.equal(err.status, 404);
      assert.equal(err.name, "NotFoundError");
      assert.ok(err.message.includes("/api/123"));
      assert.equal(err.retryable, false);
    });
  });

  describe("ValidationError", () => {
    it("should accept 400 or 422", () => {
      const err400 = new ValidationError(400, "/api", "req-1");
      assert.equal(err400.status, 400);

      const err422 = new ValidationError(422, "/api", "req-1");
      assert.equal(err422.status, 422);
    });
  });

  describe("ConflictError", () => {
    it("should have status 409", () => {
      const err = new ConflictError("/api", "req-1");
      assert.equal(err.status, 409);
      assert.equal(err.retryable, false);
    });
  });

  describe("RateLimitError", () => {
    it("should have status 429 and retryAfter", () => {
      const err = new RateLimitError("/api", "req-1", 30);
      assert.equal(err.status, 429);
      assert.equal(err.retryAfter, 30);
      assert.equal(err.retryable, true);
    });

    it("should handle undefined retryAfter", () => {
      const err = new RateLimitError("/api", "req-1", undefined);
      assert.equal(err.retryAfter, undefined);
      assert.equal(err.retryable, true);
    });
  });

  describe("NetworkError", () => {
    it("should always be retryable", () => {
      const err = new NetworkError("timeout");
      assert.ok(err instanceof SplitwiseError);
      assert.equal(err.retryable, true);
      assert.equal(err.name, "NetworkError");
    });
  });
});

describe("parseHttpError", () => {
  it("should return AuthenticationError for 401", () => {
    const err = parseHttpError(401, "/api", "r1", { error: "unauthorized" });
    assert.ok(err instanceof AuthenticationError);
    assert.equal(err.status, 401);
  });

  it("should return AuthorizationError for 403", () => {
    const err = parseHttpError(403, "/api", "r1", {});
    assert.ok(err instanceof AuthorizationError);
  });

  it("should return NotFoundError for 404", () => {
    const err = parseHttpError(404, "/api", "r1", {});
    assert.ok(err instanceof NotFoundError);
  });

  it("should return ValidationError for 400", () => {
    const err = parseHttpError(400, "/api", "r1", {});
    assert.ok(err instanceof ValidationError);
    assert.equal(err.status, 400);
  });

  it("should return ValidationError for 422", () => {
    const err = parseHttpError(422, "/api", "r1", {});
    assert.ok(err instanceof ValidationError);
    assert.equal(err.status, 422);
  });

  it("should return ConflictError for 409", () => {
    const err = parseHttpError(409, "/api", "r1", {});
    assert.ok(err instanceof ConflictError);
  });

  it("should return RateLimitError for 429 with Retry-After", () => {
    const err = parseHttpError(429, "/api", "r1", {}, "60");
    assert.ok(err instanceof RateLimitError);
    assert.equal((err as RateLimitError).retryAfter, 60);
  });

  it("should return RateLimitError for 429 without Retry-After", () => {
    const err = parseHttpError(429, "/api", "r1", {}, null);
    assert.ok(err instanceof RateLimitError);
    assert.equal((err as RateLimitError).retryAfter, undefined);
  });

  it("should return generic SplitwiseApiError for unknown status", () => {
    const err = parseHttpError(503, "/api", "r1", {});
    assert.ok(err instanceof SplitwiseApiError);
    assert.equal(err.status, 503);
    assert.equal(err.retryable, true);
  });
});
