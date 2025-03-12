// src/index.ts

import { OAuth2 } from "oauth";
import SplitwiseOptions from "./types/SplitwiseOptions";

export class SplitwiseClient {
  private consumerKey?: string;
  private consumerSecret?: string;
  private accessToken?: string;
  private oauth2?: OAuth2;
  private readonly apiUrl = "https://secure.splitwise.com/api/v3.0/";
  private logger: (message: string) => void;

  constructor(options: SplitwiseOptions) {
    this.consumerKey = options.consumerKey;
    this.consumerSecret = options.consumerSecret;
    this.accessToken = options.accessToken;
    this.logger = options.logger || console.log;

    // OAuth2-Instanz initialisieren, falls consumerKey und consumerSecret vorhanden sind.
    if (this.consumerKey && this.consumerSecret) {
      this.oauth2 = new OAuth2(
        this.consumerKey,
        this.consumerSecret,
        "https://secure.splitwise.com/", // Basis-URL
        "oauth/", // Autorisierungs-Pfad (anpassen falls nötig)
        "oauth/token", // Access-Token-Pfad (anpassen falls nötig)
        undefined // Statt null: undefined
      );
    }
  }

  private log(level: "info" | "error", message: string): void {
    this.logger(`[${level.toUpperCase()}] ${message}`);
  }

