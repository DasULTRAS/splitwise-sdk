# Retry & Caching

## Retry

### Strategie

Das SDK verwendet **Exponential Backoff mit Jitter** für transiente Fehler:

```
Delay = min(baseDelayMs × 2^attempt, maxDelayMs) × random(0..1)
```

Bei `RateLimitError` (429) wird der `Retry-After`-Header respektiert.

### Konfiguration

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

### Retryable Fehler

| Fehlertyp             | Status | Retry? |
| --------------------- | ------ | ------ |
| `NetworkError`        | –      | Ja     |
| `RateLimitError`      | 429    | Ja     |
| `SplitwiseApiError`   | 500    | Ja     |
| `SplitwiseApiError`   | 502    | Ja     |
| `SplitwiseApiError`   | 503    | Ja     |
| `SplitwiseApiError`   | 504    | Ja     |
| `ValidationError`     | 400    | Nein   |
| `AuthenticationError` | 401    | Nein   |
| `NotFoundError`       | 404    | Nein   |

### Retry deaktivieren

```typescript
const sw = new Splitwise({
  accessToken: "your_token",
  retry: { maxRetries: 0 },
});
```

### Ablauf

```
Attempt 0: Request → 500 → shouldRetry? Ja → Delay ~500ms
Attempt 1: Request → 502 → shouldRetry? Ja → Delay ~1000ms
Attempt 2: Request → 200 → Erfolg ✓

// Oder bei permanentem Fehler:
Attempt 0: Request → 500 → Delay ~500ms
Attempt 1: Request → 500 → Delay ~1000ms
Attempt 2: Request → 500 → Delay ~2000ms
Attempt 3: Request → 500 → maxRetries erreicht → SplitwiseApiError geworfen
```

---

## Caching

### In-Memory TTL-Cache

Das SDK cached GET-Anfragen automatisch mit einem In-Memory-Cache:

- **TTL-basiert**: Einträge verfallen nach einer konfigurierbaren Zeit
- **Token-spezifisch**: Verschiedene Tokens haben getrennte Caches (gehashter Fingerprint)
- **Request-Deduplication**: Identische gleichzeitige Requests werden dedupliziert

### Konfiguration

```typescript
const sw = new Splitwise({
  accessToken: "your_token",
  cache: {
    enabled: true, // default: true
    defaultTtlMs: 300_000, // default: 5 Minuten
  },
});
```

### TTL-Overrides

Bestimmte Endpunkte haben längere Default-TTLs:

| Endpunkt          | Default-TTL |
| ----------------- | ----------- |
| `/get_currencies` | 24 Stunden  |
| `/get_categories` | 24 Stunden  |
| Alle anderen      | 5 Minuten   |

### Cache-Invalidation

Schreibende Operationen (POST) invalidieren automatisch den Cache der betroffenen Ressource:

| Operation       | Invalidiert     |
| --------------- | --------------- |
| `createExpense` | `/get_expense`  |
| `updateExpense` | `/get_expense`  |
| `deleteExpense` | `/get_expense`  |
| `createGroup`   | `/get_group`    |
| `deleteGroup`   | `/get_group`    |
| `createFriend`  | `/get_friend`   |
| `createComment` | `/get_comments` |

### Request-Deduplication

Wenn mehrere identische GET-Requests gleichzeitig laufen, wird nur ein einzelner Netzwerk-Request ausgeführt:

```typescript
// Nur EIN tatsächlicher HTTP-Request:
const [user1, user2, user3] = await Promise.all([
  sw.users.getCurrentUser(),
  sw.users.getCurrentUser(),
  sw.users.getCurrentUser(),
]);
```

### Token-spezifische Keys

Cache-Keys enthalten einen gehashten Token-Fingerprint. Dadurch wird verhindert, dass Daten zwischen verschiedenen Benutzern geteilt werden:

```typescript
const sw1 = new Splitwise({ accessToken: "token-alice" });
const sw2 = new Splitwise({ accessToken: "token-bob" });

// Diese Aufrufe verwenden getrennte Caches:
await sw1.users.getCurrentUser(); // Cache-Key: "fp-alice:/get_current_user"
await sw2.users.getCurrentUser(); // Cache-Key: "fp-bob:/get_current_user"
```

### Cache deaktivieren

```typescript
const sw = new Splitwise({
  accessToken: "your_token",
  cache: { enabled: false },
});
```

### Cache manuell leeren

```typescript
sw.clearCache();
```
