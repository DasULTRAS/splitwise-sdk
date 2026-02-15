import "dotenv/config";

/**
 * Read the Splitwise token from known env variable names.
 */
export function getExampleToken(): string {
  const token = process.env.SPLITWISE_TOKEN ?? process.env.SPLITWISE_API_KEY;
  if (!token) {
    throw new Error(
      "Missing token. Set SPLITWISE_TOKEN or SPLITWISE_API_KEY in .env.",
    );
  }
  return token;
}
