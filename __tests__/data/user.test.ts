/**
 * @jest-environment node
 */
import {
  deleteProfile,
  getUserByEmail,
  getUserById,
  setNotificationPreferences,
  updateAppleSubscription,
} from "@/data/user";
import { db } from "@/db";
import { getCategoryResolvers } from "@/data/categoryMappings";

jest.mock("@/db", () => ({
  db: {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userAccountAccess: { findMany: jest.fn() },
    transaction: { findMany: jest.fn(), updateMany: jest.fn() },
    transactionPlacement: { deleteMany: jest.fn() },
    receipt: { updateMany: jest.fn() },
    userAccount: { deleteMany: jest.fn() },
  },
}));

jest.mock("@/data/categoryMappings", () => ({
  getCategoryResolvers: jest.fn(),
}));

describe("User Data Access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserByEmail", () => {
    it("should return a user by email", async () => {
      const mockUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      };
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserByEmail("john@example.com");

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
    });

    it("should return null if user is not found", async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserByEmail("non-existent@example.com");

      expect(result).toBeNull();
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: "non-existent@example.com" },
      });
    });
  });

  describe("getUserById", () => {
    it("should return a user by ID", async () => {
      const mockUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      };
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserById("user-123");

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });

    it("should return null if user is not found", async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserById("non-existent-id");

      expect(result).toBeNull();
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-id" },
      });
    });
  });

  describe("setNotificationPreferences", () => {
    it("should update user notification preferences", async () => {
      const mockUser = { id: "user-123", sendMonthlyReport: true };
      (db.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await setNotificationPreferences({
        userId: "user-123",
        monthlyReports: true,
      });

      expect(result).toEqual(mockUser);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { sendMonthlyReport: true },
      });
    });

    it("should handle errors gracefully", async () => {
      (db.user.update as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        setNotificationPreferences({
          userId: "user-123",
          monthlyReports: true,
        })
      ).rejects.toThrow("Database error");
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { sendMonthlyReport: true },
      });
    });
  });

  describe("updateAppleSubscription", () => {
    const trialStart = new Date("2026-09-01T10:00:00Z");
    const expires = new Date("2026-09-08T10:00:00Z");

    it("should persist the trial start and purchase dates", async () => {
      (db.user.update as jest.Mock).mockResolvedValue({ id: "user-123" });

      await updateAppleSubscription({
        userId: "user-123",
        expiresAt: expires,
        startedAt: trialStart,
        originalPurchaseDate: trialStart,
        trialStartedAt: trialStart,
        status: "trial",
        country: "US",
      });

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          appleSubscriptionExpiresAt: expires,
          appleSubscriptionGracePeriodExpiresAt: undefined,
          appleSubscriptionStartedAt: trialStart,
          appleSubscriptionOriginalPurchaseDate: trialStart,
          appleTrialStartedAt: trialStart,
          appleSubscriptionStatus: "trial",
          appleSubscriptionCountry: "US",
        },
      });
    });

    it("should leave the trial start untouched when a trial converts to paid", async () => {
      (db.user.update as jest.Mock).mockResolvedValue({ id: "user-123" });

      // What the DID_RENEW handler sends: a new period, no opinion on the trial.
      await updateAppleSubscription({
        userId: "user-123",
        expiresAt: new Date("2026-10-08T10:00:00Z"),
        gracePeriodExpiresAt: null,
        startedAt: new Date("2026-09-08T10:00:00Z"),
        originalPurchaseDate: trialStart,
        status: "active",
        country: "US",
      });

      const { data } = (db.user.update as jest.Mock).mock.calls[0][0];
      // undefined means Prisma skips the column, so the recorded trial survives
      expect(data.appleTrialStartedAt).toBeUndefined();
      expect(data.appleSubscriptionOriginalPurchaseDate).toEqual(trialStart);
      expect(data.appleSubscriptionStatus).toBe("active");
    });
  });

  describe("deleteProfile", () => {
    const ANNA_FOOD = {
      id: "c_anna_food",
      name: "Food",
      archivedAt: null,
      owner: { id: "u_anna" },
    };

    it("hands shared rows to the owner under what they counted as, and drops sole accounts", async () => {
      (db.userAccountAccess.findMany as jest.Mock).mockResolvedValue([
        {
          userAccountId: "acc_joint",
          userAccount: {
            userAccess: [
              { userId: "u_ola", role: "collaborator" },
              { userId: "u_mike", role: "owner" },
            ],
          },
        },
        { userAccountId: "acc_solo", userAccount: { userAccess: [] } },
      ]);
      (db.transaction.findMany as jest.Mock).mockResolvedValue([
        { id: "t_1", accountId: "acc_joint", category: ANNA_FOOD },
        { id: "t_2", accountId: "acc_joint", category: ANNA_FOOD },
        { id: "t_3", accountId: "acc_joint", category: null },
      ]);
      const resolve = jest.fn((category) =>
        category ? { id: "c_mike_groceries" } : null,
      );
      (getCategoryResolvers as jest.Mock).mockResolvedValue(
        new Map([["u_mike", { resolve }]]),
      );

      await deleteProfile("u_anna");

      expect(getCategoryResolvers).toHaveBeenCalledWith(["u_mike"]);
      expect(db.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["t_1", "t_2"] } },
        data: { createdBy: "u_mike", categoryId: "c_mike_groceries" },
      });
      expect(db.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["t_3"] } },
        data: { createdBy: "u_mike", categoryId: null },
      });
      expect(db.transactionPlacement.deleteMany).toHaveBeenCalledWith({
        where: { viewerId: "u_mike", transactionId: { in: ["t_1", "t_2"] } },
      });
      expect(db.receipt.updateMany).toHaveBeenCalledWith({
        where: { accountId: "acc_joint", createdBy: "u_anna" },
        data: { createdBy: "u_mike" },
      });
      expect(db.userAccount.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["acc_solo"] } },
      });
      expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "u_anna" } });
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });

    it("hands on to whoever joined first when no one else is the owner", async () => {
      (db.userAccountAccess.findMany as jest.Mock).mockResolvedValue([
        {
          userAccountId: "acc_joint",
          userAccount: {
            userAccess: [
              { userId: "u_ola", role: "collaborator" },
              { userId: "u_mike", role: null },
            ],
          },
        },
      ]);
      (db.transaction.findMany as jest.Mock).mockResolvedValue([
        { id: "t_1", accountId: "acc_joint", category: null },
      ]);
      (getCategoryResolvers as jest.Mock).mockResolvedValue(
        new Map([["u_ola", { resolve: () => null }]]),
      );

      await deleteProfile("u_anna");

      expect(db.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["t_1"] } },
        data: { createdBy: "u_ola", categoryId: null },
      });
    });
  });
});
