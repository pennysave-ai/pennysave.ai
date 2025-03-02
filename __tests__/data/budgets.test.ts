/**
 * @jest-environment node
 */
import { createBudget } from "@/data/budgets";
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
    },
  },
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
    accounts: ["account-1", "account-2"],
    budgetAllocations: [
      { categoryId: "category-1", allocationAmount: 500 },
      { categoryId: "category-2", allocationAmount: 500 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if validation fails", async () => {
    (createBudgetSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
    });

    await expect(createBudget(mockUserId, mockBudget)).rejects.toThrow(
      "Bad Request"
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
        allocatedAmount: allocation.allocationAmount,
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
        accounts: {
          create: mockBudget.accounts.map((id) => ({
            userAccount: {
              connect: { id },
            },
          })),
        },
        budgetAllocations: {
          create: mockBudget.budgetAllocations.map(
            ({ categoryId, allocationAmount }) => ({
              category: { connect: { id: categoryId } },
              allocatedAmount: allocationAmount,
            })
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
