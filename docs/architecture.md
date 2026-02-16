# Architekturüberblick

## Generator-first Architektur

Das Splitwise SDK folgt einem Generator-first-Ansatz: Der gesamte API-Client und die Typen werden automatisch aus der OpenAPI-Spezifikation generiert. Handgeschriebener Code wrappet den generierten Client und fügt Mehrwert hinzu.

```
┌────────────────────────────────────────────┐
│             Public API (index.ts)          │
│       Splitwise-Klasse + Re-Exports        │
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

## Schichten

### 1. Generated Client (`src/generated/`)

- **Quelle**: `openapi.json` → `@hey-api/openapi-ts`
- **Dateien**: `types.gen.ts`
- **Regel**: Niemals manuell editieren. Regenerieren via `npm run typegen`.

### 2. Core Layer (`src/core/`)

| Modul             | Verantwortung                                         |
| ----------------- | ----------------------------------------------------- |
| `auth.ts`         | Token-Auflösung, Bearer-Header                        |
| `errors.ts`       | Typisierte Error-Hierarchie, HTTP-Status-Mapping      |
| `interceptors.ts` | Request-Lifecycle (Auth, Logging, Retry, Error-Parse) |
| `http-client.ts`  | Zentraler HTTP-Client mit Cache-Integration           |
| `logger.ts`       | Strukturiertes Logging mit requestId + durationMs     |

### 3. Repositories (`src/repositories/`)

Jedes Repository kapselt eine API-Ressource:

```typescript
// Beispiel: UsersRepository
class UsersRepository extends BaseRepository {
  async getCurrentUser() {
    return this.http.get<GetGetCurrentUserResponse>("/get_current_user");
  }
}
```

- Erbt von `BaseRepository` (hält `HttpClient`-Referenz)
- Typisiert über Generated Types
- Schreibende Operationen invalidieren den zugehörigen Cache

### 4. Utils (`src/utils/`)

- **`retry.ts`**: Exponential Backoff + Jitter, `Retry-After`-Header-Support
- **`cache.ts`**: In-Memory TTL-Cache, Request-Deduplication, token-spezifische Keys

### 5. Public API (`src/index.ts`)

- `Splitwise`-Klasse als einziger Einstiegspunkt
- Konfiguration über `SplitwiseOptions`
- Re-Exports aller relevanten Typen und Error-Klassen

## Request-Lifecycle

```
1. Repository-Methode aufgerufen
2. HttpClient.get()/post()
3. executeWithInterceptors()
   a. Token auflösen → Bearer-Header
   b. requestId generieren (UUID)
   c. Log: "request started"
   d. fetch() ausführen
   e. Response prüfen
      ├─ OK: Log "request succeeded", JSON parsen, zurückgeben
      └─ Fehler: parseHttpError(), ggf. Retry
4. Bei GET: Cache-Lookup vorab, Cache-Write nachher
5. Bei POST: Cache-Invalidation für betroffene Ressource
```

## Design-Entscheidungen

1. **Kein OAuth-Flow im SDK**: Token-Beschaffung ist Consumer-Verantwortung
2. **Exception-basiertes Error-Handling**: Typisierte Fehlerklassen statt `Result<T, E>`
3. **Repository-Pattern**: Klare Trennung zwischen Ressourcen
4. **Kein Runtime-Validierung**: Keine Zod-Dependency im ersten Major
5. **Zero Runtime Dependencies**: Nur native Node.js APIs (fetch, crypto)
