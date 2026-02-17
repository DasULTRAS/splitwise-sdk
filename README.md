# Splitwise SDK

![npm](https://img.shields.io/npm/v/splitwise-sdk)
![node](https://img.shields.io/node/v/splitwise-sdk)
![license](https://img.shields.io/npm/l/splitwise-sdk)
![downloads](https://img.shields.io/npm/dm/splitwise-sdk)

Type-safe Node.js SDK for the [Splitwise API v3.0](https://dev.splitwise.com/).

## Features

- **Generated types** — auto-generated from the OpenAPI spec
- **Repository pattern** — resource-based modules for all endpoints
- **Typed error hierarchy** — specific error classes per HTTP status code
- **Retry with exponential backoff** — auto-retry for transient errors (429, 5xx, network)
- **In-memory caching** — TTL-based cache with request deduplication
- **Dual format** — ESM + CJS + TypeScript declarations
- **Zero runtime dependencies** — native `fetch` only

## Installation

```bash
npm install splitwise-sdk
```

**Requires:** Node.js >= 20.19.0

## Quick Start

```typescript
import { Splitwise } from "splitwise-sdk";

const sw = new Splitwise({ accessToken: "your_access_token" });

// Get current user
const { user } = await sw.users.getCurrentUser();
console.log(user?.first_name);

// List group expenses
const { expenses } = await sw.expenses.getExpenses({ group_id: 123 });

// Create an expense
await sw.expenses.createExpense({
  cost: "25.00",
  description: "Dinner",
  group_id: 123,
});
```

## Authentication

The SDK uses **access token injection**. OAuth flow happens outside the SDK — it only sets the `Authorization: Bearer <token>` header.

```typescript
// Static token
const sw = new Splitwise({ accessToken: "my-token" });

// Dynamic token (sync or async)
const sw = new Splitwise({
  accessToken: async () => {
    const token = await fetchTokenFromVault();
    return token;
  },
});
```

> **Breaking change:** `consumerKey`/`consumerSecret` and the `oauth` dependency were removed.

## Endpoints

All endpoints are available through typed repositories:

| Repository         | Methods                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `sw.users`         | `getCurrentUser`, `getUser`, `updateUser`                                                                       |
| `sw.groups`        | `getGroups`, `getGroup`, `createGroup`, `deleteGroup`, `undeleteGroup`, `addUserToGroup`, `removeUserFromGroup` |
| `sw.expenses`      | `getExpenses`, `getExpense`, `createExpense`, `updateExpense`, `deleteExpense`, `undeleteExpense`               |
| `sw.friends`       | `getFriends`, `getFriend`, `createFriend`, `createFriends`, `deleteFriend`                                      |
| `sw.comments`      | `getComments`, `createComment`, `deleteComment`                                                                 |
| `sw.notifications` | `getNotifications`                                                                                              |
| `sw.currencies`    | `getCurrencies`                                                                                                 |
| `sw.categories`    | `getCategories`                                                                                                 |

## Configuration

```typescript
import { Splitwise, SilentLogger } from "splitwise-sdk";

const sw = new Splitwise({
  accessToken: "your_token",

  // Logging: log level string, Logger object, or callback
  logger: "debug", // or new SilentLogger() or (msg) => console.log(msg)

  // Retry config
  retry: {
    maxRetries: 3, // default
    baseDelayMs: 500,
    maxDelayMs: 30_000,
  },

  // Cache config
  cache: {
    enabled: true, // default
    defaultTtlMs: 300_000, // 5 minutes
  },
});
```

## Error Handling

The SDK throws typed errors catchable via `instanceof`:

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
    console.log("Expense not found");
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited — retry after ${err.retryAfter}s`);
  } else if (err instanceof ValidationError) {
    console.log("Validation error:", err.details);
  }
}
```

## Documentation

- [Architecture](docs/architecture.md)
- [Error Handling](docs/error-handling.md)
- [Retry & Caching](docs/retry-caching.md)
- [Migration Guide](docs/migration-guide.md)
- [Examples](examples/)

## Development

### Prerequisites

- Node.js >= 20.19.0
- npm

### Setup

```bash
npm ci
```

### Scripts

| Script                 | Description                            |
| ---------------------- | -------------------------------------- |
| `npm run build`        | Build ESM + CJS + DTS via tsup         |
| `npm test`             | Run tests with node:test + c8 coverage |
| `npm run typegen`      | Generate types from openapi.json       |
| `npm run check:type`   | TypeScript type check                  |
| `npm run check:lint`   | Oxlint                                 |
| `npm run check:format` | Prettier check                         |

### Semantic Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with `semantic-release` for automated releases.

### Type Generation

```bash
npm run typegen
```

Runs `@hey-api/openapi-ts` to generate the typed client in `src/generated/`. Generated files are committed but never manually edited.

## License

[MIT](LICENSE)
