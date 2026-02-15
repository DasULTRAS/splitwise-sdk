import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bearerHeader, resolveToken } from "../../src/core/auth.js";
import { AuthenticationError } from "../../src/core/errors.js";

describe("Auth", () => {
  describe("resolveToken", () => {
    it("should return a string token directly", async () => {
      const token = await resolveToken("my-token");
      assert.equal(token, "my-token");
    });

    it("should call a sync function to get the token", async () => {
      const token = await resolveToken(() => "dynamic-token");
      assert.equal(token, "dynamic-token");
    });

    it("should call an async function to get the token", async () => {
      const token = await resolveToken(async () => "async-token");
      assert.equal(token, "async-token");
    });

    it("should throw AuthenticationError for empty string", async () => {
      await assert.rejects(
        () => resolveToken(""),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationError);
          return true;
        },
      );
    });

    it("should throw AuthenticationError when provider returns empty string", async () => {
      await assert.rejects(
        () => resolveToken(() => ""),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationError);
          return true;
        },
      );
    });
  });

  describe("bearerHeader", () => {
    it("should format a Bearer header", () => {
      assert.equal(bearerHeader("abc123"), "Bearer abc123");
    });
  });
});
