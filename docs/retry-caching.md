# Retry & Caching

## Retry

### Strategy

The SDK uses **exponential backoff with jitter** for transient errors:

```
delay = min(baseDelayMs × 2^attempt, maxDelayMs) × random(0..1)
```

For `RateLimitError` (429), the `Retry-After` header is respected.

### Configuration

```typescript
import { Splitwise } from "splitwise-sdk";

const sw = new Splitwise({
  accessToken: "your_token",
  retry: {
    maxRetries: 3, // default: 3
    baseDelayMs: 500, // default: 500ms
    maxDelayMs: 30_000, // default: 30s
  },
});
```

### Retryable Errors

| Error type            | Status | Retry? |
| --------------------- | ------ | ------ |
| `NetworkError`        | –      | Yes    |
| `RateLimitError`      | 429    | Yes    |
| `SplitwiseApiError`   | 500    | Yes    |
| `SplitwiseApiError`   | 502    | Yes    |
| `SplitwiseApiError`   | 503    | Yes    |
| `SplitwiseApiError`   | 504    | Yes    |
| `ValidationError`     | 400    | No     |
| `AuthenticationError` | 401    | No     |
| `NotFoundError`       | 404    | No     |

### Disabling Retry

```typescript
const sw = new Splitwise({
  accessToken: "your_token",
  retry: { maxRetries: 0 },
});
```

### Flow

```
Attempt 0: Request → 500 → shouldRetry? Yes → delay ~500ms
Attempt 1: Request → 502 → shouldRetry? Yes → delay ~1000ms
Attempt 2: Request → 200 → Success ✓

// Or on persistent failure:
Attempt 0: Request → 500 → delay ~500ms
Attempt 1: Request → 500 → delay ~1000ms
Attempt 2: Request → 500 → delay ~2000ms
Attempt 3: Request → 500 → maxRetries reached → SplitwiseApiError thrown
```

---

## Caching

### In-Memory TTL Cache

The SDK automatically caches GET requests using an in-memory cache:

- **TTL-based** — entries expire after a configurable duration
- **Token-specific** — different tokens use separate caches (hashed fingerprint)
- **Request deduplication** — identical concurrent requests are deduplicated

### Configuration

```typescript
const sw = new Splitwise({
  accessToken: "your_token",
  cache: {
    enabled: true, // default: true
    defaultTtlMs: 300_000, // default: 5 minutes
  },
});
```

### TTL Overrides

Some endpoints have longer default TTLs:

| Endpoint          | Default TTL |
| ----------------- | ----------- |
| `/get_currencies` | 24 hours    |
| `/get_categories` | 24 hours    |
| All others        | 5 minutes   |

### Cache Invalidation

Write operations (POST) automatically invalidate the cache of the affected resource:

| Operation       | Invalidates     |
| --------------- | --------------- |
| `createExpense` | `/get_expense`  |
| `updateExpense` | `/get_expense`  |
| `deleteExpense` | `/get_expense`  |
| `createGroup`   | `/get_group`    |
| `deleteGroup`   | `/get_group`    |
| `createFriend`  | `/get_friend`   |
| `createComment` | `/get_comments` |

### Request Deduplication

When multiple identical GET requests run concurrently, only one network request executes:

```typescript
// Only ONE actual HTTP request:
const [user1, user2, user3] = await Promise.all([
  sw.users.getCurrentUser(),
  sw.users.getCurrentUser(),
  sw.users.getCurrentUser(),
]);
```

### Token-Specific Keys

Cache keys include a hashed token fingerprint. This prevents data sharing between users:

```typescript
const sw1 = new Splitwise({ accessToken: "token-alice" });
const sw2 = new Splitwise({ accessToken: "token-bob" });

// These calls use separate caches:
await sw1.users.getCurrentUser(); // cache key: "fp-alice:/get_current_user"
await sw2.users.getCurrentUser(); // cache key: "fp-bob:/get_current_user"
```

### Disabling Cache

```typescript
const sw = new Splitwise({
  accessToken: "your_token",
  cache: { enabled: false },
});
```

### Clearing Cache Manually

```typescript
sw.clearCache();
```
