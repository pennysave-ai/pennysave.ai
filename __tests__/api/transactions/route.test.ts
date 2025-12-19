/**
 * @jest-environment node
 */
import { GET, POST, DELETE, PATCH } from "@/app/api/transactions/route";
import { NextRequest } from "next/server";
import { getTransactionsSchema, updateTransactionSchema } from "@/schemas";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  createTransaction,
  getUserTransactionsCountByAccount,
  deleteTransactions,
  updateTransaction,
  getUserTransactions,
} from "@/data/transactions";
import { getUsersWithAccessToAccount } from "@/data/userAccounts";

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

// Mock the auth module
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));
jest.mock("@/schemas");
jest.mock("@/data/transactions");
jest.mock("@/data/userAccounts");

jest.mock("@/lib/websocket", () => ({
  sendWebSocketMessage: jest.fn(),
}));

jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      sendEmail: jest.fn().mockResolvedValue({ id: "mock-email-id" }),
    })),
  };
});

jest.mock("@/auth.helper", () => ({
  getAuthenticatedUser: jest.fn(),
}));

process.env.RESEND_API_KEY = "test-api-key";

describe("Transactions API", () => {
  const mockUser = { id: "user-123" };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/transactions", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const mockReq = {
        nextUrl: { searchParams: new URLSearchParams() },
      };

      const response = await GET(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
      expect(await response.json()).toBe("Unautorized");
    });

    it("should return transactions and count", async () => {
      (getTransactionsSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
      });
      (getUserTransactions as jest.Mock).mockResolvedValue([
        {
          id: "transaction-1",
          payee: "Payee 1",
          notes: "Notes 1",
          logo: "Logo 1",
          account: {
            id: "account-1",
            name: "Account 1",
            currency: { id: "currency-1", name: "Currency 1" },
            last4: "1234",
            institution: { name: "Institution 1" },
          },
        },
      ]);
      (getUserTransactionsCountByAccount as jest.Mock).mockResolvedValue(1);

      const mockReq = {
        nextUrl: { searchParams: new URLSearchParams() },
      };

      const response = await GET(mockReq as unknown as NextRequest);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: [
          {
            id: "transaction-1",
            payee: "Payee 1",
            notes: "Notes 1",
            logo: "Logo 1",
            account: {
              id: "account-1",
              name: "Account 1",
              currency: { id: "currency-1", name: "Currency 1" },
              last4: "1234",
              institution: { name: "Institution 1" },
            },
          },
        ],
        meta: { count: 1 },
      });
    });

    it("should return 400 if validation fails", async () => {
      // (getAuthenticatedUser as jest.Mock).mockResolvedValue(mockSession);
      (getTransactionsSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: new Error("Validation error"),
      });

      const mockReq = {
        nextUrl: { searchParams: new URLSearchParams() },
      };

      const response = await GET(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
      expect(await response.json()).toBe("Bad Request");
    });
  });

  describe("POST /api/transactions", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValue({}),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
      expect(await response.json()).toBe("Unautorized");
    });

    it("should create a new transaction", async () => {
      (createTransaction as jest.Mock).mockResolvedValue({
        id: "transaction-1",
        amount: 100,
        payee: "Payee 1",
        notes: "Notes 1",
        accountId: "account-1",
        createdAt: expect.any(Date),
        categoryId: "category-1",
      });
      (getUsersWithAccessToAccount as jest.Mock).mockResolvedValue([
        {
          id: "user-123",
          email: "user@example.com",
        },
      ]);

      const mockReq = {
        json: jest.fn().mockResolvedValue({
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: expect.any(Date),
          categoryId: "category-1",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: "transaction-1",
        amount: 100,
        payee: "Payee 1",
        notes: "Notes 1",
        accountId: "account-1",
        createdAt: expect.any(Date),
        categoryId: "category-1",
      });
    });

    it("should handle errors gracefully", async () => {
      (createTransaction as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValue({
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: expect.any(Date),
          categoryId: "category-1",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(500);
      expect(await response.json()).toBe(
        "Error while creating a new transaction"
      );
    });
  });

  describe("DELETE /api/transactions", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ ids: ["transaction-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
      expect(await response.json()).toBe("Unautorized");
    });

    it("should delete transactions", async () => {
      (deleteTransactions as jest.Mock).mockResolvedValue({ count: 1 });

      const mockReq = {
        json: jest.fn().mockResolvedValue({ ids: ["transaction-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: { count: 1 } });
    });

    it("should return 400 if ids are missing", async () => {
      const mockReq = {
        json: jest.fn().mockResolvedValue({}),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
      expect(await response.json()).toBe("Bad Request");
    });

    it("should handle errors gracefully", async () => {
      (deleteTransactions as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValue({ ids: ["transaction-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(500);
      expect(await response.json()).toBe("Error while deleting transactions");
    });
  });

  describe("PATCH /api/transactions", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ id: "transaction-1" }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
      expect(await response.json()).toBe("Unautorized");
    });

    it("should update a transaction", async () => {
      (updateTransactionSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "transaction-1",
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: expect.any(Date),
          categoryId: "category-1",
        },
      });
      (updateTransaction as jest.Mock).mockResolvedValue({
        id: "transaction-1",
        amount: 100,
        payee: "Payee 1",
        notes: "Notes 1",
        accountId: "account-1",
        createdAt: expect.any(Date),
        categoryId: "category-1",
      });

      const mockReq = {
        json: jest.fn().mockResolvedValue({
          id: "transaction-1",
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: expect.any(Date),
          categoryId: "category-1",
        }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: "transaction-1",
        amount: 100,
        payee: "Payee 1",
        notes: "Notes 1",
        accountId: "account-1",
        createdAt: expect.any(Date),
        categoryId: "category-1",
      });
    });

    it("should return 400 if validation fails", async () => {
      (updateTransactionSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: new Error("Validation error"),
      });

      const mockReq = {
        json: jest.fn().mockResolvedValue({
          id: "transaction-1",
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: expect.any(Date),
          categoryId: "category-1",
        }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
      expect(await response.json()).toBe("Bad Request");
    });

    it("should handle errors gracefully", async () => {
      (updateTransactionSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "transaction-1",
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: expect.any(Date),
          categoryId: "category-1",
        },
      });
      (updateTransaction as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValue({
          id: "transaction-1",
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: expect.any(Date),
          categoryId: "category-1",
        }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(500);
      expect(await response.json()).toBe("Error while updating transaction");
    });
  });
});
