/**
 * @jest-environment node
 */
import { db } from "@/db";
import { categorySchema } from "@/schemas";
import {
  getUserCategories,
  getCategoriesCount,
  createCategory,
  deleteCategories,
  updateCategory,
  categorySelect,
} from "@/data/categories";
import { Category } from "@/types";

// Mock dependencies
jest.mock("@/db", () => ({
  db: {
    category: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mocked-uuid"),
}));

jest.mock("@/schemas", () => ({
  categorySchema: {
    safeParse: jest.fn(),
  },
}));

describe("categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserCategories", () => {
    const mockUserId = "user-123";
    const mockCategories: Category[] = [
      {
        id: "category-1",
        name: "Test Category",
        description: "Test Description",
        icon: "🍕",
        owner: { id: mockUserId, name: "User", image: null },
      },
    ];

    it("should return user categories", async () => {
      (db.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await getUserCategories(mockUserId);

      expect(result).toEqual(mockCategories);
      expect(db.category.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: categorySelect,
      });
    });
  });

  describe("getCategoriesCount", () => {
    const mockUserId = "user-123";
    const mockCount = 5;

    it("should return categories count", async () => {
      (db.category.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await getCategoriesCount(mockUserId);

      expect(result).toEqual(mockCount);
      expect(db.category.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });
  });

  describe("createCategory", () => {
    const mockCategoryData = {
      name: "Test Category",
      userId: "user-123",
      description: "Test Description",
      icon: "🍕",
    };

    it("should create a category successfully", async () => {
      (categorySchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
      });

      const mockDbResponse = {
        id: "mocked-uuid",
        name: mockCategoryData.name,
        description: mockCategoryData.description,
        icon: mockCategoryData.icon,
        owner: {
          id: mockCategoryData.userId,
          name: "Test User",
          image: null,
          email: "test@example.com",
        },
      };

      const expectedResult: Category = {
        id: "mocked-uuid",
        name: mockCategoryData.name,
        description: mockCategoryData.description,
        icon: mockCategoryData.icon,
        owner: {
          id: mockCategoryData.userId,
          name: "Test User",
          image: null,
          email: "test@example.com",
        },
      };

      (db.category.create as jest.Mock).mockResolvedValue(mockDbResponse);

      const result = await createCategory(
        mockCategoryData.name,
        mockCategoryData.userId,
        mockCategoryData.description,
        mockCategoryData.icon
      );

      expect(result).toEqual(expectedResult);

      expect(db.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            id: "mocked-uuid",
            name: mockCategoryData.name,
            userId: mockCategoryData.userId,
            description: mockCategoryData.description,
            icon: mockCategoryData.icon,
          },
        })
      );
    });

    it("should throw error if validation fails", async () => {
      (categorySchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      await expect(
        createCategory(
          mockCategoryData.name,
          mockCategoryData.userId,
          mockCategoryData.description
        )
      ).rejects.toThrow("Bad Request");

      expect(db.category.create).not.toHaveBeenCalled();
    });
  });

  describe("deleteCategories", () => {
    const mockDeleteData = {
      ids: ["category-1", "category-2"],
      userId: "user-123",
    };

    it("should delete categories successfully", async () => {
      const mockDeleteResult = { count: 2 };
      (db.category.deleteMany as jest.Mock).mockResolvedValue(mockDeleteResult);

      const result = await deleteCategories(
        mockDeleteData.ids,
        mockDeleteData.userId
      );

      expect(result).toEqual(mockDeleteResult);
      expect(db.category.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: mockDeleteData.ids,
          },
          userId: mockDeleteData.userId,
        },
      });
    });
  });

  describe("updateCategory", () => {
    it("should update category successfully", async () => {
      const mockCategoryData = {
        id: "category-1",
        userId: "user-123",
        name: "Updated Category",
        description: "Updated Description",
        icon: "updated-icon",
      };

      const mockDbResponse = {
        id: mockCategoryData.id,
        name: mockCategoryData.name,
        description: mockCategoryData.description,
        icon: mockCategoryData.icon,
        owner: {
          id: mockCategoryData.userId,
          name: "Test User",
          image: null,
          email: "test@example.com",
        },
      };

      const expectedResult: Category = {
        id: mockCategoryData.id,
        name: mockCategoryData.name,
        description: mockCategoryData.description,
        icon: mockCategoryData.icon,
        owner: {
          id: mockCategoryData.userId,
          name: "Test User",
          image: null,
          email: "test@example.com",
        },
      };

      (db.category.update as jest.Mock).mockResolvedValue(mockDbResponse);

      const result = await updateCategory(
        mockCategoryData.id,
        mockCategoryData.userId,
        mockCategoryData.name,
        mockCategoryData.description,
        mockCategoryData.icon
      );

      expect(result).toEqual(expectedResult);
      expect(db.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockCategoryData.id,
            userId: mockCategoryData.userId,
          },
          data: {
            name: mockCategoryData.name,
            description: mockCategoryData.description,
            icon: mockCategoryData.icon,
          },
        })
      );
    });
  });
});
