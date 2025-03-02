/**
 * @jest-environment node
 */
import { POST } from "@/app/api/budgets/route";
import { type NextRequest } from "next/server";

// Import mocked modules
import { auth } from "@/auth";
import { createBudget } from "@/data/budgets";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
}));

// Mock the auth module
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Mock createBudget function
jest.mock("@/data/budgets", () => ({
  createBudget: jest.fn(),
}));

describe("API Route: /api/budgets", () => {
  const mockUser = { id: "user-id" };
  const mockSession = { user: mockUser };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 401 if not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ name: "Test Budget" }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
      expect(await response.json()).toBe("Unautorized");
    });

    it("should return 401 if user has no id", async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: {} });

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({ name: "Test Budget" }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(401);
      expect(await response.json()).toBe("Unautorized");
    });

    it("should return 400 if name is missing", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(400);
      expect(await response.json()).toBe("Bad Request");
    });

    it("should create budget successfully", async () => {
      const mockNewBudget = {
        id: "budget-123",
        name: "Test Budget",
      };

      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (createBudget as jest.Mock).mockResolvedValueOnce(mockNewBudget);

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          name: "Test Budget",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockNewBudget });
      expect(createBudget).toHaveBeenCalledWith(mockUser.id, {
        name: "Test Budget",
      });
    });

    it("should handle database errors gracefully", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);
      (createBudget as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to create budget")
      );

      const mockReq = {
        json: jest.fn().mockResolvedValueOnce({
          name: "Test Budget",
        }),
      };

      const response = await POST(mockReq as unknown as NextRequest);
      expect(response.status).toBe(500);
      expect(await response.json()).toBe("Error while creating budget");
    });
  });
});
