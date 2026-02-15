/**
 * Grundlegende Nutzung des Splitwise SDK.
 *
 * Voraussetzung: ein gültiger Splitwise Access Token.
 * @see https://dev.splitwise.com/ für die Token-Erstellung.
 */
import { Splitwise } from "splitwise-sdk";
import { getExampleToken } from "./_env.js";

const sw = new Splitwise({
  accessToken: getExampleToken(),
});

// Aktuellen Benutzer abrufen
const { user } = await sw.users.getCurrentUser();
console.log("Eingeloggt als:", user?.first_name, user?.last_name);

// Gruppen auflisten
const { groups } = await sw.groups.getGroups();
for (const group of groups ?? []) {
  console.log(`Gruppe: ${group.name} (ID: ${group.id})`);
}

// Ausgaben einer Gruppe laden
if (groups?.length) {
  const groupId = groups[0].id!;
  const { expenses } = await sw.expenses.getExpenses({
    group_id: groupId,
    limit: 3,
  });

  console.log(`\nLetzte 3 Ausgaben in "${groups[0].name}":`);
  for (const expense of expenses ?? []) {
    console.log(
      `  - ${expense.description}: ${expense.cost} ${expense.currency_code}`,
    );
  }
}

// Freunde auflisten
const { friends } = await sw.friends.getFriends();
console.log(`\n${friends?.length ?? 0} Freunde gefunden`);

// Währungen abrufen (werden automatisch gecacht)
const { currencies } = await sw.currencies.getCurrencies();
console.log(`${currencies?.length ?? 0} Währungen verfügbar`);
