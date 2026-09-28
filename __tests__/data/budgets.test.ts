/**
 * @jest-environment node
 */
import { createBudget, getBudgets } from "@/data/budgets";
import { getCategoryResolver } from "@/data/categoryMappings";
import { db } from "@/db";
import { v4 as uuid } from "uuid";
import { createBudgetSchema } from "@/schemas";

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

jest.mock("@/db", () => ({
  db: {
    budget: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    currency: { findUnique: jest.fn() },
    transaction: { findMany: jest.fn() },
  },
}));

jest.mock("@/data/categoryMappings", () => ({
  getCategoryResolver: jest.fn(),
}));

jest.mock("@/schemas", () => ({
  createBudgetSchema: {
    safeParse: jest.fn(),
  },
}));

describe("createBudget", () => {
  const mockUserId = "user-123";
  const mockBudget = {
    name: "Test Budget",
    totalAmount: 1000,
    frequency: "MONTHLY" as const,
    currencyId: "currency-123",
    description: "Test description",
    enableNotifications: true,
    accounts: ["account-1", "account-2"],
    budgetAllocations: [
      {
        categoryId: "category-1",
        allocatedAmount: 500,
        name: "Test",
        spent: 0,
      },
      {
        categoryId: "category-2",
        allocatedAmount: 500,
        name: "Test",
        spent: 0,
      },
    ],
    allocateByCategories: true,
    icon: "Test icon",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if validation fails", async () => {
    (createBudgetSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
    });

    await expect(createBudget(mockUserId, mockBudget)).rejects.toThrow(
      "Bad Request",
    );
  });

  it("should create a new budget successfully", async () => {
    const mockBudgetId = "budget-123";
    (uuid as jest.Mock).mockReturnValue(mockBudgetId);
    (createBudgetSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
    });
    (db.budget.create as jest.Mock).mockResolvedValue({
      id: mockBudgetId,
      ...mockBudget,
      budgetAllocations: mockBudget.budgetAllocations.map((allocation) => ({
        ...allocation,
        allocatedAmount: allocation.allocatedAmount,
      })),
      accounts: mockBudget.accounts.map((id) => ({ id })),
    });

    const result = await createBudget(mockUserId, mockBudget);

    expect(result).toEqual({ id: mockBudgetId });
    expect(uuid).toHaveBeenCalled();
    expect(db.budget.create).toHaveBeenCalledWith({
      data: {
        id: mockBudgetId,
        userId: mockUserId,
        name: mockBudget.name,
        totalAmount: mockBudget.totalAmount,
        currencyId: mockBudget.currencyId,
        frequency: mockBudget.frequency,
        description: mockBudget.description,
        enableNotifications: mockBudget.enableNotifications,
        icon: mockBudget.icon,
        accounts: {
          create: mockBudget.accounts.map((id) => ({
            userAccount: {
              connect: { id },
            },
          })),
        },
        budgetAllocations: {
          create: mockBudget.budgetAllocations.map(
            ({ categoryId, allocatedAmount }) => ({
              category: { connect: { id: categoryId } },
              allocatedAmount,
            }),
          ),
        },
      },
      include: {
        budgetAllocations: true,
        accounts: true,
      },
    });
  });
});

describe("getBudgets", () => {
  it("counts rows by the category they resolve to for the budget's owner", async () => {
    (db.budget.findMany as jest.Mock).mockResolvedValue([
      {
        id: "b_1",
        name: "Food",
        totalAmount: 500000,
        frequency: "MONTHLY",
        currencyId: "eur",
        accounts: [{ userAccount: { id: "acc_joint", currencyId: "eur" } }],
        budgetAllocations: [
          {
            category: { id: "c_groceries", name: "Groceries" },
            allocatedAmount: 500000,
          },
        ],
      },
    ]);
    (db.currency.findUnique as jest.Mock).mockResolvedValue({
      exchangeRate: 1,
    });
    const account = { currency: { id: "eur", exchangeRate: 1 } };
    (db.transaction.findMany as jest.Mock).mockResolvedValue([
      // Mike's own row.
      { id: "t_1", amount: -10000, category: { id: "c_groceries" }, account },
      // Anna's row, mapped onto Mike's Groceries.
      { id: "t_2", amount: -5000, category: { id: "c_anna_food" }, account },
      // Anna's row that counts nowhere for Mike.
      { id: "t_3", amount: -99000, category: { id: "c_anna_hobby" }, account },
    ]);
    (getCategoryResolver as jest.Mock).mockResolvedValue({
      resolve: (category: { id: string }) =>
        category.id === "c_groceries" || category.id === "c_anna_food"
          ? { id: "c_groceries" }
          : null,
    });

    const [budget] = await getBudgets(
      "u_mike",
      new Date("2026-09-01"),
      new Date("2026-09-30"),
    );

    expect(getCategoryResolver).toHaveBeenCalledWith("u_mike");
    expect(budget.totalTransactions).toBe(15000);
    expect(budget.budgetAllocations[0].spent).toBe(15000);
  });
});
