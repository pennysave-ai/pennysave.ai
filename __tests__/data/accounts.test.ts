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
  accountSelect,
} from "@/data/accounts";
import { Account } from "@/types";

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

      // ✅ Mock the complete Prisma response with nested userAccess
      const mockDbResponse = {
        id: "mocked-uuid",
        name: mockAccountData.name,
        last4: null,
        institutionName: mockAccountData.institutionName,
        currency: {
          id: "USD",
          name: "US Dollar",
          symbol: "$",
          exchangeRate: 1,
        },
        userAccess: [
          {
            userId: mockAccountData.userId,
            role: "owner",
            user: {
              name: "Test User",
              email: "test@example.com",
              image: null,
            },
          },
        ],
      };

      // ✅ Expected transformed result
      const expectedResult: Account = {
        id: "mocked-uuid",
        name: mockAccountData.name,
        currency: {
          id: "USD",
          name: "US Dollar",
          symbol: "$",
          exchangeRate: 1,
        },
        users: [
          {
            id: mockAccountData.userId,
            role: "owner",
            name: "Test User",
            email: "test@example.com",
            image: null,
          },
        ],
        institution: {
          name: mockAccountData.institutionName,
        },
      };

      (db.userAccount.create as jest.Mock).mockResolvedValue(mockDbResponse);

      const result = await createAccount(
        mockAccountData.name,
        mockAccountData.userId,
        mockAccountData.currencyId,
        mockAccountData.institutionName
      );

      expect(result).toEqual(expectedResult);

      expect(db.userAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: "mocked-uuid",
            name: mockAccountData.name,
            currencyId: mockAccountData.currencyId,
            institutionName: mockAccountData.institutionName,
            userAccess: {
              create: {
                userId: mockAccountData.userId,
                role: "owner",
              },
            },
          }),
        })
      );
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

    it("should return user accounts", async () => {
      const mockDbResponse = [
        {
          id: "account-1",
          name: "Test Account",
          last4: null,
          institutionName: "Test Bank",
          currency: {
            id: "USD",
            name: "US Dollar",
            symbol: "$",
            exchangeRate: 1,
          },
          userAccess: [
            {
              userId: "user-123",
              role: "owner",
              user: {
                name: "Test User",
                image: null,
                email: "test@example.com",
                appleSubscriptionStatus: "active",
              },
            },
          ],
        },
      ];

      const expectedResult: Account[] = [
        {
          id: "account-1",
          name: "Test Account",
          currency: {
            id: "USD",
            name: "US Dollar",
            symbol: "$",
            exchangeRate: 1,
          },
          institution: {
            name: "Test Bank",
          },
          users: [
            {
              id: "user-123",
              role: "owner",
              name: "Test User",
              image: null,
              email: "test@example.com",
            },
          ],
        },
      ];

      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockDbResponse);

      const result = await getUserAccounts(mockUserId);

      expect(result).toEqual(expectedResult);
      expect(db.userAccount.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          name: true,
          institutionName: true,
        }),
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
          userAccess: [
            {
              userId: "user-123",
              role: "owner",
              user: {
                name: "Test User",
                email: "test@example.com",
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
          userAccess: [
            {
              userId: "owner-456",
              role: "owner",
              user: {
                name: "Owner User",
                email: "owner@example.com",
                image: null,
                appleSubscriptionStatus: "active",
              },
            },
            {
              userId: "user-123",
              role: "viewer",
              user: {
                name: "Test User",
                email: "test@example.com",
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
          userAccess: [
            {
              userId: "owner-789",
              role: "owner",
              user: {
                name: "Inactive Owner",
                email: "inactive@example.com",
                image: null,
                appleSubscriptionStatus: "inactive",
              },
            },
            {
              userId: "user-123",
              role: "viewer",
              user: {
                name: "Test User",
                email: "test@example.com",
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
    const mockAccountData: Account = {
      id: "account-1",
      name: "Updated Account",
      currency: {
        id: "USD",
        name: "US Dollar",
        symbol: "$",
        exchangeRate: 1,
      },
      users: [
        {
          id: "user-123",
          name: "Test User",
          email: "test@test.com",
          image: null,
        },
      ],
      institution: {
        name: "Updated Bank",
      },
    };

    it("should update account successfully", async () => {
      const mockDbResponse = {
        id: mockAccountData.id,
        name: mockAccountData.name,
        last4: null,
        institutionName: mockAccountData.institution.name,
        currency: {
          id: "USD",
          name: "US Dollar",
          symbol: "$",
          exchangeRate: 1,
        },
        userAccess: [
          {
            userId: "user-123",
            role: "owner",
            user: {
              name: "Test User",
              email: "test@test.com",
              image: null,
            },
          },
        ],
      };

      const expectedResult: Account = {
        id: mockAccountData.id,
        name: mockAccountData.name,
        currency: {
          id: "USD",
          name: "US Dollar",
          symbol: "$",
          exchangeRate: 1,
        },
        users: [
          {
            id: "user-123",
            role: "owner",
            name: "Test User",
            email: "test@test.com",
            image: null,
          },
        ],
        institution: {
          name: mockAccountData.institution.name,
        },
      };

      (db.userAccount.update as jest.Mock).mockResolvedValue(mockDbResponse);

      const result = await updateAccount(
        mockAccountData.id,
        mockAccountData.name,
        mockAccountData.currency.id,
        mockAccountData.users[0].id,
        mockAccountData.institution.name
      );

      expect(result).toEqual(expectedResult);
      expect(db.userAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockAccountData.id,
            userAccess: {
              some: { userId: mockAccountData.users[0].id, role: "owner" },
            },
          },
          data: {
            name: mockAccountData.name,
            currencyId: mockAccountData.currency.id,
            institutionName: mockAccountData.institution.name,
          },
        })
      );
    });
  });
});
