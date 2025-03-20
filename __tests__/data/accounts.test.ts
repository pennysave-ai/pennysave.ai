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
  getUserAccountIdsByName,
  updateAccount,
} from "@/data/accounts";

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
          userId: mockAccountData.userId,
          currencyId: mockAccountData.currencyId,
          institutionName: mockAccountData.institutionName,
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
          userId: mockDeleteData.userId,
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
        currency: { id: "USD", name: "US Dollar", symbol: "$" },
        institutionName: "Test Bank",
        last4: "1234",
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
            select: { id: true, name: true, symbol: true },
          },
          institutionName: true,
          last4: true,
        },
        where: {
          userId: mockUserId,
        },
      });
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
        where: { userId: mockUserId },
      });
    });
  });

  describe("getUserAccountIdsByName", () => {
    const mockUserId = "user-123";
    const mockName = "Test Account";
    const mockAccounts = [
      { id: "account-1", name: "Test Account", institutionName: "Test Bank" },
    ];

    it("should return user account ids by name", async () => {
      (db.userAccount.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await getUserAccountIdsByName(mockUserId, mockName);

      expect(result).toEqual(mockAccounts);
      expect(db.userAccount.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          name: {
            contains: mockName,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          institutionName: true,
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
        where: { id: mockAccountData.id, userId: mockAccountData.userId },
        data: {
          name: mockAccountData.name,
          currencyId: mockAccountData.currencyId,
          institutionName: mockAccountData.institutionName,
        },
      });
    });
  });
});
