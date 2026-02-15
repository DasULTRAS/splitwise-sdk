import "dotenv/config";

/**
 * Read the Splitwise token from known env variable names.
 */
export function getExampleToken(): string {
  const token = process.env.SPLITWISE_TOKEN;
  if (!token) {
    throw new Error("Missing token. Set SPLITWISE_TOKEN in .env.");
  }
  return token;
}