  /**
   * Hilfsmethode, um Query-Strings aus einem Objekt zu erzeugen.
   */
  private buildQueryString(params: Record<string, unknown>): string {
    const qs = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        qs.append(key, String(params[key]));
      }
    }
    return qs.toString();
  }

  /**
   * Holt den Access Token mithilfe der OAuth-Library.
   * Falls bereits ein Token vorhanden ist, wird dieser genutzt.
   */
  async fetchAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }
    if (!this.oauth2) {
      throw new Error(
        "Consumer Key und Consumer Secret sind erforderlich, um einen Access Token abzurufen."
      );
    }

    this.log("info", "Access Token wird abgerufen...");
    // Eigener Promise-Wrapper, um den callback-basierten Aufruf zu behandeln
    const token: string = await new Promise((resolve, reject) => {
      this.oauth2!.getOAuthAccessToken(
        "",
        { grant_type: "client_credentials" },
        (err, token) => {
          if (err) {
            reject(err);
          } else {
            if (token) {
              resolve(token);
            } else {
              reject(new Error("Token is undefined"));
            }
          }
        }
      );
    });

    if (!token) {
      throw new Error("Kein Access Token in der Antwort enthalten.");
    }
    this.accessToken = token;
    this.log("info", "Access Token erfolgreich abgerufen.");
    return token;
  }

  /**
   * Generische Methode, um API-Anfragen zu stellen.
   */
  async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<T> {
    const token = await this.fetchAccessToken();
    const url = `${this.apiUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    this.log("info", `Anfrage an ${url} (Methode: ${method}) wird ausgeführt.`);
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API-Anfrage fehlgeschlagen: ${response.status} ${response.statusText} – ${errorBody}`
      );
    }
    return response.json();
  }

  // === API-Funktionen basierend auf der OpenAPI-Definition ===

  // Users
  async getCurrentUser<T>(): Promise<T> {
    return this.request<T>("get_current_user", "GET");
  }

  async getUser<T>(id: number): Promise<T> {
    return this.request<T>(`get_user/${id}`, "GET");
  }

  async updateUser<T>(
    id: number,
    body: {
      first_name?: string;
      last_name?: string;
      email?: string;
      password?: string;
      locale?: string;
      default_currency?: string;
    }
  ): Promise<T> {
    return this.request<T>(`update_user/${id}`, "POST", body);
  }

  // Groups
  async getGroups<T>(): Promise<T> {
    return this.request<T>("get_groups", "GET");
  }

  async getGroup<T>(id: number): Promise<T> {
    return this.request<T>(`get_group/${id}`, "GET");
  }

  async createGroup<T>(body: {
    name: string;
    group_type?: "home" | "trip" | "couple" | "other" | "apartment" | "house";
    simplify_by_default?: boolean;
    [key: string]: string | number | boolean | undefined;
  }): Promise<T> {
    return this.request<T>("create_group", "POST", body);
  }

  async deleteGroup<T>(id: number): Promise<T> {
    return this.request<T>(`delete_group/${id}`, "POST");
  }

  async undeleteGroup<T>(id: number): Promise<T> {
    return this.request<T>(`undelete_group/${id}`, "POST");
  }

  async addUserToGroup<T>(body: {
    group_id?: number;
    user_id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  }): Promise<T> {
    return this.request<T>("add_user_to_group", "POST", body);
  }

  async removeUserFromGroup<T>(body: {
    group_id: number;
    user_id: number;
  }): Promise<T> {
    return this.request<T>("remove_user_from_group", "POST", body);
  }

  // Friends
  async getFriends<T>(): Promise<T> {
    return this.request<T>("get_friends", "GET");
  }

  async getFriend<T>(id: number): Promise<T> {
    return this.request<T>(`get_friend/${id}`, "GET");
  }

  async createFriend<T>(body: {
    user_email?: string;
    user_first_name?: string;
    user_last_name?: string;
  }): Promise<T> {
    return this.request<T>("create_friend", "POST", body);
  }

  async createFriends<T>(body: { [key: string]: string }): Promise<T> {
    return this.request<T>("create_friends", "POST", body);
  }

  async deleteFriend<T>(id: number): Promise<T> {
    return this.request<T>(`delete_friend/${id}`, "POST");
  }

  // Currencies
  async getCurrencies<T>(): Promise<T> {
    return this.request<T>("get_currencies", "GET");
  }

  // Expenses
  async getExpense<T>(id: number): Promise<T> {
    return this.request<T>(`get_expense/${id}`, "GET");
  }

  async getExpenses<T>(queryParams?: {
    group_id?: number;
    friend_id?: number;
    dated_after?: string;
    dated_before?: string;
    updated_after?: string;
    updated_before?: string;
    limit?: number;
    offset?: number;
  }): Promise<T> {
    let endpoint = "get_expenses";
    if (queryParams && Object.keys(queryParams).length > 0) {
      endpoint += "?" + this.buildQueryString(queryParams);
    }
    return this.request<T>(endpoint, "GET");
  }

  async createExpense<T>(body: unknown): Promise<T> {
    // body kann entweder vom Typ "equal_group_split" oder "by_shares" sein
    return this.request<T>("create_expense", "POST", body);
  }

  async updateExpense<T>(id: number, body: unknown): Promise<T> {
    return this.request<T>(`update_expense/${id}`, "POST", body);
  }

  async deleteExpense<T>(id: number): Promise<T> {
    return this.request<T>(`delete_expense/${id}`, "POST");
  }

  async undeleteExpense<T>(id: number): Promise<T> {
    return this.request<T>(`undelete_expense/${id}`, "POST");
  }

  // Comments
  async getComments<T>(expense_id: number): Promise<T> {
    const endpoint = "get_comments?" + this.buildQueryString({ expense_id });
    return this.request<T>(endpoint, "GET");
  }

  async createComment<T>(body: {
    expense_id?: number;
    content?: string;
  }): Promise<T> {
    return this.request<T>("create_comment", "POST", body);
  }

  async deleteComment<T>(id: number): Promise<T> {
    return this.request<T>(`delete_comment/${id}`, "POST");
  }

  // Notifications
  async getNotifications<T>(queryParams?: {
    updated_after?: string;
    limit?: number;
  }): Promise<T> {
    let endpoint = "get_notifications";
    if (queryParams && Object.keys(queryParams).length > 0) {
      endpoint += "?" + this.buildQueryString(queryParams);
    }
    return this.request<T>(endpoint, "GET");
  }

  // Categories
  async getCategories<T>(): Promise<T> {
    return this.request<T>("get_categories", "GET");
  }
}
