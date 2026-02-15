/**
 * Central HTTP client for the Splitwise SDK.
 *
 * Wires together: auth, interceptors, retry, logging, caching.
 * Repositories use this client for all HTTP communication.
 */

import {
  DEFAULT_CACHE_CONFIG,
  RequestCache,
  type CacheConfig,
} from "../utils/cache.js";
import type { RetryConfig } from "../utils/retry.js";
import { DEFAULT_RETRY_CONFIG } from "../utils/retry.js";
import type { TokenProvider } from "./auth.js";
import { resolveToken } from "./auth.js";
import {
  executeWithInterceptors,
  type InterceptorContext,
} from "./interceptors.js";
import type { Logger } from "./logger.js";
import { DefaultLogger } from "./logger.js";

const DEFAULT_BASE_URL = "https://secure.splitwise.com/api/v3.0";

export interface HttpClientConfig {
  /** Access token or async provider function. Required. */
  accessToken: TokenProvider;
  /** Base URL for the Splitwise API. */
  baseUrl?: string;
  /** Logger instance. */
  logger?: Logger;
  /** Retry configuration. */
  retry?: Partial<RetryConfig>;
  /** Cache configuration. */
  cache?: Partial<CacheConfig>;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly logger: Logger;
  private readonly retryConfig: RetryConfig;
  private readonly cache: RequestCache;
  private readonly tokenProvider: TokenProvider;

  constructor(config: HttpClientConfig) {
    this.tokenProvider = config.accessToken;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.logger = config.logger ?? new DefaultLogger();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retry };
    this.cache = new RequestCache({ ...DEFAULT_CACHE_CONFIG, ...config.cache });
  }

  private get interceptorContext(): InterceptorContext {
    return {
      tokenProvider: this.tokenProvider,
      logger: this.logger,
      retry: this.retryConfig,
    };
  }

  /**
   * Perform a GET request. Results may be served from cache or deduplicated.
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const token = await resolveToken(this.tokenProvider);
    const fingerprint = RequestCache.tokenFingerprint(token);
    const cacheKey = this.cache.buildKey(endpoint, params, fingerprint);

    // Check cache
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== undefined) {
      this.logger.log({
        level: "debug",
        message: "cache hit",
        endpoint,
        requestId: "cached",
      });
      return cached;
    }

    // Dedup + fetch
    return this.cache.dedup(cacheKey, async () => {
      const url = this.buildUrl(endpoint, params);
      const result = await executeWithInterceptors<T>(
        this.interceptorContext,
        "GET",
        endpoint,
        (headers) => fetch(url, { method: "GET", headers }),
      );
      this.cache.set(cacheKey, result, endpoint);
      return result;
    });
  }

  /**
   * Perform a POST request. Invalidates related caches.
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    invalidatePrefix?: string,
  ): Promise<T> {
    const result = await executeWithInterceptors<T>(
      this.interceptorContext,
      "POST",
      endpoint,
      (headers) =>
        fetch(this.buildUrl(endpoint), {
          method: "POST",
          headers,
          body: body ? JSON.stringify(body) : undefined,
        }),
    );

    // Invalidate related cached GET results
    if (invalidatePrefix) {
      this.cache.invalidate(invalidatePrefix);
    }

    return result;
  }

  /**
   * Clear the request cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    let url = `${this.baseUrl}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          qs.append(key, String(value));
        }
      }
      url += `?${qs.toString()}`;
    }
    return url;
  }
}
