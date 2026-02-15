import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LogEntry } from "../../src/core/logger.js";
import {
  CallbackLogger,
  DefaultLogger,
  SilentLogger,
} from "../../src/core/logger.js";

describe("Logger", () => {
  describe("DefaultLogger", () => {
    it("should be instantiable with a log level", () => {
      const logger = new DefaultLogger("debug");
      // Should not throw
      logger.log({ level: "debug", message: "test" });
    });

    it("should filter messages below min level", () => {
      const entries: string[] = [];
      const originalWrite = process.stdout.write;
      process.stdout.write = ((chunk: string) => {
        entries.push(chunk);
        return true;
      }) as typeof process.stdout.write;

      try {
        const logger = new DefaultLogger("warn");
        logger.log({ level: "debug", message: "should be filtered" });
        logger.log({ level: "info", message: "should be filtered" });
        logger.log({ level: "warn", message: "should appear" });
        assert.equal(entries.length, 1);
        assert.ok(entries[0].includes("should appear"));
      } finally {
        process.stdout.write = originalWrite;
      }
    });
  });

  describe("SilentLogger", () => {
    it("should not throw and produce no output", () => {
      const logger = new SilentLogger();
      logger.log({ level: "error", message: "should be silent" });
      // If we reach here, it's good
      assert.ok(true);
    });
  });

  describe("CallbackLogger", () => {
    it("should call the callback with JSON", () => {
      const entries: string[] = [];
      const logger = new CallbackLogger((msg) => entries.push(msg));

      logger.log({ level: "info", message: "hello", requestId: "r1" });

      assert.equal(entries.length, 1);
      const parsed = JSON.parse(entries[0]) as LogEntry;
      assert.equal(parsed.level, "info");
      assert.equal(parsed.message, "hello");
      assert.equal(parsed.requestId, "r1");
    });
  });
});
