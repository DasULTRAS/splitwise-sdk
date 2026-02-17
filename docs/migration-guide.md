# Migration Guide: v0.x → v1.0

All breaking changes when upgrading to the new major version.

## Breaking Changes Summary

1. **New client class**: `SplitwiseClient` → `Splitwise`
2. **OAuth removed**: no more `consumerKey`/`consumerSecret`
3. **Repository pattern**: flat methods → nested repositories
4. **Generated types**: `src/types/api.ts` removed
5. **New logging**: console callback → structured Logger interface
6. **Node.js >= 20.19.0**: minimum version raised

## 1. Client Instantiation

### Before (v1.x)

```typescript
import { SplitwiseClient } from "splitwise-sdk";

const sw = new SplitwiseClient({
  consumerKey: "your_key",
  consumerSecret: "your_secret",
  // or:
  accessToken: "your_token",
  logger: console.log,
});
```

### After (v2.0)

```typescript
import { Splitwise } from "splitwise-sdk";

const sw = new Splitwise({
  accessToken: "your_token",
  // Optional:
  logger: "info", // or Logger object / callback
  retry: { maxRetries: 3 },
  cache: { enabled: true },
});
```

**Changes:**

- Class renamed to `Splitwise` (was `SplitwiseClient`)
- `consumerKey`/`consumerSecret` removed
- OAuth flow must be implemented externally
- `accessToken` also accepts `() => string` or `() => Promise<string>`

## 2. API Calls

### Before (v1.x)

```typescript
// Methods directly on the client
const user = await sw.getCurrentUser();
const expenses = await sw.getExpenses({ group_id: 5 });
await sw.createExpense({ cost: "10.00", description: "Lunch" });
```

### After (v2.0)

```typescript
// Methods via repository objects
const { user } = await sw.users.getCurrentUser();
const { expenses } = await sw.expenses.getExpenses({ group_id: 5 });
await sw.expenses.createExpense({ cost: "10.00", description: "Lunch" });
```

**Mapping:**

| Before                    | After                                 |
| ------------------------- | ------------------------------------- |
| `sw.getCurrentUser()`     | `sw.users.getCurrentUser()`           |
| `sw.getUser(id)`          | `sw.users.getUser(id)`                |
| `sw.updateUser(id, d)`    | `sw.users.updateUser(id, d)`          |
| `sw.getGroups()`          | `sw.groups.getGroups()`               |
| `sw.getGroup(id)`         | `sw.groups.getGroup(id)`              |
| `sw.createGroup(d)`       | `sw.groups.createGroup(d)`            |
| `sw.deleteGroup(id)`      | `sw.groups.deleteGroup(id)`           |
| `sw.getExpenses(q)`       | `sw.expenses.getExpenses(q)`          |
| `sw.getExpense(id)`       | `sw.expenses.getExpense(id)`          |
| `sw.createExpense(d)`     | `sw.expenses.createExpense(d)`        |
| `sw.updateExpense(id, d)` | `sw.expenses.updateExpense(id, d)`    |
| `sw.deleteExpense(id)`    | `sw.expenses.deleteExpense(id)`       |
| `sw.getFriends()`         | `sw.friends.getFriends()`             |
| `sw.getFriend(id)`        | `sw.friends.getFriend(id)`            |
| `sw.createFriend(d)`      | `sw.friends.createFriend(d)`          |
| `sw.deleteFriend(id)`     | `sw.friends.deleteFriend(id)`         |
| `sw.getCurrencies()`      | `sw.currencies.getCurrencies()`       |
| `sw.getCategories()`      | `sw.categories.getCategories()`       |
| `sw.getComments(id)`      | `sw.comments.getComments(id)`         |
| `sw.createComment(id, d)` | `sw.comments.createComment(id, d)`    |
| `sw.getNotifications()`   | `sw.notifications.getNotifications()` |

## 3. Error Handling

### Before (v1.x)

```typescript
try {
  await sw.getExpense(999);
} catch (err) {
  // Generic error with message
  console.error(err.message);
}
```

### After (v2.0)

```typescript
import { NotFoundError, ValidationError, RateLimitError } from "splitwise-sdk";

try {
  await sw.expenses.getExpense(999);
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log(`Status: ${err.status}, Endpoint: ${err.endpoint}`);
  } else if (err instanceof RateLimitError) {
    console.log(`Retry after ${err.retryAfter}s`);
  }
}
```

## 4. Types

### Before (v1.x)

```typescript
import type { User, Expense } from "splitwise-sdk";
// Or from src/types/api.ts
```

### After (v2.0)

```typescript
// Generated types are re-exported from the package
import type {
  GetGetCurrentUserResponse,
  PostCreateExpenseData,
} from "splitwise-sdk";
```

Manual type files (`src/types/api.ts`, `src/types/SplitwiseOptions.ts`, `src/types/openapi-types.ts`) were removed. All types now come from the generated client.

## 5. Logging

### Before (v1.x)

```typescript
const sw = new SplitwiseClient({
  logger: console.log, // simple callback
});
```

### After (v2.0)

```typescript
import { Splitwise, DefaultLogger, SilentLogger } from "splitwise-sdk";

// Option 1: log level string
const sw = new Splitwise({ accessToken: "...", logger: "debug" });

// Option 2: no logging
const sw = new Splitwise({ accessToken: "...", logger: new SilentLogger() });

// Option 3: callback (backward compatible)
const sw = new Splitwise({
  accessToken: "...",
  logger: (msg) => console.log(msg),
});
```

Logs are now structured (JSON) and include `requestId`, `durationMs`, `retryCount`.

## 6. Removed Dependencies

| Dependency           | Status  | Replacement            |
| -------------------- | ------- | ---------------------- |
| `oauth`              | Removed | access token injection |
| `@types/oauth`       | Removed | –                      |
| `jest`               | Removed | `node:test` + `c8`     |
| `@types/jest`        | Removed | –                      |
| `openapi-typescript` | Removed | `@hey-api/openapi-ts`  |

## 7. Node.js Version

- **Before**: no explicit minimum version
- **After**: `node >= 20.19.0` (for native `fetch` and `node:test`)
