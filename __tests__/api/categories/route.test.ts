/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, POST, DELETE, PATCH } from "@/app/api/categories/route";
import { auth } from "@/auth";
import {
  getUserCategories,
  createCategory,
  getCategoriesCount,
  deleteCategories,
  updateCategory,
} from "@/data/categories";
import { categorySchema } from "@/schemas";

// Mock dependencies
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
}));

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/data/categories", () => ({
  getUserCategories: jest.fn(),
  createCategory: jest.fn(),
  getCategoriesCount: jest.fn(),
  deleteCategories: jest.fn(),
  updateCategory: jest.fn(),
}));

jest.mock("@/schemas", () => ({
  categorySchema: {
    safeParse: jest.fn(),
  },
}));

describe("API Route: /api/categories", () => {
  const mockUser = { id: "user-id" };
  const mockSession = { user: mockUser };
  const mockCategory = {
    id: "category-1",
    name: "Test Category",
    description: "Test Description",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 401 if not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: {} });
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("should return categories if authenticated", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (getUserCategories as jest.Mock).mockResolvedValueOnce([mockCategory]);
      (getCategoriesCount as jest.Mock).mockResolvedValueOnce(1);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: [mockCategory],
        meta: { count: 1 },
      });
    });

    it("should handle errors gracefully", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (getUserCategories as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to fetch categories")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual("Error while fetching user categories");
    });
  });

  describe("POST", () => {
    it("should return 401 if not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ name: "Test Category" }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if name is missing", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should create category successfully", async () => {
      const mockNewCategory = {
        id: "category-123",
        name: "Test Category",
        description: "Test Description",
      };

      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (createCategory as jest.Mock).mockResolvedValueOnce(mockNewCategory);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          name: "Test Category",
          description: "Test Description",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockNewCategory });
      expect(createCategory).toHaveBeenCalledWith(
        "Test Category",
        mockUser.id,
        "Test Description"
      );
    });

    it("should handle database errors gracefully", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (createCategory as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to create category")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          name: "Test Category",
          description: "Test Description",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual("Error while creating categories");
    });
  });

  describe("DELETE", () => {
    it("should return 401 if not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ ids: ["category-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: {} });

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ ids: ["category-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if ids are missing", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should delete categories successfully", async () => {
      const mockDeleteResult = { count: 2 };
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (deleteCategories as jest.Mock).mockResolvedValueOnce(mockDeleteResult);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          ids: ["category-1", "category-2"],
        }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(deleteCategories).toHaveBeenCalledWith(
        ["category-1", "category-2"],
        mockUser.id
      );
      expect(data).toEqual({ data: mockDeleteResult });
    });

    it("should handle database errors gracefully", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (deleteCategories as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to delete categories")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          ids: ["category-1"],
        }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual("Error while deleting categories");
    });
  });

  describe("PATCH", () => {
    it("should return 401 if not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ id: "category-1" }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: {} });

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ id: "category-1" }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if id is missing", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should return 400 if validation fails", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (categorySchema.safeParse as jest.Mock).mockReturnValueOnce({
        success: false,
      });

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          id: "category-1",
          name: "",
        }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should update category successfully", async () => {
      const mockUpdatedCategory = {
        id: "category-1",
        name: "Updated Category",
        description: "Updated Description",
      };

      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (categorySchema.safeParse as jest.Mock).mockReturnValueOnce({
        success: true,
      });
      (updateCategory as jest.Mock).mockResolvedValueOnce(mockUpdatedCategory);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          id: "category-1",
          name: "Updated Category",
          description: "Updated Description",
        }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockUpdatedCategory });
      expect(updateCategory).toHaveBeenCalledWith(
        "category-1",
        mockUser.id,
        "Updated Category",
        "Updated Description"
      );
    });

    it("should handle database errors gracefully", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (categorySchema.safeParse as jest.Mock).mockReturnValueOnce({
        success: true,
      });
      (updateCategory as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to update category")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          id: "category-1",
          name: "Updated Category",
          description: "Updated Description",
        }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual("Error while updating categories");
    });
  });
});
