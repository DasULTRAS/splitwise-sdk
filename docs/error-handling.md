# Fehlerbehandlung

## Error-Hierarchie

Das SDK verwendet eine typisierte Fehler-Hierarchie, die HTTP-Statuscodes auf spezifische Error-Klassen abbildet:

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

## Verwendung

### Grundlegendes Error-Handling

```typescript
import { Splitwise, NotFoundError, ValidationError } from "splitwise-sdk";

const sw = new Splitwise({ accessToken: "your_token" });

try {
  await sw.expenses.getExpense(999);
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log(`Ressource nicht gefunden: ${err.endpoint}`);
  } else if (err instanceof ValidationError) {
    console.log(`Validierungsfehler:`, err.details);
  } else {
    throw err; // Unbekannter Fehler weiterwerfen
  }
}
```

### Alle Error-Klassen

#### `SplitwiseError`

Basis-Klasse für alle SDK-Fehler.

```typescript
const err = new SplitwiseError("Etwas ist schiefgelaufen", cause);
err.message; // "Etwas ist schiefgelaufen"
err.cause; // Original-Error (optional)
```

#### `SplitwiseApiError`

Basis-Klasse für alle HTTP-API-Fehler.

```typescript
err.status; // HTTP-Statuscode (z.B. 500)
err.endpoint; // Aufgerufener Endpunkt (z.B. "/get_expense/123")
err.requestId; // UUID zur Korrelation
err.details; // Response-Body (falls vorhanden)
err.retryable; // true für 5xx, 429; false für 4xx
```

#### `AuthenticationError` (401)

Der Access Token fehlt oder ist ungültig.

```typescript
if (err instanceof AuthenticationError) {
  // Token erneuern und erneut versuchen
}
```

#### `AuthorizationError` (403)

Zugriff verweigert – der Token hat nicht die nötigen Berechtigungen.

#### `NotFoundError` (404)

Die angeforderte Ressource existiert nicht.

#### `ValidationError` (400 / 422)

Die Anfrage enthält ungültige Daten.

```typescript
if (err instanceof ValidationError) {
  console.log(err.details); // API-Validierungsfehler
}
```

#### `ConflictError` (409)

Konflikt bei der Anfrage (z.B. doppelte Erstellung).

#### `RateLimitError` (429)

Rate Limit überschritten. Enthält `retryAfter` in Sekunden.

```typescript
if (err instanceof RateLimitError) {
  console.log(`Warte ${err.retryAfter} Sekunden`);
}
```

#### `NetworkError`

Netzwerkfehler (DNS, Timeout, Verbindungsabbruch). Immer als retryable markiert.

## Error-Properties

| Property     | Typ                   | Verfügbar in                            |
| ------------ | --------------------- | --------------------------------------- |
| `message`    | `string`              | Alle                                    |
| `cause`      | `unknown`             | Alle                                    |
| `status`     | `number`              | `SplitwiseApiError`+                    |
| `endpoint`   | `string`              | `SplitwiseApiError`+                    |
| `requestId`  | `string`              | `SplitwiseApiError`+                    |
| `details`    | `unknown`             | `SplitwiseApiError`+                    |
| `retryable`  | `boolean`             | `SplitwiseApiError`+ und `NetworkError` |
| `retryAfter` | `number \| undefined` | `RateLimitError`                        |

## Retry-Verhalten

Fehler werden automatisch durch den HTTP-Layer auf Retryability geprüft:

- **Retryable**: `NetworkError`, HTTP 429, 500, 502, 503, 504
- **Nicht retryable**: HTTP 400, 401, 403, 404, 409, 422

Siehe [Retry & Caching](retry-caching.md) für Details zur Retry-Strategie.

## `instanceof`-Prüfung

Alle Error-Klassen unterstützen `instanceof`:

```typescript
import {
  SplitwiseError,
  SplitwiseApiError,
  AuthenticationError,
} from "splitwise-sdk";

try {
  await sw.users.getCurrentUser();
} catch (err) {
  err instanceof AuthenticationError; // true für 401
  err instanceof SplitwiseApiError; // true für alle HTTP-Fehler
  err instanceof SplitwiseError; // true für alle SDK-Fehler
  err instanceof Error; // true
}
```
