/**
 * @jest-environment node
 */
import { GET } from "@/app/api/entities/route";
import { auth } from "@/auth";
import { getCategoriesCount } from "@/data/categories";
import { getUserAccountsCount } from "@/data/accounts";
import { getUserTransactionsCount } from "@/data/transactions";
import { getBudgetsCount } from "@/data/budgets";

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
jest.mock("@/data/budgets");
jest.mock("@/data/accounts");
jest.mock("@/data/transactions");
jest.mock("@/data/stripe", () => ({
  financialConnections: {
    sessions: {
      create: jest.fn(),
    },
  },
}));

jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      sendEmail: jest.fn().mockResolvedValue({ id: "mock-email-id" }),
    })),
  };
});
process.env.RESEND_API_KEY = "test-api-key";

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

  it("should return counts of categories, accounts, transactions and budgets", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (getCategoriesCount as jest.Mock).mockResolvedValue(5);
    (getUserAccountsCount as jest.Mock).mockResolvedValue(3);
    (getUserTransactionsCount as jest.Mock).mockResolvedValue(10);
    (getBudgetsCount as jest.Mock).mockResolvedValue(2);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      categories: 5,
      accounts: 3,
      transactions: 10,
      budgets: 2,
    });
    expect(getCategoriesCount).toHaveBeenCalledWith(mockUser.id);
    expect(getUserAccountsCount).toHaveBeenCalledWith(mockUser.id);
    expect(getUserTransactionsCount).toHaveBeenCalledWith(mockUser.id);
    expect(getBudgetsCount).toHaveBeenCalledWith(mockUser.id);
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
