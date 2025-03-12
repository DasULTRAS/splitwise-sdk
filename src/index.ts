import { OAuth2 } from "oauth";
import SplitwiseOptions from "@/types/SplitwiseOptions";
import * as types from "@/types/api";

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
    return response.json() as T;
  }

  // === API-Funktionen basierend auf der OpenAPI-Definition ===

  // Users
  async getCurrentUser(): Promise<types.GetCurrentUserResponse> {
    return this.request("get_current_user", "GET");
  }

  async getUser(id: number): Promise<types.GetUserResponse> {
    return this.request(`get_user/${id}`, "GET");
  }

  async updateUser(
    id: number,
    body: types.UpdateUserRequest
  ): Promise<types.UpdateUserResponse> {
    return this.request(`update_user/${id}`, "POST", body);
  }

  // Groups
  async getGroups(): Promise<types.GetGroupResponse> {
    return this.request("get_groups", "GET");
  }

  async getGroup(id: number): Promise<types.GetGroupResponse> {
    return this.request(`get_group/${id}`, "GET");
  }

  async createGroup(
    body: types.CreateGroupRequest
  ): Promise<types.CreateGroupResponse> {
    return this.request("create_group", "POST", body);
  }

  async deleteGroup(id: number): Promise<types.DeleteGroupResponse> {
    return this.request(`delete_group/${id}`, "POST");
  }

  async undeleteGroup(id: number): Promise<types.UndeleteGroupResponse> {
    return this.request(`undelete_group/${id}`, "POST");
  }

  async addUserToGroup(
    body: types.AddUserToGroupRequest
  ): Promise<types.AddUserToGroupResponse> {
    return this.request("add_user_to_group", "POST", body);
  }

  async removeUserFromGroup(body: {
    group_id: number;
    user_id: number;
  }): Promise<types.RemoveUserFromGroupResponse> {
    return this.request("remove_user_from_group", "POST", body);
  }

  // Friends
  async getFriends(): Promise<types.GetFriendsResponse> {
    return this.request("get_friends", "GET");
  }

  async getFriend(id: number): Promise<types.GetFriendResponse> {
    return this.request(`get_friend/${id}`, "GET");
  }

  async createFriend(
    body: types.CreateFriendRequest
  ): Promise<types.CreateFriendResponse> {
    return this.request("create_friend", "POST", body);
  }

  async createFriends(
    body: types.CreateFriendsResponse
  ): Promise<types.CreateFriendsResponse> {
    return this.request("create_friends", "POST", body);
  }

  async deleteFriend(id: number): Promise<types.DeleteFriendResponse> {
    return this.request(`delete_friend/${id}`, "POST");
  }

  // Currencies
  async getCurrencies(): Promise<types.GetCurrenciesResponse> {
    return this.request("get_currencies", "GET");
  }

  // Expenses
  async getExpense(id: number): Promise<types.GetExpenseResponse> {
    return this.request(`get_expense/${id}`, "GET");
  }

  async getExpenses(
    queryParams?: types.GetExpensesRequestParams
  ): Promise<types.GetExpensesResponse> {
    let endpoint = "get_expenses";
    if (queryParams && Object.keys(queryParams).length > 0) {
      endpoint += "?" + this.buildQueryString(queryParams);
    }
    return this.request(endpoint, "GET");
  }

  async createExpense(
    body: types.CreateExpenseRequest
  ): Promise<types.CreateExpenseResponse> {
    // body kann entweder vom Typ "equal_group_split" oder "by_shares" sein
    return this.request("create_expense", "POST", body);
  }

  async updateExpense(
    id: number,
    body: types.UpdateExpenseRequest
  ): Promise<types.UpdateExpenseResponse> {
    return this.request(`update_expense/${id}`, "POST", body);
  }

  async deleteExpense(id: number): Promise<types.DeleteExpenseResponse> {
    return this.request(`delete_expense/${id}`, "POST");
  }

  async undeleteExpense(id: number): Promise<types.UndeleteExpenseResponse> {
    return this.request(`undelete_expense/${id}`, "POST");
  }

  // Comments
  async getComments(expense_id: number): Promise<types.GetCommentsResponse> {
    const endpoint = "get_comments?" + this.buildQueryString({ expense_id });
    return this.request(endpoint, "GET");
  }

  async createComment(body: {
    expense_id?: number;
    content?: string;
  }): Promise<types.CreateCommentResponse> {
    return this.request("create_comment", "POST", body);
  }

  async deleteComment(id: number): Promise<types.DeleteCommentResponse> {
    return this.request(`delete_comment/${id}`, "POST");
  }

  // Notifications
  async getNotifications(queryParams?: {
    updated_after?: string;
    limit?: number;
  }): Promise<types.GetNotificationsResponse> {
    let endpoint = "get_notifications";
    if (queryParams && Object.keys(queryParams).length > 0) {
      endpoint += "?" + this.buildQueryString(queryParams);
    }
    return this.request(endpoint, "GET");
  }

  // Categories
  async getCategories(): Promise<types.GetCategoriesResponse> {
    return this.request("get_categories", "GET");
  }
}
