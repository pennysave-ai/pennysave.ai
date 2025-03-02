/**
 * @jest-environment node
 */
import {
  getUserByEmail,
  getUserById,
  setNotificationPreferences,
} from "@/data/user";
import { db } from "@/db";

jest.mock("@/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
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
});
