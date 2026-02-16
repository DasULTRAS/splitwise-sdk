/**
 * Typed error hierarchy for the Splitwise SDK.
 *
 * SplitwiseError (base)
 * ├── SplitwiseApiError (HTTP API errors with status, endpoint, requestId)
 * │   ├── AuthenticationError (401)
 * │   ├── AuthorizationError (403)
 * │   ├── NotFoundError (404)
 * │   ├── ValidationError (400/422)
 * │   ├── ConflictError (409)
 * │   └── RateLimitError (429, includes retryAfter)
 * └── NetworkError (fetch/network/timeout failures)
 */

export class SplitwiseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SplitwiseError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SplitwiseApiError extends SplitwiseError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
    public readonly requestId: string,
    public readonly details?: unknown,
    cause?: unknown,
  ) {
    super(message, cause);
    this.name = "SplitwiseApiError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Whether this error is eligible for automatic retry. */
  get retryable(): boolean {
    return [408, 429, 500, 502, 503, 504].includes(this.status);
  }
}

export class AuthenticationError extends SplitwiseApiError {
  constructor(
    endpoint: string,
    requestId: string,
    details?: unknown,
    cause?: unknown,
  ) {
    super(
      "Authentication failed – invalid or missing access token",
      401,
      endpoint,
      requestId,
      details,
      cause,
    );
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthorizationError extends SplitwiseApiError {
  constructor(
    endpoint: string,
    requestId: string,
    details?: unknown,
    cause?: unknown,
  ) {
    super(
      "Authorization failed – insufficient permissions",
      403,
      endpoint,
      requestId,
      details,
      cause,
    );
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends SplitwiseApiError {
  constructor(
    endpoint: string,
    requestId: string,
    details?: unknown,
    cause?: unknown,
  ) {
    super(
      `Resource not found: ${endpoint}`,
      404,
      endpoint,
      requestId,
      details,
      cause,
    );
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends SplitwiseApiError {
  constructor(
    status: 400 | 422,
    endpoint: string,
    requestId: string,
    details?: unknown,
    cause?: unknown,
  ) {
    super("Validation failed", status, endpoint, requestId, details, cause);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends SplitwiseApiError {
  constructor(
    endpoint: string,
    requestId: string,
    details?: unknown,
    cause?: unknown,
  ) {
    super("Conflict", 409, endpoint, requestId, details, cause);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RateLimitError extends SplitwiseApiError {
  constructor(
    endpoint: string,
    requestId: string,
    public readonly retryAfter: number | undefined,
    details?: unknown,
    cause?: unknown,
  ) {
    super("Rate limit exceeded", 429, endpoint, requestId, details, cause);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  override get retryable(): boolean {
    return true;
  }
}

export class NetworkError extends SplitwiseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get retryable(): boolean {
    return true;
  }
}

/**
 * Parse a Retry-After header value into seconds.
 * Supports both numeric seconds and HTTP-Date format (RFC 9110 §10.2.3).
 */
export function parseRetryAfter(
  header: string | null | undefined,
): number | undefined {
  if (!header) return undefined;

  // Try numeric seconds first
  const seconds = Number(header);
  if (!isNaN(seconds) && seconds >= 0) {
    return seconds;
  }

  // Try HTTP-Date
  const date = new Date(header);
  if (!isNaN(date.getTime())) {
    const diffMs = date.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 1000));
  }

  return undefined;
}

/**
 * Parse an HTTP response into the appropriate error class.
 */
export function parseHttpError(
  status: number,
  endpoint: string,
  requestId: string,
  body: unknown,
  retryAfterHeader?: string | null,
): SplitwiseApiError {
  switch (status) {
    case 401:
      return new AuthenticationError(endpoint, requestId, body);
    case 403:
      return new AuthorizationError(endpoint, requestId, body);
    case 404:
      return new NotFoundError(endpoint, requestId, body);
    case 400:
    case 422:
      return new ValidationError(status, endpoint, requestId, body);
    case 409:
      return new ConflictError(endpoint, requestId, body);
    case 429: {
      const retryAfter = parseRetryAfter(retryAfterHeader);
      return new RateLimitError(endpoint, requestId, retryAfter, body);
    }
    default:
      return new SplitwiseApiError(
        `API request failed with status ${status}`,
        status,
        endpoint,
        requestId,
        body,
      );
  }
}
