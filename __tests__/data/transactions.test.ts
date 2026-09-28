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
  placeTransaction,
} from "@/data/transactions";
import { db } from "@/db";
import { getCategoryResolver } from "@/data/categoryMappings";

jest.mock("@/data/categoryMappings", () => ({
  getCategoryResolver: jest.fn(),
  getCategoryResolvers: jest.fn(),
}));

jest.mock("@/db", () => ({
  db: {
    transaction: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
    },
    category: { count: jest.fn() },
    transactionPlacement: { upsert: jest.fn(), deleteMany: jest.fn() },
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
        new Error("Database error"),
      );

      await expect(
        bulkCreateTransactions(mockTransactions, "user-123"),
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
        mockTransaction,
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
        "user-123",
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
        new Error("Database error"),
      );

      await expect(
        getUserTransactionById("transaction-1", "user-123"),
      ).rejects.toThrow("Database error");
    });
  });

  describe("placeTransaction", () => {
    const ANNA_HOBBY = {
      id: "c_anna_hobby",
      name: "Hobby",
      description: null,
      icon: null,
      archivedAt: null,
      owner: {
        id: "u_anna",
        name: "Anna",
        image: null,
        email: null,
        role: null,
      },
    };
    const stored = {
      id: "t_1",
      amount: -12000,
      payee: "Cinema",
      notes: null,
      createdAt: new Date("2026-09-20T10:00:00Z"),
      accountId: "acc_joint",
      createdBy: "u_anna",
      category: ANNA_HOBBY,
      createdByUser: { id: "u_anna", name: "Anna", image: null },
      account: { institutionName: null, userAccess: [] },
    };
    const fields = {
      amount: -12000,
      payee: "Cinema",
      notes: "",
      accountId: "acc_joint",
      createdAt: "2026-09-20T10:00:00.000Z",
    };

    beforeEach(() => {
      (db.transaction.findFirst as jest.Mock).mockResolvedValue(stored);
      (db.category.count as jest.Mock).mockResolvedValue(1);
      (getCategoryResolver as jest.Mock).mockResolvedValue({
        resolve: (_category: unknown, id: string) =>
          id === "t_1" ? { id: "c_mike_fun" } : null,
      });
    });

    it("stores the pick for the viewer and returns the row as they see it", async () => {
      const result = await placeTransaction(
        "t_1",
        "u_mike",
        "c_mike_fun",
        fields,
      );

      expect(db.transactionPlacement.upsert).toHaveBeenCalledWith({
        where: {
          viewerId_transactionId: { viewerId: "u_mike", transactionId: "t_1" },
        },
        create: {
          viewerId: "u_mike",
          transactionId: "t_1",
          categoryId: "c_mike_fun",
        },
        update: { categoryId: "c_mike_fun" },
      });
      expect(result.ok && result.transaction).toMatchObject({
        id: "t_1",
        category: { id: "c_mike_fun" },
        sourceCategory: ANNA_HOBBY,
        canFile: true,
      });
    });

    it("takes the pick back on a null category", async () => {
      await placeTransaction("t_1", "u_mike", null, fields);
      expect(db.transactionPlacement.deleteMany).toHaveBeenCalledWith({
        where: { viewerId: "u_mike", transactionId: "t_1" },
      });
      expect(db.transactionPlacement.upsert).not.toHaveBeenCalled();
    });

    it("refuses any change besides the category", async () => {
      expect(
        await placeTransaction("t_1", "u_mike", "c_mike_fun", {
          ...fields,
          amount: -1,
        }),
      ).toEqual({ ok: false, status: 403 });
      expect(db.transactionPlacement.upsert).not.toHaveBeenCalled();
    });

    it("refuses a category that isn't the viewer's", async () => {
      (db.category.count as jest.Mock).mockResolvedValue(0);
      expect(
        await placeTransaction("t_1", "u_mike", "c_anna_food", fields),
      ).toEqual({ ok: false, status: 400 });
    });

    it("refuses the author, whose edits go through updateTransaction", async () => {
      expect(
        await placeTransaction("t_1", "u_anna", "c_anna_food", fields),
      ).toEqual({ ok: false, status: 403 });
    });

    it("answers 404 for a row the viewer can't see", async () => {
      (db.transaction.findFirst as jest.Mock).mockResolvedValue(null);
      expect(
        await placeTransaction("t_1", "u_mike", "c_mike_fun", fields),
      ).toEqual({ ok: false, status: 404 });
    });
  });
});
