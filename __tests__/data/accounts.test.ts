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
        currency: { id: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1 },
        institutionName: "Test Bank",
        last4: "1234",
        userAccess: [
          {
            userId: "user-123",
            role: "owner",
            user: {
              name: "Test User",
              image: "https://example.com/image.jpg",
              hasActiveStripeSubscription: true,
            },
          },
        ],
      },
    ];

    it("should return user accounts for owner", async () => {
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
                  hasActiveStripeSubscription: true,
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

    it("should filter accounts for viewer when owner has no active subscription", async () => {
      const viewerUserId = "viewer-123";
      const mockAccountsWithoutSubscription = [
        {
          id: "account-1",
          name: "Test Account",
          currency: { id: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1 },
          institutionName: "Test Bank",
          last4: "1234",
          userAccess: [
            {
              userId: "owner-123",
              role: "owner",
              user: {
                name: "Owner User",
                image: "https://example.com/owner.jpg",
                hasActiveStripeSubscription: false,
              },
            },
            {
              userId: viewerUserId,
              role: "viewer",
              user: {
                name: "Viewer User",
                image: "https://example.com/viewer.jpg",
                hasActiveStripeSubscription: false,
              },
            },
          ],
        },
      ];

      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockAccountsWithoutSubscription);

      const result = await getUserAccounts(viewerUserId);

      // Viewer should not see accounts where owner has no active subscription
      expect(result).toEqual([]);
    });

    it("should return accounts for viewer when owner has active subscription", async () => {
      const viewerUserId = "viewer-123";
      const mockAccountsWithSubscription = [
        {
          id: "account-1",
          name: "Test Account",
          currency: { id: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1 },
          institutionName: "Test Bank",
          last4: "1234",
          userAccess: [
            {
              userId: "owner-123",
              role: "owner",
              user: {
                name: "Owner User",
                image: "https://example.com/owner.jpg",
                hasActiveStripeSubscription: true,
              },
            },
            {
              userId: viewerUserId,
              role: "viewer",
              user: {
                name: "Viewer User",
                image: "https://example.com/viewer.jpg",
                hasActiveStripeSubscription: false,
              },
            },
          ],
        },
      ];

      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockAccountsWithSubscription);

      const result = await getUserAccounts(viewerUserId);

      // Viewer should see accounts where owner has active subscription
      expect(result).toEqual(mockAccountsWithSubscription);
    });

    it("should return all accounts for editor regardless of owner subscription", async () => {
      const editorUserId = "editor-123";
      const mockAccountsForEditor = [
        {
          id: "account-1",
          name: "Test Account",
          currency: { id: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1 },
          institutionName: "Test Bank",
          last4: "1234",
          userAccess: [
            {
              userId: "owner-123",
              role: "owner",
              user: {
                name: "Owner User",
                image: "https://example.com/owner.jpg",
                hasActiveStripeSubscription: false,
              },
            },
            {
              userId: editorUserId,
              role: "editor",
              user: {
                name: "Editor User",
                image: "https://example.com/editor.jpg",
                hasActiveStripeSubscription: false,
              },
            },
          ],
        },
      ];

      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockAccountsForEditor);

      const result = await getUserAccounts(editorUserId);

      // Editor should see all accounts regardless of owner's subscription status
      expect(result).toEqual(mockAccountsForEditor);
    });

    it("should handle mixed accounts for viewer correctly", async () => {
      const viewerUserId = "viewer-123";
      const mockMixedAccounts = [
        {
          id: "account-1",
          name: "Account with subscription",
          currency: { id: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1 },
          institutionName: "Test Bank",
          last4: "1234",
          userAccess: [
            {
              userId: "owner-123",
              role: "owner",
              user: {
                name: "Owner User",
                image: "https://example.com/owner.jpg",
                hasActiveStripeSubscription: true,
              },
            },
            {
              userId: viewerUserId,
              role: "viewer",
              user: {
                name: "Viewer User",
                image: "https://example.com/viewer.jpg",
                hasActiveStripeSubscription: false,
              },
            },
          ],
        },
        {
          id: "account-2",
          name: "Account without subscription",
          currency: { id: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1 },
          institutionName: "Test Bank",
          last4: "5678",
          userAccess: [
            {
              userId: "owner-456",
              role: "owner",
              user: {
                name: "Another Owner",
                image: "https://example.com/owner2.jpg",
                hasActiveStripeSubscription: false,
              },
            },
            {
              userId: viewerUserId,
              role: "viewer",
              user: {
                name: "Viewer User",
                image: "https://example.com/viewer.jpg",
                hasActiveStripeSubscription: false,
              },
            },
          ],
        },
      ];

      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockMixedAccounts);

      const result = await getUserAccounts(viewerUserId);

      // Viewer should only see the first account (owner has active subscription)
      expect(result).toEqual([mockMixedAccounts[0]]);
    });

    it("should exclude account for viewer when no owner is found", async () => {
      const viewerUserId = "viewer-123";
      const mockAccountWithoutOwner = [
        {
          id: "account-1",
          name: "Account without owner",
          currency: { id: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1 },
          institutionName: "Test Bank",
          last4: "1234",
          userAccess: [
            {
              userId: viewerUserId,
              role: "viewer",
              user: {
                name: "Viewer User",
                image: "https://example.com/viewer.jpg",
                hasActiveStripeSubscription: false,
              },
            },
          ],
        },
      ];

      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockAccountWithoutOwner);

      const result = await getUserAccounts(viewerUserId);

      // Viewer should not see accounts without an owner for safety
      expect(result).toEqual([]);
    });
  });

  describe("getUserAccountsCount", () => {
    const mockUserId = "user-123";
    const mockCount = 5;

    it("should return user accounts number", async () => {
      (db.userAccount.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await getUserAccountsCount(mockUserId);

      expect(result).toEqual(mockCount);
      expect(db.userAccount.count).toHaveBeenCalledWith({
        where: { userAccess: { some: { userId: mockUserId } } },
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
