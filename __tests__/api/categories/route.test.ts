/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, POST, DELETE, PATCH } from "@/app/api/categories/route";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  getUserCategories,
  getCategoriesHistory,
  createCategory,
  getCategoriesCount,
  deleteCategories,
  updateCategory,
} from "@/data/categories";
import { getUserTimezone } from "@/data/user";
import { categorySchema } from "@/schemas";
import { Category } from "@/types";

// Mock dependencies
jest.mock("next/server", () => ({
  after: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
}));

// Mock the auth module
jest.mock("@/auth.helper", () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock("@/data/categories", () => ({
  getUserCategories: jest.fn(),
  getCategoriesHistory: jest.fn(),
  createCategory: jest.fn(),
  getCategoriesCount: jest.fn(),
  deleteCategories: jest.fn(),
  updateCategory: jest.fn(),
}));

jest.mock("@/data/categoryMappings", () => ({
  getCategoryResolver: jest.fn(async () => mockResolver),
  ensureCategoryEmbeddings: jest.fn(),
  freezeNameMatchesBeforeRename: jest.fn(),
  getCoMemberIds: jest.fn(),
  notifyCategoryMappingsChanged: jest.fn(),
}));

const mockResolver = { viewerId: "user-id" };

jest.mock("@/data/user", () => ({
  getUserTimezone: jest.fn(),
}));

jest.mock("@/schemas", () => ({
  categorySchema: {
    safeParse: jest.fn(),
  },
}));

describe("Categories API", () => {
  const mockUser = { id: "user-id" };
  const mockCategory = {
    id: "category-1",
    name: "Test Category",
    description: "Test Description",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/categories", () => {
    const mockGetReq = (query = "") =>
      ({
        nextUrl: { searchParams: new URLSearchParams(query) },
      }) as unknown as NextRequest;

    const mockHistory = [
      { month: "2026-04", totals: [{ currencyId: "eur", amount: -1234500 }] },
      { month: "2026-05", totals: [] },
      { month: "2026-06", totals: [] },
      { month: "2026-07", totals: [] },
      { month: "2026-08", totals: [{ currencyId: "eur", amount: 320000 }] },
    ];

    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const response = await GET(mockGetReq());
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const response = await GET(mockGetReq());
      expect(response.status).toBe(401);
    });

    it("should return categories if authenticated", async () => {
      (getUserCategories as jest.Mock).mockResolvedValueOnce([mockCategory]);
      (getCategoriesCount as jest.Mock).mockResolvedValueOnce(1);

      const response = await GET(mockGetReq());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: [mockCategory],
        meta: { count: 1 },
      });
    });

    it("should leave history out unless it is asked for", async () => {
      (getUserCategories as jest.Mock).mockResolvedValueOnce([mockCategory]);
      (getCategoriesCount as jest.Mock).mockResolvedValueOnce(1);

      const response = await GET(mockGetReq("include=stores"));
      const data = await response.json();

      expect(data.data[0]).not.toHaveProperty("history");
      expect(getCategoriesHistory).not.toHaveBeenCalled();
      expect(getUserTimezone).not.toHaveBeenCalled();
    });

    it("should attach history when include=history is passed", async () => {
      (getUserCategories as jest.Mock).mockResolvedValueOnce([mockCategory]);
      (getCategoriesCount as jest.Mock).mockResolvedValueOnce(1);
      (getUserTimezone as jest.Mock).mockResolvedValueOnce("Europe/Madrid");
      (getCategoriesHistory as jest.Mock).mockResolvedValueOnce(
        new Map([[mockCategory.id, mockHistory]])
      );

      const response = await GET(mockGetReq("include=history"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: [{ ...mockCategory, history: mockHistory }],
        meta: { count: 1 },
      });
      expect(getCategoriesHistory).toHaveBeenCalledWith(
        mockUser.id,
        [mockCategory.id],
        "Europe/Madrid",
        mockResolver
      );
    });

    it("should recognise history inside a comma separated include", async () => {
      (getUserCategories as jest.Mock).mockResolvedValueOnce([mockCategory]);
      (getCategoriesCount as jest.Mock).mockResolvedValueOnce(1);
      (getUserTimezone as jest.Mock).mockResolvedValueOnce("UTC");
      (getCategoriesHistory as jest.Mock).mockResolvedValueOnce(new Map());

      const response = await GET(mockGetReq("include=stores,%20history"));
      const data = await response.json();

      expect(getCategoriesHistory).toHaveBeenCalled();
      // A category the aggregation returned nothing for still gets the key.
      expect(data.data[0].history).toEqual([]);
    });

    it("should fail loudly rather than report empty history", async () => {
      (getUserCategories as jest.Mock).mockResolvedValueOnce([mockCategory]);
      (getCategoriesCount as jest.Mock).mockResolvedValueOnce(1);
      (getUserTimezone as jest.Mock).mockResolvedValueOnce("UTC");
      (getCategoriesHistory as jest.Mock).mockRejectedValueOnce(
        new Error("aggregation blew up")
      );

      const response = await GET(mockGetReq("include=history"));

      expect(response.status).toBe(500);
    });

    it("should handle errors gracefully", async () => {
      (getUserCategories as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to fetch categories")
      );

      const response = await GET(mockGetReq());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual("Error while fetching user categories");
    });
  });

  describe("POST /api/categories", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ name: "Test Category" }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if name is missing", async () => {
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should create category successfully", async () => {
      const mockNewCategory: Category = {
        id: "category-123",
        name: "Test Category",
        description: "Test Description",
        icon: "🍕",
        owner: { id: mockUser.id, name: "User", image: null },
      };
      (createCategory as jest.Mock).mockResolvedValueOnce(mockNewCategory);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          name: "Test Category",
          description: "Test Description",
          icon: "🍕",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual(mockNewCategory);
      expect(createCategory).toHaveBeenCalledWith(
        "Test Category",
        mockUser.id,
        "Test Description",
        "🍕"
      );
    });

    it("should handle database errors gracefully", async () => {
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

  describe("DELETE /api/categories", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ ids: ["category-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ ids: ["category-1"] }),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if ids are missing", async () => {
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await DELETE(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should delete categories successfully", async () => {
      const mockDeleteResult = { count: 2 };
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

  describe("PATCH /api/categories", () => {
    it("should return 401 if not authenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ id: "category-1" }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 401 if user has no id", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ id: "category-1" }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
    });

    it("should return 400 if id is missing", async () => {
      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should return 400 if validation fails", async () => {
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
      const mockUpdatedCategory: Category = {
        id: "category-1",
        name: "Updated Category",
        description: "Updated Description",
        icon: "🍕",
        owner: { id: mockUser.id, name: "User", image: null },
      };
      (categorySchema.safeParse as jest.Mock).mockReturnValueOnce({
        success: true,
      });
      (updateCategory as jest.Mock).mockResolvedValueOnce(mockUpdatedCategory);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          id: "category-1",
          name: "Updated Category",
          description: "Updated Description",
          icon: "🍕",
        }),
      };

      const response = await PATCH(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedCategory);
      expect(updateCategory).toHaveBeenCalledWith(
        "category-1",
        mockUser.id,
        "Updated Category",
        "Updated Description",
        "🍕"
      );
    });

    it("should handle database errors gracefully", async () => {
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
