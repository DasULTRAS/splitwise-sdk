/**
 * Authentication module – access token injection only.
 *
 * The SDK does NOT implement OAuth flows. Token acquisition, rotation,
 * and refresh are the responsibility of the SDK consumer. The SDK only
 * sets the `Authorization: Bearer <token>` header.
 */

import { AuthenticationError } from "./errors.js";

export type TokenProvider = string | (() => string | Promise<string>);

/**
 * Resolve the access token from a static string or a provider function.
 */
export async function resolveToken(provider: TokenProvider): Promise<string> {
  const token = typeof provider === "function" ? await provider() : provider;
  if (!token) {
    throw new AuthenticationError(
      "/",
      "N/A",
      "Access token is empty or undefined",
    );
  }
  return token;
}

/**
 * Build the `Authorization` header value.
 */
export function bearerHeader(token: string): string {
  return `Bearer ${token}`;
}
