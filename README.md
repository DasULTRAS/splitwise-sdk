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

## **Entwicklung**

### Semantic Commits

Dieses Projekt verwendet **semantic-release** in Kombination mit **@semantic-release/commit-analyzer**.  
Daher müssen alle Commits einem bestimmten [Format](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) folgen und einen gültigen [Typ](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#type) enthalten.

Wenn du magst, kann ich auch noch einen kurzen Beispiels-Commit oder weiterführende Hinweise ergänzen.

### **Typen aus OpenAPI generieren (optional)**

Falls du automatische Typdefinitionen aus der OpenAPI-Datei erstellen möchtest, kannst du das Tool [openapi-typescript](https://github.com/drwpow/openapi-typescript) verwenden.

#### **Schritt 1: OpenAPI-Schema korrigieren (Optionale Felder entfernen)**

Da OpenAPI oft alle Felder als optional definiert, stellen wir sicher, dass `required`-Felder korrekt gesetzt werden, indem wir unser Skript ausführen:

```bash
node update_openapi.js
```

Dadurch wird die Datei `api.json` aktualisiert und als `api_updated.json` gespeichert.

#### **Schritt 2: OpenAPI in TypeScript-Typen umwandeln**

Nun können wir aus der bereinigten OpenAPI-Datei TypeScript-Typen generieren:

```bash
npx openapi-typescript api_updated.json --output src/types/openapi-types.ts
```

Das erzeugt eine Datei `openapi-types.ts`, die die Schnittstellen für deine API enthält.

### **Lokale Entwicklung**

Um die lokale Entwicklung zu erleichtern und Änderungen direkt in anderen Projekten zu testen, kannst du `npm link` verwenden. Dies erlaubt es, dein Paket in einem anderen Node.js-Projekt zu nutzen, ohne es erneut zu veröffentlichen.

1. **Link im lokalen Repository erstellen:**  
   Wechsle in das Verzeichnis deines Projekts und erstelle den globalen Link:

   ```bash
   npm link
   ```

2. **Projekt mit dem lokalen Paket verbinden:**  
   In einem anderen Projekt, das dein Paket nutzt, kannst du nun den Link setzen:

   ```bash
   npm link splitwise-sdk
   ```

   Dadurch wird das lokale Entwicklungsverzeichnis als Abhängigkeit eingebunden.

3. **Änderungen testen:**  
   Nach jeder Code-Änderung kannst du dein Paket neu bauen und die Änderungen sind direkt verfügbar:

   ```bash
   npm run build
   ```

4. **Link wieder entfernen (optional):**  
   Falls du wieder zur offiziellen Version aus dem `npm`-Registry wechseln möchtest, entferne den Link mit:
   ```bash
   npm unlink splitwise-sdk
   ```

Durch diese Vorgehensweise kannst du Änderungen am SDK effizient testen, ohne es jedes Mal neu veröffentlichen zu müssen. 🚀

## Lizenz

Dieses Projekt steht unter der MIT‑Lizenz.
