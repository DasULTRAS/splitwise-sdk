import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  AuthenticationError,
  NotFoundError,
  SplitwiseApiError,
} from "../../src/core/errors.js";
import { SilentLogger } from "../../src/core/logger.js";
import { Splitwise } from "../../src/index.js";

/**
 * Helper that creates a mock fetch response.
 */
function mockFetch(
  status: number,
  body: unknown,
  headers?: Record<string, string>,
): typeof globalThis.fetch {
  return (async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers(headers ?? {}),
    json: async () => body,
    text: async () => JSON.stringify(body),
  })) as unknown as typeof globalThis.fetch;
}

describe("Splitwise Client", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  it("should expose all repository properties", () => {
    const sw = new Splitwise({
      accessToken: "test-token",
      logger: new SilentLogger(),
    });

    assert.ok(sw.users);
    assert.ok(sw.groups);
    assert.ok(sw.expenses);
    assert.ok(sw.friends);
    assert.ok(sw.comments);
    assert.ok(sw.notifications);
    assert.ok(sw.currencies);
    assert.ok(sw.categories);
  });

  it("should accept a string token", async (t) => {
    const sw = new Splitwise({
      accessToken: "test-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 0 },
      cache: { enabled: false },
    });

    globalThis.fetch = mockFetch(200, { user: { id: 1, first_name: "Test" } });
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const result = await sw.users.getCurrentUser();
    assert.ok(result.user);
    assert.equal(result.user.id, 1);
  });

  it("should accept a function token provider", async (t) => {
    let tokenCallCount = 0;
    const sw = new Splitwise({
      accessToken: () => {
        tokenCallCount++;
        return "dynamic-token";
      },
      logger: new SilentLogger(),
      retry: { maxRetries: 0 },
      cache: { enabled: false },
    });

    globalThis.fetch = mockFetch(200, { user: { id: 1 } });
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    await sw.users.getCurrentUser();
    assert.ok(tokenCallCount > 0);
  });

  it("should accept an async token provider", async (t) => {
    const sw = new Splitwise({
      accessToken: async () => "async-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 0 },
      cache: { enabled: false },
    });

    globalThis.fetch = mockFetch(200, { user: { id: 1 } });
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const result = await sw.users.getCurrentUser();
    assert.ok(result.user);
  });

  it("should throw AuthenticationError for missing token", async (t) => {
    const sw = new Splitwise({
      accessToken: "",
      logger: new SilentLogger(),
      retry: { maxRetries: 0 },
    });

    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    await assert.rejects(
      () => sw.users.getCurrentUser(),
      (err: unknown) => {
        assert.ok(err instanceof AuthenticationError);
        return true;
      },
    );
  });

  it("should throw NotFoundError for 404 responses", async (t) => {
    const sw = new Splitwise({
      accessToken: "valid-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 0 },
      cache: { enabled: false },
    });

    globalThis.fetch = mockFetch(404, { errors: { base: ["Not found"] } });
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    await assert.rejects(
      () => sw.users.getUser(9999),
      (err: unknown) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal((err as NotFoundError).status, 404);
        return true;
      },
    );
  });

  it("should set Bearer header on requests", async (t) => {
    const sw = new Splitwise({
      accessToken: "my-secret-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 0 },
      cache: { enabled: false },
    });

    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = (async (_url: unknown, init: RequestInit) => {
      capturedHeaders = init.headers as Record<string, string>;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ user: { id: 1 } }),
      };
    }) as unknown as typeof globalThis.fetch;
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    await sw.users.getCurrentUser();
    assert.equal(capturedHeaders["Authorization"], "Bearer my-secret-token");
    assert.equal(capturedHeaders["Content-Type"], "application/json");
  });
});

describe("Splitwise – Users Repository", () => {
  let sw: Splitwise;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    sw = new Splitwise({
      accessToken: "test-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 0 },
      cache: { enabled: false },
    });
  });

  it("should get current user", async (t) => {
    globalThis.fetch = mockFetch(200, { user: { id: 1, first_name: "Alice" } });
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const result = await sw.users.getCurrentUser();
    assert.equal(result.user?.first_name, "Alice");
  });

  it("should get user by id", async (t) => {
    globalThis.fetch = mockFetch(200, { user: { id: 42, first_name: "Bob" } });
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const result = await sw.users.getUser(42);
    assert.equal(result.user?.id, 42);
  });

  it("should update user", async (t) => {
    let capturedBody: unknown;
    globalThis.fetch = (async (_url: unknown, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string);
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ id: 1, first_name: "Updated" }),
      };
    }) as unknown as typeof globalThis.fetch;
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    await sw.users.updateUser(1, { first_name: "Updated" });
    assert.deepEqual(capturedBody, { first_name: "Updated" });
  });
});

describe("Splitwise – Expenses Repository", () => {
  let sw: Splitwise;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    sw = new Splitwise({
      accessToken: "test-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 0 },
      cache: { enabled: false },
    });
  });

  it("should list expenses with query params", async (t) => {
    let capturedUrl = "";
    globalThis.fetch = (async (url: string) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ expenses: [] }),
      };
    }) as unknown as typeof globalThis.fetch;
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    await sw.expenses.getExpenses({ group_id: 5, limit: 10 });
    assert.ok(capturedUrl.includes("group_id=5"));
    assert.ok(capturedUrl.includes("limit=10"));
  });

  it("should get expense by id", async (t) => {
    globalThis.fetch = mockFetch(200, { expense: { id: 123 } });
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const result = await sw.expenses.getExpense(123);
    assert.equal(result.expense?.id, 123);
  });
});

describe("Splitwise – Retry behavior", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  it("should retry on 500 and succeed", async (t) => {
    let callCount = 0;
    const sw = new Splitwise({
      accessToken: "test-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10 },
      cache: { enabled: false },
    });

    globalThis.fetch = (async () => {
      callCount++;
      if (callCount < 3) {
        return {
          ok: false,
          status: 500,
          headers: new Headers(),
          json: async () => ({ error: "internal" }),
          text: async () => '{"error":"internal"}',
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ user: { id: 1 } }),
      };
    }) as unknown as typeof globalThis.fetch;
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    const result = await sw.users.getCurrentUser();
    assert.equal(callCount, 3);
    assert.ok(result.user);
  });

  it("should throw after exhausting retries", async (t) => {
    const sw = new Splitwise({
      accessToken: "test-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 10 },
      cache: { enabled: false },
    });

    globalThis.fetch = mockFetch(500, { error: "always fails" });
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    await assert.rejects(
      () => sw.users.getCurrentUser(),
      (err: unknown) => {
        assert.ok(err instanceof SplitwiseApiError);
        assert.equal((err as SplitwiseApiError).status, 500);
        return true;
      },
    );
  });

  it("should not retry 400 errors", async (t) => {
    let callCount = 0;
    const sw = new Splitwise({
      accessToken: "test-token",
      logger: new SilentLogger(),
      retry: { maxRetries: 3, baseDelayMs: 1 },
      cache: { enabled: false },
    });

    globalThis.fetch = (async () => {
      callCount++;
      return {
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({ errors: { base: ["bad request"] } }),
        text: async () => '{"errors":{"base":["bad request"]}}',
      };
    }) as unknown as typeof globalThis.fetch;
    t.after(() => {
      globalThis.fetch = originalFetch;
    });

    await assert.rejects(() => sw.users.getCurrentUser());
    assert.equal(callCount, 1); // No retries for 400
  });
});
