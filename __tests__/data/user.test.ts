/**
 * @jest-environment node
 */
import {
  getUserById,
  updateAppleSubscription,
} from "@/data/user";
import { db } from "@/db";

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
});
