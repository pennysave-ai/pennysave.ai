/**
 * @jest-environment node
 */

jest.mock("@/data/stripe", () => ({
  STRIPE: {
    getInstance: jest.fn(() => ({
      // Mock Stripe methods if needed
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    })),
  },
}));

process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
process.env.RESEND_API_KEY = "test-api-key";

import { POST } from "@/app/api/transactions/bulk-create/route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { bulkCreateTransactions } from "@/data/transactions";

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

describe("Bulk Create Transactions API", () => {
  const mockUser = { id: "user-123" };
  const mockSession = { user: mockUser };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/transactions/bulk-create", () => {
    it("should return 401 if not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValue([]),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
      expect(await response.json()).toBe("Unautorized");
    });

    it("should create multiple transactions", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (bulkCreateTransactions as jest.Mock).mockResolvedValue([
        {
          id: "8140d91e-a51e-43ae-95bd-3000e9f427be",
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: new Date().toISOString(),
          categoryId: "category-1",
        },
        {
          id: "7c443ac1-6176-42c2-a4ec-7c532c3f97e8",
          amount: 200,
          payee: "Payee 2",
          notes: "Notes 2",
          accountId: "account-2",
          createdAt: new Date().toISOString(),
          categoryId: "category-2",
        },
      ]);

      const mockReq = {
        json: jest.fn().mockResolvedValue([
          {
            id: "8140d91e-a51e-43ae-95bd-3000e9f427be",
            amount: 100,
            payee: "Payee 1",
            notes: "Notes 1",
            accountId: "0de9d835-f81e-4a88-ba43-c986d2047b0d",
            createdAt: new Date().toISOString(),
            categoryId: "category-1",
          },
          {
            id: "7c443ac1-6176-42c2-a4ec-7c532c3f97e8",
            amount: 200,
            payee: "Payee 2",
            notes: "Notes 2",
            accountId: "a689ddab-b2cb-4d29-aefc-796e7db978a9",
            createdAt: new Date().toISOString(),
            categoryId: "category-2",
          },
        ]),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: [
          {
            id: "8140d91e-a51e-43ae-95bd-3000e9f427be",
            amount: 100,
            payee: "Payee 1",
            notes: "Notes 1",
            accountId: "0de9d835-f81e-4a88-ba43-c986d2047b0d",
            createdAt: expect.any(String),
            categoryId: "category-1",
          },
          {
            id: "7c443ac1-6176-42c2-a4ec-7c532c3f97e8",
            amount: 200,
            payee: "Payee 2",
            notes: "Notes 2",
            accountId: "a689ddab-b2cb-4d29-aefc-796e7db978a9",
            createdAt: expect.any(String),
            categoryId: "category-2",
          },
        ],
      });
    });

    it("should handle errors gracefully", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (bulkCreateTransactions as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValue([
          {
            id: "8140d91e-a51e-43ae-95bd-3000e9f427be",
            amount: 100,
            payee: "Payee 1",
            notes: "Notes 1",
            accountId: "0de9d835-f81e-4a88-ba43-c986d2047b0d",
            createdAt: new Date().toISOString(),
            categoryId: "category-1",
          },
          {
            id: "7c443ac1-6176-42c2-a4ec-7c532c3f97e8",
            amount: 200,
            payee: "Payee 2",
            notes: "Notes 2",
            accountId: "a689ddab-b2cb-4d29-aefc-796e7db978a9",
            createdAt: new Date().toISOString(),
            categoryId: "category-2",
          },
        ]),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(500);
      expect(await response.json()).toBe("Error creating transactions");
    });
  });
});
