/**
 * @jest-environment node
 */
import { GET } from "@/app/api/entities/route";
import { auth } from "@/auth";
import { getCategoriesCount } from "@/data/categories";
import { getUserAccountsCount } from "@/data/accounts";
import { getUserTransactionsCount } from "@/data/transactions";

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

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));
jest.mock("@/data/categories");
jest.mock("@/data/accounts");
jest.mock("@/data/transactions");

describe("GET /api/entities", () => {
  const mockUser = { id: "user-123" };
  const mockSession = { user: mockUser };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toBe("Unautorized");
  });

  it("should return counts of categories, accounts, and transactions", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (getCategoriesCount as jest.Mock).mockResolvedValue(5);
    (getUserAccountsCount as jest.Mock).mockResolvedValue(3);
    (getUserTransactionsCount as jest.Mock).mockResolvedValue(10);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      categories: 5,
      accounts: 3,
      transactions: 10,
    });
    expect(getCategoriesCount).toHaveBeenCalledWith(mockUser.id);
    expect(getUserAccountsCount).toHaveBeenCalledWith(mockUser.id);
    expect(getUserTransactionsCount).toHaveBeenCalledWith(mockUser.id);
  });

  it("should handle errors gracefully", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (getCategoriesCount as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Could not fetch entities",
    });
  });
});
