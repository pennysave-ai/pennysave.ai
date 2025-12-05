/**
 * @jest-environment node
 */
import { db } from "@/db";
import { accountSchema } from "@/schemas";
import {
  createAccount,
  deleteAccounts,
  getUserAccounts,
  getUserAccountsCount,
  updateAccount,
} from "@/data/accounts";
import { user } from "@heroui/theme";

// Mock dependencies
jest.mock("@/db", () => ({
  db: {
    userAccount: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    userAccountAccess: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (queries) => {
      // Execute each query in the transaction array
      const results = [];
      for (const query of queries) {
        results.push(await query);
      }
      return results;
    }),
  },
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mocked-uuid"),
}));

jest.mock("@/schemas", () => ({
  accountSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock("@/data/stripe", () => ({
  financialConnections: {
    sessions: {
      create: jest.fn(),
    },
  },
}));

describe("accounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAccount", () => {
    const mockAccountData = {
      name: "Test Account",
      userId: "user-123",
      currencyId: "USD",
      institutionName: "Test Bank",
    };

    it("should create an account successfully", async () => {
      (accountSchema.safeParse as jest.Mock).mockReturnValue({ success: true });
      (db.userAccount.create as jest.Mock).mockResolvedValue({
        id: "mocked-uuid",
      });
      (db.userAccountAccess.create as jest.Mock).mockResolvedValue({});

      const result = await createAccount(
        mockAccountData.name,
        mockAccountData.userId,
        mockAccountData.currencyId,
        mockAccountData.institutionName
      );

      expect(result).toEqual({ id: "mocked-uuid" });
      expect(db.userAccount.create).toHaveBeenCalledWith({
        data: {
          id: "mocked-uuid",
          name: mockAccountData.name,
          currencyId: mockAccountData.currencyId,
          institutionName: mockAccountData.institutionName,
        },
      });
      expect(db.userAccountAccess.create).toHaveBeenCalledWith({
        data: {
          userId: mockAccountData.userId,
          userAccountId: "mocked-uuid",
          role: "owner",
        },
      });
    });

    it("should throw error if validation fails", async () => {
      (accountSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      await expect(
        createAccount(
          mockAccountData.name,
          mockAccountData.userId,
          mockAccountData.currencyId,
          mockAccountData.institutionName
        )
      ).rejects.toThrow("Bad Request");

      expect(db.userAccount.create).not.toHaveBeenCalled();
    });
  });

  describe("deleteAccounts", () => {
    const mockDeleteData = {
      accountIds: ["account-1", "account-2"],
      userId: "user-123",
    };

    it("should delete accounts successfully", async () => {
      const mockDeleteResult = { count: 2 };
      (db.userAccount.deleteMany as jest.Mock).mockResolvedValue(
        mockDeleteResult
      );

      const result = await deleteAccounts(
        mockDeleteData.accountIds,
        mockDeleteData.userId
      );

      expect(result).toEqual(mockDeleteResult);
      expect(db.userAccount.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: mockDeleteData.accountIds,
          },
          userAccess: {
            some: { role: "owner", userId: mockDeleteData.userId },
          },
        },
      });
    });
  });

  describe("getUserAccounts", () => {
    const mockUserId = "user-123";
    const mockAccounts = [
      {
        id: "account-1",
        name: "Test Account",
        currency: {
          id: "USD",
          name: "US Dollar",
          symbol: "$",
          exchangeRate: 1, // Add exchangeRate
        },
        institutionName: "Test Bank",
        last4: "1234",
        userAccess: [
          // Add userAccess array
          {
            userId: "user-123",
            role: "owner",
            user: {
              name: "Test User",
              image: null,
              appleSubscriptionStatus: "active",
              email: "test@example.com",
            },
          },
        ],
      },
    ];

    it("should return user accounts", async () => {
      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await getUserAccounts(mockUserId);

      expect(result).toEqual(mockAccounts);
      expect(db.userAccount.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          currency: {
            select: { id: true, name: true, symbol: true, exchangeRate: true },
          },
          userAccess: {
            select: {
              role: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  image: true,
                  appleSubscriptionStatus: true,
                  email: true,
                },
              },
            },
          },
          institutionName: true,
          last4: true,
        },
        where: {
          userAccess: {
            some: { userId: mockUserId },
          },
        },
      });
    });

    it("should filter out shared accounts with inactive owner subscriptions", async () => {
      const accountsWithMixedOwners = [
        {
          id: "account-1",
          name: "Owned Account",
          currency: {
            id: "USD",
            name: "US Dollar",
            symbol: "$",
            exchangeRate: 1,
          },
          institutionName: "Test Bank",
          last4: "1234",
          userAccess: [
            {
              userId: "user-123",
              role: "owner",
              user: {
                name: "Test User",
                image: null,
                appleSubscriptionStatus: "inactive",
              },
            },
          ],
        },
        {
          id: "account-2",
          name: "Shared Account - Active Owner",
          currency: {
            id: "USD",
            name: "US Dollar",
            symbol: "$",
            exchangeRate: 1,
          },
          institutionName: "Test Bank",
          last4: "5678",
          userAccess: [
            {
              userId: "owner-456",
              role: "owner",
              user: {
                name: "Owner User",
                image: null,
                appleSubscriptionStatus: "active",
              },
            },
            {
              userId: "user-123",
              role: "viewer",
              user: {
                name: "Test User",
                image: null,
                appleSubscriptionStatus: null,
              },
            },
          ],
        },
        {
          id: "account-3",
          name: "Shared Account - Inactive Owner",
          currency: {
            id: "USD",
            name: "US Dollar",
            symbol: "$",
            exchangeRate: 1,
          },
          institutionName: "Test Bank",
          last4: "9012",
          userAccess: [
            {
              userId: "owner-789",
              role: "owner",
              user: {
                name: "Inactive Owner",
                image: null,
                appleSubscriptionStatus: "inactive",
              },
            },
            {
              userId: "user-123",
              role: "viewer",
              user: {
                name: "Test User",
                image: null,
                appleSubscriptionStatus: null,
              },
            },
          ],
        },
      ];

      (db.userAccount.findMany as jest.Mock).mockResolvedValue(
        accountsWithMixedOwners
      );

      const result = await getUserAccounts(mockUserId);

      // Should return:
      // - account-1 (user is owner, even with inactive subscription)
      // - account-2 (shared, owner has active subscription)
      // Should NOT return:
      // - account-3 (shared, owner has inactive subscription)
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id)).toEqual(["account-1", "account-2"]);
    });
  });

  describe("getUserAccountsCount", () => {
    const mockUserId = "user-123";

    const mockAccounts = [
      {
        id: "account-1",
        userAccess: [
          {
            userId: "user-123",
            role: "owner",
            user: {
              appleSubscriptionStatus: "active",
            },
          },
        ],
      },
      {
        id: "account-2",
        userAccess: [
          {
            userId: "user-123",
            role: "owner",
            user: {
              appleSubscriptionStatus: "active",
            },
          },
        ],
      },
    ];

    it("should return user accounts number", async () => {
      // Mock findMany instead of count since the function now filters accounts
      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await getUserAccountsCount(mockUserId);

      expect(result).toEqual(2);
      expect(db.userAccount.findMany).toHaveBeenCalledWith({
        where: {
          userAccess: {
            some: { userId: mockUserId },
          },
        },
        select: {
          id: true,
          userAccess: {
            select: {
              role: true,
              userId: true,
              user: {
                select: { appleSubscriptionStatus: true },
              },
            },
          },
        },
      });
    });
  });

  describe("updateAccount", () => {
    const mockAccountData = {
      id: "account-1",
      name: "Updated Account",
      currencyId: "USD",
      userId: "user-123",
      institutionName: "Updated Bank",
    };

    it("should update account successfully", async () => {
      (db.userAccount.update as jest.Mock).mockResolvedValue(mockAccountData);

      const result = await updateAccount(
        mockAccountData.id,
        mockAccountData.name,
        mockAccountData.currencyId,
        mockAccountData.userId,
        mockAccountData.institutionName
      );

      expect(result).toEqual(mockAccountData);
      expect(db.userAccount.update).toHaveBeenCalledWith({
        where: {
          id: mockAccountData.id,
          userAccess: {
            some: { userId: mockAccountData.userId, role: "owner" },
          },
        },
        data: {
          name: mockAccountData.name,
          currencyId: mockAccountData.currencyId,
          institutionName: mockAccountData.institutionName,
        },
      });
    });
  });
});
