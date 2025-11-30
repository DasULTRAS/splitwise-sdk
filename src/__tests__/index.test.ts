import { SplitwiseClient } from "../index";
import { OAuth2 } from "oauth";
import { HTTP_VERBS } from "../constants";

// Create a shared mock function for getOAuthAccessToken
const mockGetOAuthAccessToken = jest.fn(
  (
    _code: any,
    _params: any,
    callback: (err?: Error, accessToken?: string) => void,
  ) => {
    callback(undefined, "mocked_access_token");
  },
);

// Mocking the 'oauth' library to use the shared function
jest.mock("oauth", () => ({
  OAuth2: jest.fn().mockImplementation(() => ({
    getOAuthAccessToken: mockGetOAuthAccessToken,
  })),
}));

// Mocking global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("SplitwiseClient", () => {
  let client: SplitwiseClient;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockFetch.mockReset();
    // Reset the implementation of the shared mock function to its default
    mockGetOAuthAccessToken.mockImplementation(
      (
        _code: any,
        _params: any,
        callback: (err?: Error, accessToken?: string) => void,
      ) => {
        callback(undefined, "mocked_access_token");
      },
    );
  });

  describe("Initialization", () => {
    it("should initialize with an access token", () => {
      client = new SplitwiseClient({ accessToken: "my_token" });
      expect(client).toBeInstanceOf(SplitwiseClient);
    });

    it("should initialize with consumerKey and consumerSecret", () => {
      client = new SplitwiseClient({
        consumerKey: "key",
        consumerSecret: "secret",
      });
      expect(client).toBeInstanceOf(SplitwiseClient);
      expect(OAuth2).toHaveBeenCalledWith(
        "key",
        "secret",
        "https://secure.splitwise.com/",
        "oauth/",
        "oauth/token",
        undefined,
      );
    });
  });

  describe("Logging", () => {
    it("should use the custom logger if provided", async () => {
      const customLogger = jest.fn();
      client = new SplitwiseClient({
        accessToken: "my_token",
        logger: customLogger,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await client.getCurrentUser();
      expect(customLogger).toHaveBeenCalled();
      expect(customLogger).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
      );
    });
  });

  describe("fetchAccessToken", () => {
    it("should return the existing access token if available", async () => {
      client = new SplitwiseClient({ accessToken: "existing_token" });
      const token = await client.fetchAccessToken();
      expect(token).toBe("existing_token");
      expect(mockGetOAuthAccessToken).not.toHaveBeenCalled();
    });

    it("should fetch a new token if one is not available", async () => {
      client = new SplitwiseClient({
        consumerKey: "key",
        consumerSecret: "secret",
      });
      const token = await client.fetchAccessToken();
      expect(token).toBe("mocked_access_token");
      expect(mockGetOAuthAccessToken).toHaveBeenCalled();
    });

    it("should throw an error if fetching a token without credentials", async () => {
      client = new SplitwiseClient({});
      await expect(client.fetchAccessToken()).rejects.toThrow(
        "Consumer Key und Consumer Secret sind erforderlich, um einen Access Token abzurufen.",
      );
    });

    it("should throw an error if oauth library returns an error", async () => {
      const oauthError = new Error("OAuth Failed");
      mockGetOAuthAccessToken.mockImplementationOnce(
        (
          _code: any,
          _params: any,
          callback: (err?: Error, accessToken?: string) => void,
        ) => {
          callback(oauthError, undefined);
        },
      );

      client = new SplitwiseClient({
        consumerKey: "key",
        consumerSecret: "secret",
      });

      await expect(client.fetchAccessToken()).rejects.toBe(oauthError);
    });
  });

  describe("request", () => {
    beforeEach(() => {
      client = new SplitwiseClient({ accessToken: "test_token" });
    });

    it("should make a GET request successfully", async () => {
      const mockResponse = { user: { id: 1, first_name: "John" } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = await client.request("get_current_user");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://secure.splitwise.com/api/v3.0/get_current_user",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer test_token",
            "Content-Type": "application/json",
          },
          body: undefined,
        },
      );
      expect(data).toEqual(mockResponse);
    });

    it("should make a POST request successfully", async () => {
      const mockRequestBody = { name: "New Group" };
      const mockResponse = { group: { id: 123, name: "New Group" } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = await client.request(
        "create_group",
        HTTP_VERBS.POST,
        mockRequestBody,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://secure.splitwise.com/api/v3.0/create_group",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test_token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mockRequestBody),
        },
      );
      expect(data).toEqual(mockResponse);
    });

    it("should throw an error if the API response is not ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "Endpoint not found",
      });

      await expect(client.request("non_existent_endpoint")).rejects.toThrow(
        "API-Anfrage fehlgeschlagen: 404 Not Found – Endpoint not found",
      );
    });
  });

  describe("API Methods", () => {
    beforeEach(() => {
      client = new SplitwiseClient({ accessToken: "test_token" });
      // Default successful mock for happy path tests
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    // Utility to mock a failed API response
    const mockApiError = () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server Error",
      });
    };

    describe("Users", () => {
      it("getCurrentUser should call the correct endpoint", async () => {
        await client.getCurrentUser();
        const expectedUrl =
          "https://secure.splitwise.com/api/v3.0/get_current_user";
        expect(mockFetch.mock.calls[0][0]).toBe(expectedUrl);
        expect(mockFetch.mock.calls[0][1]?.method).toBe("GET");
      });

      it("getUser should call the correct endpoint with a path parameter", async () => {
        const userId = 12345;
        await client.getUser(userId);
        const expectedUrl = `https://secure.splitwise.com/api/v3.0/get_user/${userId}`;
        expect(mockFetch.mock.calls[0][0]).toBe(expectedUrl);
        expect(mockFetch.mock.calls[0][1]?.method).toBe("GET");
      });

      it("updateUser should call the correct endpoint with body and path parameter", async () => {
        const userId = 12345;
        const userData = { email: "new.email@example.com" };
        await client.updateUser(userId, userData);

        const expectedUrl = `https://secure.splitwise.com/api/v3.0/update_user/${userId}`;
        expect(mockFetch.mock.calls[0][0]).toBe(expectedUrl);
        expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
        expect(mockFetch.mock.calls[0][1]?.body).toBe(JSON.stringify(userData));
      });

      it("updateUser should throw an error on API failure", async () => {
        mockApiError();
        await expect(client.updateUser(1, {})).rejects.toThrow(
          "API-Anfrage fehlgeschlagen: 500 Internal Server Error – Server Error",
        );
      });
    });

    describe("Groups", () => {
      it("createGroup should call the correct endpoint with a body", async () => {
        const groupData = {
          name: "Test Trip",
          group_type: "trip",
          users__0__user_id: "1",
          users__0__first_name: "John",
        };
        await client.createGroup(groupData);
        const expectedUrl =
          "https://secure.splitwise.com/api/v3.0/create_group";
        expect(mockFetch.mock.calls[0][0]).toBe(expectedUrl);
        expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
        expect(mockFetch.mock.calls[0][1]?.body).toBe(
          JSON.stringify(groupData),
        );
      });

      it("deleteGroup should call the correct endpoint with a path parameter", async () => {
        const groupId = 987;
        await client.deleteGroup(groupId);
        const expectedUrl = `https://secure.splitwise.com/api/v3.0/delete_group/${groupId}`;
        expect(mockFetch.mock.calls[0][0]).toBe(expectedUrl);
        expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
      });

      it("deleteGroup should throw an error on API failure", async () => {
        mockApiError();
        await expect(client.deleteGroup(987)).rejects.toThrow(
          "API-Anfrage fehlgeschlagen: 500 Internal Server Error – Server Error",
        );
      });
    });

    describe("Expenses", () => {
      it("getExpenses should handle query parameters correctly", async () => {
        await client.getExpenses({ group_id: 123, limit: 10 });
        const expectedUrl =
          "https://secure.splitwise.com/api/v3.0/get_expenses?group_id=123&limit=10";
        expect(mockFetch.mock.calls[0][0]).toBe(expectedUrl);
      });

      it("getExpenses should work with no query parameters", async () => {
        await client.getExpenses();
        const expectedUrl =
          "https://secure.splitwise.com/api/v3.0/get_expenses";
        expect(mockFetch.mock.calls[0][0]).toBe(expectedUrl);
      });

      it("getExpense should call the correct endpoint with a path parameter", async () => {
        const expenseId = 54321;
        await client.getExpense(expenseId);
        const expectedUrl = `https://secure.splitwise.com/api/v3.0/get_expense/${expenseId}`;
        expect(mockFetch.mock.calls[0][0]).toBe(expectedUrl);
        expect(mockFetch.mock.calls[0][1]?.method).toBe("GET");
      });
    });
  });
});
