/**
 * @jest-environment node
 */
import { GET } from "@/app/api/transactions/[id]/route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getUserTransactionById } from "@/data/transactions";

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
jest.mock("@/data/transactions");

jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      sendEmail: jest.fn().mockResolvedValue({ id: "mock-email-id" }),
    })),
  };
});
process.env.RESEND_API_KEY = "test-api-key";

describe("Transaction API", () => {
  const mockUser = { id: "user-123" };
  const mockSession = { user: mockUser };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/transactions/[id]", () => {
    it("should return 401 if not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        nextUrl: { searchParams: new URLSearchParams() },
      };

      const response = await GET(mockReq as unknown as NextRequest, {
        params: { id: "transaction-1" },
      });
      expect(response.status).toBe(401);
      expect(await response.json()).toBe("Unautorized");
    });

    it("should return a transaction by ID", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getUserTransactionById as jest.Mock).mockResolvedValue({
        id: "transaction-1",
        amount: 100,
        payee: "Payee 1",
        notes: "Notes 1",
        accountId: "account-1",
        createdAt: new Date(),
        categoryId: "category-1",
      });

      const mockReq = {
        nextUrl: { searchParams: new URLSearchParams("id=transaction-1") },
      };

      const response = await GET(mockReq as unknown as NextRequest, {
        params: { id: "transaction-1" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
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
    });

    it("should handle errors gracefully", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getUserTransactionById as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const mockReq = {
        nextUrl: { searchParams: new URLSearchParams() },
      };

      const response = await GET(mockReq as unknown as NextRequest, {
        params: { id: "transaction-1" },
      });
      expect(response.status).toBe(500);
      expect(await response.json()).toBe(
        `Error while fetching transaction transaction-1`
      );
    });
  });
});
