/**
 * Splitwise SDK – public API surface.
 *
 * Usage:
 * ```ts
 * import { Splitwise } from "splitwise-sdk";
 *
 * const sw = new Splitwise({ accessToken: "your_token" });
 * const user = await sw.users.getCurrentUser();
 * ```
 */

import type { TokenProvider } from "./core/auth.js";
import { HttpClient, type HttpClientConfig } from "./core/http-client.js";
import type { Logger, LogLevel } from "./core/logger.js";
import { CallbackLogger, DefaultLogger } from "./core/logger.js";
import type { CacheConfig } from "./utils/cache.js";
import type { RetryConfig } from "./utils/retry.js";

import { CategoriesRepository } from "./repositories/categories.repository.js";
import { CommentsRepository } from "./repositories/comments.repository.js";
import { CurrenciesRepository } from "./repositories/currencies.repository.js";
import { ExpensesRepository } from "./repositories/expenses.repository.js";
import { FriendsRepository } from "./repositories/friends.repository.js";
import { GroupsRepository } from "./repositories/groups.repository.js";
import { NotificationsRepository } from "./repositories/notifications.repository.js";
import { UsersRepository } from "./repositories/users.repository.js";

// ── Options ──────────────────────────────────────────────────────────

export interface SplitwiseOptions {
  /**
   * Access token (string) or an async/sync function that returns one.
   * OAuth flow / token acquisition is the consumer's responsibility.
   */
  accessToken: TokenProvider;

  /** Base URL override for the Splitwise API. */
  baseUrl?: string;

  /**
   * Logger instance, callback, or log level string.
   * - `Logger` object: used directly
   * - `(msg: string) => void`: wrapped into a structured logger
   * - `LogLevel` string: creates a DefaultLogger at that level
   * - `undefined`: defaults to DefaultLogger("info")
   */
  logger?: Logger | ((message: string) => void) | LogLevel;

  /** Retry configuration. Set `{ maxRetries: 0 }` to disable retries. */
  retry?: Partial<RetryConfig>;

  /** Cache configuration. Set `{ enabled: false }` to disable caching. */
  cache?: Partial<CacheConfig>;
}

// ── Client ───────────────────────────────────────────────────────────

export class Splitwise {
  public readonly users: UsersRepository;
  public readonly groups: GroupsRepository;
  public readonly expenses: ExpensesRepository;
  public readonly friends: FriendsRepository;
  public readonly comments: CommentsRepository;
  public readonly notifications: NotificationsRepository;
  public readonly currencies: CurrenciesRepository;
  public readonly categories: CategoriesRepository;

  private readonly http: HttpClient;

  constructor(options: SplitwiseOptions) {
    const logger = resolveLogger(options.logger);

    const httpConfig: HttpClientConfig = {
      accessToken: options.accessToken,
      baseUrl: options.baseUrl,
      logger,
      retry: options.retry,
      cache: options.cache,
    };

    this.http = new HttpClient(httpConfig);

    this.users = new UsersRepository(this.http);
    this.groups = new GroupsRepository(this.http);
    this.expenses = new ExpensesRepository(this.http);
    this.friends = new FriendsRepository(this.http);
    this.comments = new CommentsRepository(this.http);
    this.notifications = new NotificationsRepository(this.http);
    this.currencies = new CurrenciesRepository(this.http);
    this.categories = new CategoriesRepository(this.http);
  }

  /** Clear the internal request cache. */
  clearCache(): void {
    this.http.clearCache();
  }

  /** Dispose the client: stop background timers and clear cache. */
  dispose(): void {
    this.http.dispose();
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function resolveLogger(
  input?: Logger | ((message: string) => void) | LogLevel,
): Logger {
  if (!input) return new DefaultLogger();
  if (typeof input === "string") return new DefaultLogger(input);
  if (typeof input === "function") return new CallbackLogger(input);
  return input;
}

// ── Re-exports ───────────────────────────────────────────────────────

// Error hierarchy
export {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  SplitwiseApiError,
  SplitwiseError,
  ValidationError,
} from "./core/errors.js";

// Logger utilities
export { CallbackLogger, DefaultLogger, SilentLogger } from "./core/logger.js";
export type { LogEntry, Logger, LogLevel } from "./core/logger.js";

// Auth type
export type { TokenProvider } from "./core/auth.js";

// Config types
export type { HttpClientConfig } from "./core/http-client.js";
export type { CacheConfig } from "./utils/cache.js";
export type { RetryConfig } from "./utils/retry.js";

// Generated types – re-export for consumer convenience
export type * from "./generated/types.gen.js";

// Repositories
export {
  CategoriesRepository,
  CommentsRepository,
  CurrenciesRepository,
  ExpensesRepository,
  FriendsRepository,
  GroupsRepository,
  NotificationsRepository,
  UsersRepository,
} from "./repositories/index.js";
