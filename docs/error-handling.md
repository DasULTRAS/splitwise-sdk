# Error Handling

## Error Hierarchy

The SDK maps HTTP status codes to typed error classes:

```
Error
└── SplitwiseError
    ├── SplitwiseApiError
    │   ├── AuthenticationError   (401)
    │   ├── AuthorizationError    (403)
    │   ├── NotFoundError         (404)
    │   ├── ValidationError       (400 / 422)
    │   ├── ConflictError         (409)
    │   └── RateLimitError        (429)
    └── NetworkError              (fetch / timeout)
```

## Usage

### Basic Error Handling

```typescript
import { Splitwise, NotFoundError, ValidationError } from "splitwise-sdk";

const sw = new Splitwise({ accessToken: "your_token" });

try {
  await sw.expenses.getExpense(999);
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log(`Resource not found: ${err.endpoint}`);
  } else if (err instanceof ValidationError) {
    console.log(`Validation error:`, err.details);
  } else {
    throw err; // re-throw unknown errors
  }
}
```

### Error Classes

#### `SplitwiseError`

Base class for all SDK errors.

```typescript
const err = new SplitwiseError("Something went wrong", cause);
err.message; // "Something went wrong"
err.cause; // original error (optional)
```

#### `SplitwiseApiError`

Base class for all HTTP API errors.

```typescript
err.status; // HTTP status code (e.g. 500)
err.endpoint; // called endpoint (e.g. "/get_expense/123")
err.requestId; // UUID for correlation
err.details; // response body (if available)
err.retryable; // true for 5xx, 429; false for 4xx
```

#### `AuthenticationError` (401)

Access token is missing or invalid.

```typescript
if (err instanceof AuthenticationError) {
  // refresh token and retry
}
```

#### `AuthorizationError` (403)

Access denied — insufficient permissions.

#### `NotFoundError` (404)

Requested resource does not exist.

#### `ValidationError` (400 / 422)

Request contains invalid data.

```typescript
if (err instanceof ValidationError) {
  console.log(err.details); // API validation errors
}
```

#### `ConflictError` (409)

Request conflict (e.g. duplicate creation).

#### `RateLimitError` (429)

Rate limit exceeded. Contains `retryAfter` in seconds.

```typescript
if (err instanceof RateLimitError) {
  console.log(`Wait ${err.retryAfter} seconds`);
}
```

#### `NetworkError`

Network failure (DNS, timeout, connection reset). Always retryable.

## Error Properties

| Property     | Type                  | Available in                            |
| ------------ | --------------------- | --------------------------------------- |
| `message`    | `string`              | All                                     |
| `cause`      | `unknown`             | All                                     |
| `status`     | `number`              | `SplitwiseApiError`+                    |
| `endpoint`   | `string`              | `SplitwiseApiError`+                    |
| `requestId`  | `string`              | `SplitwiseApiError`+                    |
| `details`    | `unknown`             | `SplitwiseApiError`+                    |
| `retryable`  | `boolean`             | `SplitwiseApiError`+ and `NetworkError` |
| `retryAfter` | `number \| undefined` | `RateLimitError`                        |

## Retry Behavior

The HTTP layer checks errors for retryability:

- **Retryable**: `NetworkError`, HTTP 429, 500, 502, 503, 504
- **Not retryable**: HTTP 400, 401, 403, 404, 409, 422

See [Retry & Caching](retry-caching.md) for retry strategy details.

## `instanceof` Checks

All error classes support `instanceof`:

```typescript
import {
  SplitwiseError,
  SplitwiseApiError,
  AuthenticationError,
} from "splitwise-sdk";

try {
  await sw.users.getCurrentUser();
} catch (err) {
  err instanceof AuthenticationError; // true for 401
  err instanceof SplitwiseApiError; // true for all HTTP errors
  err instanceof SplitwiseError; // true for all SDK errors
  err instanceof Error; // true
}
```
