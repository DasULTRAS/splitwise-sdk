# Architecture

## Generator-First Architecture

The Splitwise SDK uses a generator-first approach: the API client and types are auto-generated from the OpenAPI spec. Hand-written code wraps the generated client and adds caching, retry, and error mapping.

```
┌────────────────────────────────────────────┐
│             Public API (index.ts)          │
│         Splitwise class + re-exports       │
├────────────────────────────────────────────┤
│           Repositories                      │
│  users · groups · expenses · friends · ...  │
├────────────────────────────────────────────┤
│              Core Layer                     │
│  http-client · auth · errors · interceptors │
├────────────────────────────────────────────┤
│        Utils        │  Generated Client     │
│  retry · cache      │  types                 │
├─────────────────────┴──────────────────────┤
│              Node.js fetch                  │
└────────────────────────────────────────────┘
```

## Layers

### 1. Generated Client (`src/generated/`)

- **Source**: `openapi.json` → `@hey-api/openapi-ts`
- **Files**: `types.gen.ts`
- **Rule**: never edit manually. Regenerate via `npm run typegen`.

### 2. Core Layer (`src/core/`)

| Module            | Responsibility                                          |
| ----------------- | ------------------------------------------------------- |
| `auth.ts`         | Token resolution, Bearer header                         |
| `errors.ts`       | Typed error hierarchy, HTTP status mapping              |
| `interceptors.ts` | Request lifecycle (auth, logging, retry, error parsing) |
| `http-client.ts`  | Central HTTP client with cache integration              |
| `logger.ts`       | Structured logging with requestId + durationMs          |

### 3. Repositories (`src/repositories/`)

Each repository wraps an API resource:

```typescript
// Example: UsersRepository
class UsersRepository extends BaseRepository {
  async getCurrentUser() {
    return this.http.get<GetGetCurrentUserResponse>("/get_current_user");
  }
}
```

- Extends `BaseRepository` (holds `HttpClient` reference)
- Typed via generated types
- Write operations invalidate the corresponding cache

### 4. Utils (`src/utils/`)

- **`retry.ts`** — exponential backoff + jitter, `Retry-After` header support
- **`cache.ts`** — in-memory TTL cache, request deduplication, token-specific keys

### 5. Public API (`src/index.ts`)

- `Splitwise` class as single entry point
- Configuration via `SplitwiseOptions`
- Re-exports all relevant types and error classes

## Request Lifecycle

```
1. Repository method called
2. HttpClient.get()/post()
3. executeWithInterceptors()
   a. Resolve token → Bearer header
   b. Generate requestId (UUID)
   c. Log: "request started"
   d. Execute fetch()
   e. Check response
      ├─ OK: log "request succeeded", parse JSON, return
      └─ Error: parseHttpError(), retry if eligible
4. GET: cache lookup first, cache write after
5. POST: cache invalidation for affected resource
```

## Design Decisions

1. **No OAuth flow in SDK** — token acquisition is the consumer's responsibility
2. **Exception-based error handling** — typed error classes
3. **Repository pattern** — clear separation between resources
4. **No runtime validation** — no Zod dependency
5. **Zero runtime dependencies** — native Node.js APIs only (fetch, crypto)
