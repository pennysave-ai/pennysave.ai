/**
 * @jest-environment node
 */
import { GET } from "@/app/api/summary/route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { getTargetCurrency } from "@/data/currencies";
import {
  calculatePercentageChange,
  fillMissingDates,
  fillMissingDatesForExpenceCategories,
} from "@/lib/utils";

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

// Mock dependencies
jest.mock("@/db", () => ({
  db: {
    $queryRawUnsafe: jest.fn(),
  },
}));

jest.mock("@/data/currencies");
jest.mock("@/lib/utils");

describe("GET /api/summary", () => {
  const mockUser = { id: "user-123" };
  const mockSession = { user: mockUser };
  const mockCurrency = {
    id: "currency-123",
    name: "USD",
    symbol: "$",
    exchangeRate: 1,
  };
  const mockFinancialData = { income: 1000, expences: -500, remaining: 500 };
  const mockSpendingByCategory = [
    { id: "category-1", name: "Food", amount: 200 },
  ];
  const mockDailyData = [{ date: "2023-01-01", income: 100, expences: -50 }];
  const mockDailyExpences = new Map([["2023-01-01", { Food: 50 }]]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const mockReq = {
      nextUrl: { searchParams: new URLSearchParams() },
    };

    const response = await GET(mockReq as unknown as NextRequest);
    expect(response.status).toBe(401);
    expect(await response.json()).toBe("Unautorized");
  });

  it("should return financial summary data", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (getTargetCurrency as jest.Mock).mockResolvedValue(mockCurrency);
    (db.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);
    (calculatePercentageChange as jest.Mock).mockReturnValue(0);
    (fillMissingDates as jest.Mock).mockReturnValue(mockDailyData);
    (fillMissingDatesForExpenceCategories as jest.Mock).mockReturnValue(
      mockDailyExpences
    );

    const mockReq = {
      nextUrl: { searchParams: new URLSearchParams() },
    };

    const response = await GET(mockReq as unknown as NextRequest);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({
      data: {
        remainingAmount: 0,
        remainingChange: 0,
        incomeAmount: 0,
        incomeChange: 0,
        expensesAmount: 0,
        expensesChange: 0,
        categories: [],
        expencesByCategory: mockDailyExpences,
        days: mockDailyData,
      },
      meta: {
        currency: {
          name: mockCurrency.name,
          symbol: mockCurrency.symbol,
          id: mockCurrency.id,
        },
        prevPeriod: {
          start: expect.any(String),
          end: expect.any(String),
        },
      },
    });
  });

  it("should handle errors gracefully", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (getTargetCurrency as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const mockReq = {
      nextUrl: { searchParams: new URLSearchParams() },
    };

    const response = await GET(mockReq as unknown as NextRequest);
    expect(response.status).toBe(500);
    expect(await response.json()).toBe("Internal Server Error");
  });
});
