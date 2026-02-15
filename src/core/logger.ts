/**
 * Structured logger for the Splitwise SDK.
 *
 * Every HTTP request logs:
 *   - request started
 *   - request succeeded / request failed
 *
 * Standard log fields: requestId, method, endpoint, status, durationMs, retryCount.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  method?: string;
  endpoint?: string;
  status?: number;
  durationMs?: number;
  retryCount?: number;
  error?: string;
  [key: string]: unknown;
}

export interface Logger {
  log(entry: LogEntry): void;
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Default lightweight logger that writes JSON lines to stdout/stderr.
 */
export class DefaultLogger implements Logger {
  constructor(private readonly minLevel: LogLevel = "info") {}

  log(entry: LogEntry): void {
    if (LOG_LEVEL_ORDER[entry.level] < LOG_LEVEL_ORDER[this.minLevel]) return;

    const line = JSON.stringify(entry);
    if (entry.level === "error") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  }
}

/**
 * Silent logger – discards all output. Useful for tests.
 */
export class SilentLogger implements Logger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log(_entry: LogEntry): void {
    // intentionally empty
  }
}

/**
 * Adapter that wraps a simple `(message: string) => void` callback
 * into the structured Logger interface.
 */
export class CallbackLogger implements Logger {
  constructor(private readonly callback: (message: string) => void) {}

  log(entry: LogEntry): void {
    this.callback(JSON.stringify(entry));
  }
}
