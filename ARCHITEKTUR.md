# Architektur des Splitwise SDK

Dieses Dokument beschreibt die Architektur, die Projektstruktur und die wichtigsten Konzepte des Splitwise SDK.

## 1. Projektziel und Kernkonzept

Das Ziel dieses Projekts ist es, ein typsicheres, modernes Software Development Kit (SDK) für die [Splitwise API v3.0](https://dev.splitwise.com/) bereitzustellen.

Das SDK folgt einer **Generator-first-Architektur**: Typen und Client-Code werden automatisch aus der OpenAPI-Spezifikation generiert. Handgeschriebene Repositories wrappen den generierten Client und fügen Mehrwert wie Caching, Retry und Error-Mapping hinzu.

## 2. Projektstruktur

```
src/
├── generated/              # von @hey-api/openapi-ts generiert (committen, nie manuell editieren)
│   └── types.gen.ts
├── core/                   # zentrale Infrastruktur
│   ├── http-client.ts      # HTTP-Client mit Auth, Cache, Retry
│   ├── auth.ts             # Token-Auflösung und Bearer-Header
│   ├── errors.ts           # Typisierte Error-Hierarchie
│   ├── interceptors.ts     # Request-Lifecycle (Auth, Logging, Error-Parsing, Retry)
│   └── logger.ts           # Strukturiertes Logging mit requestId
├── repositories/           # Ressourcen-basierte Module
│   ├── ...
│   └── index.ts
├── utils/
│   ├── cache.ts            # In-Memory TTL-Cache + Deduplication
│   └── retry.ts            # Exponential Backoff + Jitter
└── index.ts                # Public API Surface
```

## 3. Architektur-Komponenten

### 3.1. Generated Client (`src/generated/`)

Der Client-Code wird mit `@hey-api/openapi-ts` aus `openapi.json` generiert:

- **`types.gen.ts`**: Alle Request/Response-Typen der Splitwise API

Diese Dateien werden committet, aber **niemals manuell editiert**. Regenerierung erfolgt über `npm run typegen`.

### 3.2. Core Layer (`src/core/`)

#### `auth.ts`

- `TokenProvider`-Typ: String oder (async) Funktion
- Token-Auflösung zur Laufzeit
- Bearer-Header-Formatierung
- `AuthenticationError` bei fehlendem Token

#### `errors.ts`

Typisierte Error-Hierarchie:

```
Error
└── SplitwiseError (Basis)
    ├── SplitwiseApiError (status, endpoint, requestId, retryable)
    │   ├── AuthenticationError (401)
    │   ├── AuthorizationError (403)
    │   ├── NotFoundError (404)
    │   ├── ValidationError (400/422)
    │   ├── ConflictError (409)
    │   └── RateLimitError (429 + retryAfter)
    └── NetworkError (fetch/timeout, immer retryable)
```

#### `interceptors.ts`

Request-Lifecycle-Management:

1. Bearer-Token-Injection
2. `requestId`-Generierung (UUID)
3. Request-Dauer-Messung
4. Strukturiertes Logging (Start/Erfolg/Fehler)
5. Error-Parsing über `parseHttpError()`
6. Retry-Logik für retryable Fehler

#### `http-client.ts`

Zentraler HTTP-Client, der alle Core-Komponenten verbindet:

- GET-Requests mit Cache + Deduplication
- POST-Requests mit Cache-Invalidation
- Konfigurierbar über `HttpClientConfig`

#### `logger.ts`

- `Logger`-Interface mit strukturierten `LogEntry`-Objekten
- `DefaultLogger`: JSON-Ausgabe nach stdout/stderr mit Level-Filter
- `SilentLogger`: Keine Ausgabe
- `CallbackLogger`: Delegiert an benutzerdefinierte Funktion

### 3.3. Repositories (`src/repositories/`)

Jedes Repository kapselt eine API-Ressource und erbt von `BaseRepository`:

| Repository                | Ressource          |
| ------------------------- | ------------------ |
| `UsersRepository`         | Benutzer           |
| `GroupsRepository`        | Gruppen            |
| `ExpensesRepository`      | Ausgaben           |
| `FriendsRepository`       | Freunde            |
| `CommentsRepository`      | Kommentare         |
| `NotificationsRepository` | Benachrichtigungen |
| `CurrenciesRepository`    | Währungen          |
| `CategoriesRepository`    | Kategorien         |

### 3.4. Utils (`src/utils/`)

#### `retry.ts`

- Exponential Backoff mit Jitter
- `Retry-After`-Header-Unterstützung für 429
- Konfigurierbar (`maxRetries`, `baseDelayMs`, `maxDelayMs`)

#### `cache.ts`

- In-Memory TTL-Cache
- Request-Deduplication für identische In-Flight Requests
- Token-spezifische Cache-Keys (gehashter Fingerprint)
- Gezielte Invalidation bei schreibenden Operationen
- TTL-Overrides für statische Endpunkte (Currencies, Categories)

### 3.5. Public API (`src/index.ts`)

- `Splitwise`-Klasse als Haupteinstiegspunkt
- `SplitwiseOptions`-Interface für Konfiguration
- Re-Exports aller Error-Klassen, Logger, Config-Typen und Generated Types

## 4. Entwicklungs-Workflow

### 4.1. OpenAPI-Typengenerierung

```bash
npm run typegen
```

Führt `@hey-api/openapi-ts` mit der Konfiguration aus `openapi-ts.config.ts` aus.

### 4.2. Build

```bash
npm run build
```

`tsup` baut das Projekt in drei Formate:

- ESM (`dist/index.js`)
- CJS (`dist/index.cjs`)
- Type Declarations (`dist/index.d.ts`, `dist/index.d.cts`)

### 4.3. Tests

```bash
npm test
```

Native `node:test` Runner mit `tsx` für TypeScript-Ausführung und `c8` für Coverage.

### 4.4. Code-Qualität

- **Linting**: ESLint (`npm run check:lint`)
- **Formatierung**: Prettier (`npm run check:format`)
- **Typecheck**: TypeScript (`npm run check:type`)
- **Pre-Commit-Hooks**: Husky + lint-staged

### 4.5. Releases

[semantic-release](https://semantic-release.gitbook.io/) mit Conventional Commits.

## 5. Abhängigkeiten

- **Runtime**: Keine (nur native `fetch`)
- **Dev**: TypeScript, tsup, @hey-api/openapi-ts, tsx, c8, ESLint, Prettier, Husky, semantic-release
