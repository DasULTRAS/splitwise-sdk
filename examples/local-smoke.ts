/**
 * Local smoke test for repository development.
 *
 * This example imports from src directly so you can test current changes
 * without building dist first.
 */
import { AuthenticationError, SilentLogger, Splitwise } from "../src/index.js";
import { getExampleToken } from "./_env.js";

const sw = new Splitwise({
  accessToken: getExampleToken(),
  logger: new SilentLogger(),
  retry: { maxRetries: 0 },
});

try {
  const { user } = await sw.users.getCurrentUser();
  console.log("OK: authenticated as", user?.first_name, user?.last_name);

  const { groups } = await sw.groups.getGroups();
  console.log("OK: groups loaded:", groups?.length ?? 0);

  const { currencies } = await sw.currencies.getCurrencies();
  console.log("OK: currencies loaded:", currencies?.length ?? 0);
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error("Authentication failed: token is invalid or expired.");
    process.exit(2);
  }

  if (err instanceof Error && err.message.startsWith("Missing token.")) {
    console.error(err.message);
    process.exit(1);
  }

  console.error("Smoke test failed:", err);
  process.exit(3);
}
