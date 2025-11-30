# Architektur des Splitwise SDK

Dieses Dokument beschreibt die Architektur, die Projektstruktur und die wichtigsten Konzepte des Splitwise SDK.

## 1. Projektziel und Kernkonzept

Das Ziel dieses Projekts ist es, ein einfach zu bedienendes, in TypeScript geschriebenes Software Development Kit (SDK) für die [Splitwise API v3.0](https://dev.splitwise.com/) bereitzustellen.

Das Kernstück des SDK ist die Klasse `SplitwiseClient`, die als primäre Schnittstelle für alle API-Interaktionen dient. Sie kapselt die Authentifizierung, die Anfrageerstellung und die Fehlerbehandlung.

## 2. Projektstruktur

Das Projekt ist in folgende Hauptverzeichnisse und Dateien unterteilt:

```
/
├── .github/         # CI/CD-Workflows (GitHub Actions)
├── src/             # TypeScript-Quellcode
│   ├── index.ts     # Haupt-Client-Klasse (SplitwiseClient) und API-Methoden
│   ├── constants.ts # Globale Konstanten (z.B. API-URL)
│   ├── logger.ts    # Konfigurierbarer Logger
│   └── types/       # TypeScript-Typdefinitionen
│       ├── api.ts              # Manuell definierte oder exportierte API-Typen
│       ├── openapi-types.ts    # Automatisch aus OpenAPI generierte Typen
│       └── SplitwiseOptions.ts # Typ für die Client-Konfiguration
├── openapi.json     # Die originale OpenAPI-Spezifikation der Splitwise API
├── update_openapi.js# Skript zur Vorverarbeitung der OpenAPI-Spezifikation
├── package.json     # Projektmetadaten, Abhängigkeiten und Skripte
└── tsconfig.json    # TypeScript-Compiler-Konfiguration
```

## 3. Architektur-Komponenten

### 3.1. `SplitwiseClient` (src/index.ts)

Die `SplitwiseClient`-Klasse ist der zentrale Einstiegspunkt des SDK.

- **Initialisierung**: Der Client wird mit einem Konfigurationsobjekt vom Typ `SplitwiseOptions` initialisiert.
- **Authentifizierung**: Das SDK unterstützt zwei Authentifizierungsmethoden:
  1.  **OAuth 2.0**: Durch Angabe von `consumerKey` und `consumerSecret`. Das SDK nutzt die `oauth`-Bibliothek, um automatisch einen Access Token zu beziehen.
  2.  **Access Token**: Durch direkte Angabe eines `accessToken`.
- **Zustandsverwaltung**: Der Client verwaltet intern den `accessToken` und die `oauth`-Instanz.
- **Methoden**: Für jeden API-Endpunkt (z.B. `getCurrentUser`, `createExpense`) gibt es eine dedizierte, asynchrone Methode.

### 3.2. Anfrage-Logik (`request`-Methode)

Alle öffentlichen API-Methoden nutzen intern eine private `request`-Methode.

- **Generisch**: Sie ist für `GET`- und `POST`-Anfragen ausgelegt.
- **Token-Handling**: Sie stellt sicher, dass vor jeder Anfrage ein gültiger `accessToken` vorhanden ist (ggf. wird er per OAuth nachgefordert).
- **Kommunikation**: Sie verwendet die native `fetch`-API für HTTP-Anfragen.
- **Fehlerbehandlung**: Sie prüft den `ok`-Status der Antwort und wirft bei Fehlern einen `Error` mit dem Statuscode und der Antwort des Servers.
- **Serialisierung**: Request-Bodies werden als JSON serialisiert und der `Content-Type`-Header entsprechend gesetzt.

### 3.3. Typisierung (`src/types/`)

Das Projekt legt großen Wert auf starke Typisierung, um die Entwicklererfahrung zu verbessern.

- **`SplitwiseOptions.ts`**: Definiert die Konfigurationsoptionen für den Client.
- **`openapi-types.ts`**: Enthält TypeScript-Interfaces, die mithilfe des `openapi-typescript`-Tools aus der `openapi_updated.json`-Datei generiert werden. Diese Datei sollte nicht manuell bearbeitet werden.
- **`api.ts`**: Dient als Sammelpunkt für Typen oder für manuell erstellte Typen, die für die API-Interaktion benötigt werden.

## 4. Entwicklungs-Workflow und Tooling

### 4.1. OpenAPI-Typengenerierung

Da die von Splitwise bereitgestellte `openapi.json` nicht explizit `required`-Felder definiert, wird ein zweistufiger Prozess zur Generierung von Typen verwendet:

1.  **Vorverarbeitung**: Das Skript `update_openapi.js` liest die `openapi.json`, identifiziert alle nicht-nullbaren Eigenschaften in den Schemas und fügt sie zum `required`-Array des jeweiligen Schemas hinzu. Das Ergebnis wird in `openapi_updated.json` gespeichert.
2.  **Generierung**: Das Tool `openapi-typescript` wird auf die `openapi_updated.json` angewendet, um eine typsichere `src/types/openapi-types.ts`-Datei zu erstellen, die die API-Endpunkte und -Datenstrukturen abbildet.

### 4.2. Code-Qualität

- **Linting**: [ESLint](https://eslint.org/) wird verwendet, um konsistenten Code-Stil und Best Practices sicherzustellen.
- **Formatierung**: [Prettier](https://prettier.io/) sorgt für eine einheitliche Code-Formatierung.
- **Pre-Commit-Hooks**: [Husky](https://typicode.github.io/husky/) und [lint-staged](https://github.com/okonet/lint-staged) führen vor jedem Commit automatisch Linting und Formatierung für die geänderten Dateien aus.

### 4.3. Commit-Konventionen und Releases

- **Semantic Commits**: Das Projekt folgt den [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), um eine klare und nachvollziehbare Git-Historie zu gewährleisten. Dies wird durch `commitlint` erzwungen.
- **Automatisiertes Releasing**: [semantic-release](https://semantic-release.gitbook.io/semantic-release/) analysiert die Commit-Nachrichten seit dem letzten Release und bestimmt automatisch die nächste Versionsnummer, generiert ein Changelog und veröffentlicht das Paket auf npm.

### 4.4. Continuous Integration (CI)

GitHub Actions (`.github/workflows/`) werden für die Automatisierung von Qualitätssicherung und Releases eingesetzt:

- **`code-quality.yml`**: Führt bei jedem Push und Pull Request Linting- und Formatierungs-Checks aus.
- **`release.yml`**: Startet den `semantic-release`-Prozess, wenn Änderungen auf den `main`-Branch gemerged werden.

## 5. Abhängigkeiten

- **`oauth`**: Zur Handhabung des OAuth 2.0-Authentifizierungsflusses.
- **TypeScript**: Die primäre Programmiersprache.
- **Entwicklungs-Tools**: ESLint, Prettier, Husky, semantic-release, commitlint.
