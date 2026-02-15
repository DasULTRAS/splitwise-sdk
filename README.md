# Splitwise SDK

![npm](https://img.shields.io/npm/v/splitwise-sdk)
![node](https://img.shields.io/node/v/splitwise-sdk)
![license](https://img.shields.io/npm/l/splitwise-sdk)
![downloads](https://img.shields.io/npm/dm/splitwise-sdk)

Ein typsicheres, SDK für die [Splitwise API v3.0](https://dev.splitwise.com/) in Node.js.

## Features

- **Generatored types**: Typen werden automatisch aus der OpenAPI-Spezifikation generiert
- **Repository-Pattern**: Ressourcen-basierte Module für alle API-Endpunkte
- **Typed Error Hierarchy**: Strukturierte Fehlerklassen für jeden HTTP-Statuscode
- **Retry mit Exponential Backoff**: Automatisches Retry für transiente Fehler (429, 5xx, Netzwerkfehler)
- **In-Memory Caching**: TTL-basierter Cache mit Request-Deduplication
- **Dual-Format**: ESM + CJS + TypeScript Declarations
- **Zero Runtime Dependencies**: nur native `fetch`

## Installation

```bash
npm install splitwise-sdk
```

**Voraussetzung:** Node.js >= 20.19.0

## Quickstart

```typescript
import { Splitwise } from "splitwise-sdk";

const sw = new Splitwise({ accessToken: "your_access_token" });

// Aktuellen Benutzer abrufen
const { user } = await sw.users.getCurrentUser();
console.log(user?.first_name);

// Ausgaben einer Gruppe laden
const { expenses } = await sw.expenses.getExpenses({ group_id: 123 });

// Neue Ausgabe erstellen
await sw.expenses.createExpense({
  cost: "25.00",
  description: "Dinner",
  group_id: 123,
});
```

## Authentifizierung

Das SDK verwendet **Access Token Injection**. Der OAuth-Flow findet außerhalb des SDK statt – das SDK setzt lediglich den `Authorization: Bearer <token>` Header.

```typescript
// Statischer Token
const sw = new Splitwise({ accessToken: "my-token" });

// Dynamischer Token (sync oder async)
const sw = new Splitwise({
  accessToken: async () => {
    const token = await fetchTokenFromVault();
    return token;
  },
});
```

> **Breaking Change:** `consumerKey`/`consumerSecret` und die `oauth`-Abhängigkeit wurden entfernt.

## API-Endpunkte

Alle Endpunkte sind über typisierte Repositories verfügbar:

| Repository         | Methoden                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `sw.users`         | `getCurrentUser`, `getUser`, `updateUser`                                                                       |
| `sw.groups`        | `getGroups`, `getGroup`, `createGroup`, `deleteGroup`, `undeleteGroup`, `addUserToGroup`, `removeUserFromGroup` |
| `sw.expenses`      | `getExpenses`, `getExpense`, `createExpense`, `updateExpense`, `deleteExpense`, `undeleteExpense`               |
| `sw.friends`       | `getFriends`, `getFriend`, `createFriend`, `createFriends`, `deleteFriend`                                      |
| `sw.comments`      | `getComments`, `createComment`, `deleteComment`                                                                 |
| `sw.notifications` | `getNotifications`                                                                                              |
| `sw.currencies`    | `getCurrencies`                                                                                                 |
| `sw.categories`    | `getCategories`                                                                                                 |

## Konfiguration

```typescript
import { Splitwise, SilentLogger } from "splitwise-sdk";

const sw = new Splitwise({
  accessToken: "your_token",

  // Logging: LogLevel-String, Logger-Objekt oder Callback
  logger: "debug", // oder new SilentLogger() oder (msg) => console.log(msg)

  // Retry-Konfiguration
  retry: {
    maxRetries: 3, // default
    baseDelayMs: 500,
    maxDelayMs: 30_000,
  },

  // Cache-Konfiguration
  cache: {
    enabled: true, // default
    defaultTtlMs: 300_000, // 5 Minuten
  },
});
```

## Fehlerbehandlung

Das SDK wirft typisierte Fehler, die über `instanceof` abgefangen werden können:

```typescript
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "splitwise-sdk";

try {
  await sw.expenses.getExpense(999);
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log("Ausgabe nicht gefunden");
  } else if (err instanceof RateLimitError) {
    console.log(`Rate Limit – Retry nach ${err.retryAfter}s`);
  } else if (err instanceof ValidationError) {
    console.log("Validierungsfehler:", err.details);
  }
}
```

## Dokumentation

- [Architekturüberblick](docs/architecture.md)
- [Fehlerbehandlung](docs/error-handling.md)
- [Retry & Caching](docs/retry-caching.md)
- [Migration Guide](docs/migration-guide.md)
- [Beispiele](examples/)

## Entwicklung

### Voraussetzungen

- Node.js >= 20.19.0
- npm

### Setup

```bash
npm ci
```

### Scripts

| Script                 | Beschreibung                           |
| ---------------------- | -------------------------------------- |
| `npm run build`        | Baut ESM + CJS + DTS mit tsup          |
| `npm test`             | Tests mit node:test + c8 Coverage      |
| `npm run typegen`      | Generiert Client-Code aus openapi.json |
| `npm run check:type`   | TypeScript Typecheck                   |
| `npm run check:lint`   | ESLint                                 |
| `npm run check:format` | Prettier Check                         |

### Semantic Commits

Dieses Projekt verwendet [Conventional Commits](https://www.conventionalcommits.org/) mit `semantic-release` für automatisierte Releases.

### Typen generieren

```bash
npm run typegen
```

Dies führt `@hey-api/openapi-ts` aus und generiert den typisierten Client in `src/generated/`. Die generierten Dateien werden committet, aber niemals manuell editiert.

## Lizenz

[MIT](LICENSE)
