/**
 * @jest-environment node
 */

// The write check reaches the database; it is covered in data/accounts.
jest.mock("@/data/accounts", () => ({
  getAccountWriteAccess: jest.fn(),
  accountWriteRefusal: jest.fn((access: string) =>
    jest
      .requireMock("next/server")
      .NextResponse.json(access, { status: access === "paused" ? 423 : 403 }),
  ),
}));
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
  getTransactionAuthors,
  getTransactionAccounts,
  categoriesBelongToUser,
  placeTransaction,
} from "@/data/transactions";
import { getUsersWithAccessToAccount } from "@/data/userAccounts";
import {
  notifyTransactionChanged,
  notifyTransactionsDeleted,
} from "@/lib/transactionEvents";
import { BroadcastType } from "@/wstypes";
import { getAccountWriteAccess } from "@/data/accounts";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
  // Run straight away, so the events it schedules can be asserted on.
  after: jest.fn((task: () => unknown) => task()),
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
// Resolves categories per recipient, which reaches the database; covered on
// its own in __tests__/lib/transactionEvents.test.ts.
jest.mock("@/lib/transactionEvents", () => ({
  notifyTransactionChanged: jest.fn(),
  notifyTransactionsDeleted: jest.fn(),
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
    (getAccountWriteAccess as jest.Mock).mockResolvedValue("ok");
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(mockUser);
    // By default the viewer wrote the row and owns the category.
    (getTransactionAuthors as jest.Mock).mockResolvedValue(
      new Map([["transaction-1", mockUser.id]])
    );
    (categoriesBelongToUser as jest.Mock).mockResolvedValue(true);
    (getTransactionAccounts as jest.Mock).mockResolvedValue(
      new Map([["transaction-1", "account-1"]])
    );
    (getUsersWithAccessToAccount as jest.Mock).mockResolvedValue([
      mockUser.id,
      "partner",
    ]);
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

    it("refuses a new row on an account paused for this member", async () => {
      (getAccountWriteAccess as jest.Mock).mockResolvedValue("paused");
      const mockReq = {
        json: jest.fn().mockResolvedValue({ amount: 1, accountId: "account-1" }),
      };

      const response = await POST(mockReq as unknown as NextRequest);

      expect(response.status).toBe(423);
      expect(createTransaction).not.toHaveBeenCalled();
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
      expect(notifyTransactionChanged).toHaveBeenCalledWith(
        BroadcastType.TRANSACTION_CREATED,
        expect.objectContaining({ id: "transaction-1" }),
        expect.any(Array),
        mockUser.id
      );
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

  describe("POST /api/transactions category ownership", () => {
    it("should return 400 when the category is not the author's", async () => {
      (categoriesBelongToUser as jest.Mock).mockResolvedValue(false);

      const mockReq = {
        json: jest.fn().mockResolvedValue({
          amount: 100,
          accountId: "account-1",
          categoryId: "partner-category",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
      expect(categoriesBelongToUser).toHaveBeenCalledWith(
        ["partner-category"],
        mockUser.id
      );
      expect(createTransaction).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/transactions", () => {
    it("should return 403 when a row was written by someone else", async () => {
      (getTransactionAuthors as jest.Mock).mockResolvedValue(
        new Map([
          ["transaction-1", mockUser.id],
          ["transaction-2", "partner"],
        ])
      );

      const mockReq = {
        json: jest
          .fn()
          .mockResolvedValue({ ids: ["transaction-1", "transaction-2"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(403);
      expect(deleteTransactions).not.toHaveBeenCalled();
    });

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
      expect(notifyTransactionsDeleted).toHaveBeenCalledWith(
        ["transaction-1"],
        [mockUser.id, "partner"],
        mockUser.id
      );
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
    const validPatch = () =>
      (updateTransactionSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          id: "transaction-1",
          amount: 100,
          accountId: "account-1",
          categoryId: "category-1",
        },
      });
    const patchReq = () =>
      ({
        json: jest.fn().mockResolvedValue({ id: "transaction-1" }),
      }) as unknown as NextRequest;

    it("files someone else's row for the viewer only", async () => {
      validPatch();
      (getTransactionAuthors as jest.Mock).mockResolvedValue(
        new Map([["transaction-1", "partner"]])
      );
      const placed = { id: "transaction-1", category: { id: "mine" } };
      (placeTransaction as jest.Mock).mockResolvedValue({
        ok: true,
        transaction: placed,
      });

      const response = await PATCH(patchReq());
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(placed);
      expect(placeTransaction).toHaveBeenCalledWith(
        "transaction-1",
        expect.any(String),
        expect.anything(),
        expect.objectContaining({ amount: expect.any(Number) })
      );
      expect(updateTransaction).not.toHaveBeenCalled();
    });

    it("should return 403 when someone else's row is changed beyond its category", async () => {
      validPatch();
      (getTransactionAuthors as jest.Mock).mockResolvedValue(
        new Map([["transaction-1", "partner"]])
      );
      (placeTransaction as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      const response = await PATCH(patchReq());
      expect(response.status).toBe(403);
      expect(updateTransaction).not.toHaveBeenCalled();
    });

    it("should return 404 when the row is not visible to the user", async () => {
      validPatch();
      (getTransactionAuthors as jest.Mock).mockResolvedValue(new Map());

      const response = await PATCH(patchReq());
      expect(response.status).toBe(404);
      expect(updateTransaction).not.toHaveBeenCalled();
    });

    it("should return 400 when the category is not the author's", async () => {
      validPatch();
      (categoriesBelongToUser as jest.Mock).mockResolvedValue(false);

      const response = await PATCH(patchReq());
      expect(response.status).toBe(400);
      expect(updateTransaction).not.toHaveBeenCalled();
    });

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

    it("notifies everyone on the account of an edit", async () => {
      (updateTransactionSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "transaction-1", amount: -100, accountId: "account-1" },
      });
      const updated = { id: "transaction-1", amount: -100 };
      (updateTransaction as jest.Mock).mockResolvedValue(updated);

      const mockReq = { json: jest.fn().mockResolvedValue({}) };
      await PATCH(mockReq as unknown as NextRequest);

      expect(notifyTransactionChanged).toHaveBeenCalledWith(
        BroadcastType.TRANSACTION_UPDATED,
        updated,
        [mockUser.id, "partner"],
        mockUser.id
      );
      // Same account: nobody lost sight of the row.
      expect(notifyTransactionsDeleted).toHaveBeenCalledWith(
        ["transaction-1"],
        [],
        mockUser.id
      );
    });

    it("tells anyone left behind by a move to another account that the row is gone", async () => {
      (updateTransactionSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "transaction-1", amount: -100, accountId: "account-2" },
      });
      (updateTransaction as jest.Mock).mockResolvedValue({ id: "transaction-1" });
      (getUsersWithAccessToAccount as jest.Mock).mockImplementation(
        async (accountId: string) =>
          accountId === "account-1"
            ? [mockUser.id, "partner"]
            : [mockUser.id, "other"]
      );

      const mockReq = { json: jest.fn().mockResolvedValue({}) };
      await PATCH(mockReq as unknown as NextRequest);

      expect(notifyTransactionChanged).toHaveBeenCalledWith(
        BroadcastType.TRANSACTION_UPDATED,
        expect.anything(),
        [mockUser.id, "other"],
        mockUser.id
      );
      expect(notifyTransactionsDeleted).toHaveBeenCalledWith(
        ["transaction-1"],
        ["partner"],
        mockUser.id
      );
    });

    it("sends no event when someone files a partner's row for themselves", async () => {
      (updateTransactionSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { id: "transaction-1", categoryId: "mine", accountId: "account-1" },
      });
      (getTransactionAuthors as jest.Mock).mockResolvedValue(
        new Map([["transaction-1", "partner"]])
      );
      (placeTransaction as jest.Mock).mockResolvedValue({
        ok: true,
        transaction: { id: "transaction-1" },
      });

      const mockReq = { json: jest.fn().mockResolvedValue({}) };
      await PATCH(mockReq as unknown as NextRequest);

      // The pick is the viewer's alone; nobody else's view changed.
      expect(notifyTransactionChanged).not.toHaveBeenCalled();
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
