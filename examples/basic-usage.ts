/**
 * Basic usage of the Splitwise SDK.
 *
 * Requires a valid Splitwise access token.
 * @see https://dev.splitwise.com/ to create a token.
 */
import { Splitwise } from "splitwise-sdk";
import { getExampleToken } from "./_env.js";

const sw = new Splitwise({
  accessToken: getExampleToken(),
});

// Get current user
const { user } = await sw.users.getCurrentUser();
console.log("Logged in as:", user?.first_name, user?.last_name);

// List groups
const { groups } = await sw.groups.getGroups();
for (const group of groups ?? []) {
  console.log(`Group: ${group.name} (ID: ${group.id})`);
}

// Load group expenses
if (groups?.length) {
  const groupId = groups[0].id!;
  const { expenses } = await sw.expenses.getExpenses({
    group_id: groupId,
    limit: 3,
  });

  console.log(`\nLast 3 expenses in "${groups[0].name}":`);
  for (const expense of expenses ?? []) {
    console.log(
      `  - ${expense.description}: ${expense.cost} ${expense.currency_code}`,
    );
  }
}

// List friends
const { friends } = await sw.friends.getFriends();
console.log(`\n${friends?.length ?? 0} friends found`);

// Get currencies (automatically cached)
const { currencies } = await sw.currencies.getCurrencies();
console.log(`${currencies?.length ?? 0} currencies available`);
