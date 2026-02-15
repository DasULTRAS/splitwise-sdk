# Migration Guide: v0.x → v1.0

Dieses Dokument beschreibt alle Breaking Changes beim Upgrade auf die neue Major-Version des Splitwise SDK.

## Übersicht der Breaking Changes

1. **Neue Client-Klasse**: `SplitwiseClient` → `Splitwise`
2. **OAuth entfernt**: Kein `consumerKey`/`consumerSecret` mehr
3. **Repository-Pattern**: Flache Methoden → verschachtelte Repositories
4. **Typen aus Generated Code**: `src/types/api.ts` entfernt
5. **Neues Logging**: Console-Callback → strukturiertes Logger-Interface
6. **Node.js >= 20.19.0**: Minimum-Version angehoben

## 1. Client-Instanzierung

### Vorher (v1.x)

```typescript
import { SplitwiseClient } from "splitwise-sdk";

const sw = new SplitwiseClient({
  consumerKey: "your_key",
  consumerSecret: "your_secret",
  // oder:
  accessToken: "your_token",
  logger: console.log,
});
```

### Nachher (v2.0)

```typescript
import { Splitwise } from "splitwise-sdk";

const sw = new Splitwise({
  accessToken: "your_token",
  // Optional:
  logger: "info", // oder Logger-Objekt / Callback
  retry: { maxRetries: 3 },
  cache: { enabled: true },
});
```

**Änderung:**

- Klasse heißt jetzt `Splitwise` (nicht `SplitwiseClient`)
- `consumerKey`/`consumerSecret` wurden entfernt
- OAuth-Flow muss extern implementiert werden
- `accessToken` akzeptiert auch `() => string` oder `() => Promise<string>`

## 2. API-Aufrufe

### Vorher (v1.x)

```typescript
// Methoden direkt auf dem Client
const user = await sw.getCurrentUser();
const expenses = await sw.getExpenses({ group_id: 5 });
await sw.createExpense({ cost: "10.00", description: "Lunch" });
```

### Nachher (v2.0)

```typescript
// Methoden über Repository-Objekte
const { user } = await sw.users.getCurrentUser();
const { expenses } = await sw.expenses.getExpenses({ group_id: 5 });
await sw.expenses.createExpense({ cost: "10.00", description: "Lunch" });
```

**Mapping:**

| Vorher                    | Nachher                               |
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

## 3. Fehlerbehandlung

### Vorher (v1.x)

```typescript
try {
  await sw.getExpense(999);
} catch (err) {
  // Generischer Error mit Message
  console.error(err.message);
}
```

### Nachher (v2.0)

```typescript
import { NotFoundError, ValidationError, RateLimitError } from "splitwise-sdk";

try {
  await sw.expenses.getExpense(999);
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log(`Status: ${err.status}, Endpoint: ${err.endpoint}`);
  } else if (err instanceof RateLimitError) {
    console.log(`Retry nach ${err.retryAfter}s`);
  }
}
```

## 4. Typen

### Vorher (v1.x)

```typescript
import type { User, Expense } from "splitwise-sdk";
// Oder aus src/types/api.ts
```

### Nachher (v2.0)

```typescript
// Generated Types werden aus dem Paket re-exportiert
import type {
  GetGetCurrentUserResponse,
  PostCreateExpenseData,
} from "splitwise-sdk";
```

Die manuellen Typdateien (`src/types/api.ts`, `src/types/SplitwiseOptions.ts`, `src/types/openapi-types.ts`) wurden entfernt. Alle Typen stammen jetzt aus dem generierten Client.

## 5. Logging

### Vorher (v1.x)

```typescript
const sw = new SplitwiseClient({
  logger: console.log, // Einfacher Callback
});
```

### Nachher (v2.0)

```typescript
import { Splitwise, DefaultLogger, SilentLogger } from "splitwise-sdk";

// Option 1: Log-Level als String
const sw = new Splitwise({ accessToken: "...", logger: "debug" });

// Option 2: Kein Logging
const sw = new Splitwise({ accessToken: "...", logger: new SilentLogger() });

// Option 3: Callback (abwärtskompatibel)
const sw = new Splitwise({
  accessToken: "...",
  logger: (msg) => console.log(msg),
});
```

Logs sind jetzt strukturiert (JSON) und enthalten `requestId`, `durationMs`, `retryCount`.

## 6. Entfernte Abhängigkeiten

| Abhängigkeit         | Status   | Ersatz                 |
| -------------------- | -------- | ---------------------- |
| `oauth`              | Entfernt | Access Token Injection |
| `@types/oauth`       | Entfernt | –                      |
| `jest`               | Entfernt | `node:test` + `c8`     |
| `@types/jest`        | Entfernt | –                      |
| `openapi-typescript` | Entfernt | `@hey-api/openapi-ts`  |

## 7. Node.js-Version

- **Vorher**: Keine explizite Mindestversion
- **Nachher**: `node >= 20.19.0` (für native `fetch` und `node:test`)
