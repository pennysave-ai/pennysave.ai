import { db } from "@/db";
import { v4 as uuid } from "uuid";
import { createBudgetSchema } from "@/schemas";
import { Budget } from "@prisma/client";

export type CreateBudget = {
  name: string;
  totalAmount: number;
  frequency: Budget["frequency"];
  description: string;
  currencyId: string;
  accounts: string[];
  budgetAllocations: {
    categoryId: string;
    allocationAmount: number;
  }[];
};
/**
 * Creates a new budget
 * @param {String} userId - User ID
 * @param {Object} budget - Budget object
 * @returns {Promise} - Promise object represents the budget data
 */
export async function createBudget(userId: string, budget: CreateBudget) {
  const validationResult = createBudgetSchema.safeParse(budget);
  if (!validationResult.success) {
    throw new Error("Bad Request");
  }
  const {
    name,
    totalAmount,
    currencyId,
    frequency,
    accounts,
    budgetAllocations,
    description,
  } = budget;
  const createdBudget = await db.budget.create({
    data: {
      id: uuid(),
      userId,
      name,
      totalAmount,
      description,
      currencyId,
      frequency,
      accounts: {
        create: accounts.map((id) => ({
          userAccount: {
            connect: { id },
          },
        })),
      },
      budgetAllocations: {
        create: budgetAllocations.map(({ categoryId, allocationAmount }) => ({
          category: { connect: { id: categoryId } },
          allocatedAmount: allocationAmount,
        })),
      },
    },
    include: {
      budgetAllocations: true,
      accounts: true,
    },
  });
  return { id: createdBudget.id };
}
