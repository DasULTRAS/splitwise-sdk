# Splitwise SDK

Dieses Projekt ist ein SDK für die Splitwise API. Es unterstützt sowohl die OAuth‑basierte Authentifizierung (über consumerKey/consumerSecret) als auch die direkte Nutzung eines vorhandenen accessToken.

## Nutzung

Erstelle eine Instanz des Clients und rufe API-Endpunkte auf. Beispiel:

```typescript
import { SplitwiseClient } from "splitwise-sdk";

const sw = new SplitwiseClient({
  consumerKey: "your_consumer_key",
  consumerSecret: "your_consumer_secret",
  // Alternativ:
  // accessToken: 'your_access_token'
  logger: console.log,
});

sw.getCurrentUser()
  .then((userData) => console.log("Aktueller Benutzer:", userData))
  .catch((err) => console.error("Fehler:", err));
```

## API-Endpunkte

Das SDK unterstützt die meisten Endpunkte, die in der OpenAPI‑Definition der Splitwise API definiert sind, darunter:

- Benutzerverwaltung: `getCurrentUser`, `getUser`, `updateUser`
- Gruppenverwaltung: `getGroups`, `getGroup`, `createGroup`, `deleteGroup`, `undeleteGroup`, `addUserToGroup`, `removeUserFromGroup`
- Freunde: `getFriends`, `getFriend`, `createFriend`, `createFriends`, `deleteFriend`
- Währungen: `getCurrencies`
- Ausgaben: `getExpense`, `getExpenses`, `createExpense`, `updateExpense`, `deleteExpense`, `undeleteExpense`
- Kommentare: `getComments`, `createComment`, `deleteComment`
- Benachrichtigungen: `getNotifications`
- Kategorien: `getCategories`

Weitere Details zu den Parametern und Rückgabetypen findest du in der OpenAPI‑Definition.

## Entwicklung

- **Typen aus OpenAPI generieren (optional):**  
  Um automatische Typdefinitionen aus der OpenAPI‑Datei zu erstellen, kannst du z. B. [openapi-typescript](https://github.com/drwpow/openapi-typescript) verwenden:
  ```bash
  npx openapi-typescript openapi.json --output src/api-types.d.ts
  ```

## Lizenz

Dieses Projekt steht unter der MIT‑Lizenz.
