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

import {
  bulkCreateTransactions,
  getUserTransactionById,
} from "@/data/transactions";
import { db } from "@/db";

jest.mock("@/db", () => ({
  db: {
    transaction: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      sendEmail: jest.fn().mockResolvedValue({ id: "mock-email-id" }),
    })),
  };
});

process.env.RESEND_API_KEY = "test-api-key";

describe("Transactions Data Access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("bulkCreateTransactions", () => {
    it("should create multiple transactions", async () => {
      const mockTransactions = [
        {
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: "2023-10-01T00:00:00.000Z",
          categoryId: "category-1",
        },
        {
          amount: 200,
          payee: "Payee 2",
          notes: "Notes 2",
          accountId: "account-2",
          createdAt: "2023-10-02T00:00:00.000Z",
          categoryId: "category-2",
        },
      ];
      (db.transaction.createMany as jest.Mock).mockResolvedValue({
        count: mockTransactions.length,
      });

      const result = await bulkCreateTransactions(mockTransactions, "user-123");

      expect(result).toEqual({ count: mockTransactions.length });
      expect(db.transaction.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            amount: 100,
            payee: "Payee 1",
            notes: "Notes 1",
            accountId: "account-1",
            categoryId: "category-1",
            createdBy: "user-123",
            id: expect.any(String), // UUID is generated
          }),
          expect.objectContaining({
            amount: 200,
            payee: "Payee 2",
            notes: "Notes 2",
            accountId: "account-2",
            categoryId: "category-2",
            createdBy: "user-123",
            id: expect.any(String), // UUID is generated
          }),
        ]),
      });
    });

    it("should handle errors gracefully", async () => {
      const mockTransactions = [
        {
          amount: 100,
          payee: "Payee 1",
          notes: "Notes 1",
          accountId: "account-1",
          createdAt: "2023-10-01T00:00:00.000Z",
          categoryId: "category-1",
        },
      ];
      (db.transaction.createMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        bulkCreateTransactions(mockTransactions, "user-123")
      ).rejects.toThrow("Database error");
    });
  });

  describe("getUserTransactionById", () => {
    it("should return a transaction by ID and user ID", async () => {
      const mockTransaction = {
        id: "transaction-1",
        amount: 100,
        payee: "Payee 1",
        notes: "Notes 1",
        createdAt: "2023-10-01T00:00:00.000Z",
        account: { id: "account-1", name: "Account 1" },
        category: { id: "category-1", name: "Category 1" },
      };
      (db.transaction.findFirst as jest.Mock).mockResolvedValue(
        mockTransaction
      );

      const result = await getUserTransactionById("transaction-1", "user-123");

      expect(result).toEqual(mockTransaction);
      expect(db.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: "transaction-1",
          account: {
            userAccess: {
              some: { userId: "user-123" },
            },
          },
        },
        select: {
          id: true,
          amount: true,
          payee: true,
          notes: true,
          createdAt: true,
          account: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      });
    });

    it("should return null if transaction is not found", async () => {
      (db.transaction.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getUserTransactionById(
        "non-existent-id",
        "user-123"
      );

      expect(result).toBeNull();
      expect(db.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: "non-existent-id",
          account: {
            userAccess: {
              some: { userId: "user-123" },
            },
          },
        },
        select: {
          id: true,
          amount: true,
          payee: true,
          notes: true,
          createdAt: true,
          account: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      });
    });

    it("should handle errors gracefully", async () => {
      (db.transaction.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        getUserTransactionById("transaction-1", "user-123")
      ).rejects.toThrow("Database error");
    });
  });
});
