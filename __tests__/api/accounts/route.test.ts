/**
 * @jest-environment node
 */
import { GET, POST, DELETE, PATCH } from "@/app/api/accounts/route";
import { getAuthenticatedUser } from "@/auth.helper";
import { type NextRequest } from "next/server";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
}));

// Mock createAccount function
jest.mock("@/data/accounts", () => ({
  createAccount: jest.fn(),
  deleteAccounts: jest.fn(),
  updateAccount: jest.fn(),
  getUserAccountsCount: jest.fn(),
  getUserAccounts: jest.fn(),
}));

jest.mock("@/db", () => ({
  db: {
    userAccount: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock the auth module
jest.mock("@/auth.helper", () => ({
  getAuthenticatedUser: jest.fn(),
}));

// Import mocked modules
import { auth } from "@/auth";
import {
  createAccount,
  deleteAccounts,
  updateAccount,
  getUserAccountsCount,
  getUserAccounts,
} from "@/data/accounts";

describe("Accounts API", () => {
  const mockUser = { id: "user-id" };
  const mockAccount = {
    id: "account-1",
    name: "Test Account",
    currency: {
      id: "USD",
      name: "US Dollar",
      symbol: "$",
    },
    institutionName: "Test Bank",
    last4: "1234",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/accounts", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("should return accounts if authenticated", async () => {
      (getUserAccountsCount as jest.Mock).mockResolvedValueOnce(1);
      (getUserAccounts as jest.Mock).mockResolvedValueOnce([mockAccount]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: [
          {
            id: mockAccount.id,
            name: mockAccount.name,
            currency: mockAccount.currency,
            last4: mockAccount.last4,
            institution: {
              name: mockAccount.institutionName,
            },
          },
        ],
        meta: { count: 1 },
      });
    });
  });
  describe("POST /api/accounts", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ name: "Test Account" }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ name: "Test Account" }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if name is missing", async () => {
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should create account successfully", async () => {
      const mockNewAccount = {
        id: "account-123",
        name: "Test Account",
        currencyId: "USD",
        institutionName: "Test Bank",
      };
      (createAccount as jest.Mock).mockResolvedValueOnce(mockNewAccount);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          name: "Test Account",
          currencyId: "USD",
          institutionName: "Test Bank",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockNewAccount });
      expect(createAccount).toHaveBeenCalledWith(
        "Test Account",
        mockUser.id,
        "USD",
        "Test Bank"
      );
    });

    it("should handle database errors gracefully", async () => {
      (createAccount as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to create account")
      );
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          name: "Test Account",
          currencyId: "USD",
          institutionName: "Test Bank",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual("Error while creating account");
    });
  });
  describe("DELETE /api/accounts", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ ids: ["account-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ ids: ["account-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if ids are missing", async () => {
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should delete accounts successfully", async () => {
      const mockDeleteResult = { count: 2 };
      (deleteAccounts as jest.Mock).mockResolvedValueOnce(mockDeleteResult);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          ids: ["account-1", "account-2"],
        }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(deleteAccounts).toHaveBeenCalledWith(
        ["account-1", "account-2"],
        mockUser.id
      );
      expect(data).toEqual({ data: mockDeleteResult });
    });

    it("should handle database errors gracefully", async () => {
      (deleteAccounts as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to delete accounts")
      );
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          ids: ["account-1"],
        }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data).toEqual("Error while deleting accounts");
    });
  });
  describe("PATCH /api/accounts", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ id: "account-1" }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ id: "account-1" }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if id is missing", async () => {
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should update account successfully", async () => {
      const mockUpdatedAccount = {
        id: "account-1",
        name: "Updated Account",
        currencyId: "USD",
        institutionName: "Updated Bank",
      };

      (updateAccount as jest.Mock).mockResolvedValueOnce([mockUpdatedAccount]);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          id: "account-1",
          name: "Updated Account",
          currencyId: "USD",
          institutionName: "Updated Bank",
        }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual({ data: [mockUpdatedAccount] });
      expect(updateAccount).toHaveBeenCalledWith(
        "account-1",
        "Updated Account",
        "USD",
        mockUser.id,
        "Updated Bank"
      );
    });

    it("should handle database errors gracefully", async () => {
      (updateAccount as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to update account")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          id: "account-1",
          name: "Updated Account",
          currencyId: "USD",
          institutionName: "Updated Bank",
        }),
      };
      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual("Error while updating account");
    });
  });
});
