import { db } from "@/db";
import { v4 as uuid } from "uuid";
import { createBudgetSchema } from "@/schemas";
import { Budget as BudgetType } from "@prisma/client";
import {
  getStartDateForFrequency,
  convertCurrency,
  convertAmountFromMilliunits,
} from "@/lib/utils";
import { BASE_CURRENCY } from "@/constants";

export type BudgetAllocations = {
  categoryId: string;
  allocatedAmount: number;
  name: string;
  spent: number;
};

export type Budget = {
  id?: string;
  name: string;
  totalAmount: number;
  frequency: BudgetType["frequency"];
  description: string;
  icon: string;
  enableNotifications: boolean;
  currencyId: string;
  allocateByCategories: boolean;
  accounts: string[];
  budgetAllocations: BudgetAllocations[];
  totalTransactions?: number;
  transactionsByCategory?: { _sum: number; categoryId: string }[];
};

/**
 * Creates a new budget
 * @param {String} userId - User ID
 * @param {Object} budget - Budget object
 * @returns {Promise} - Promise object represents the budget data
 */
export async function createBudget(userId: string, budget: Budget) {
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
    icon,
    enableNotifications,
  } = budget;
  const createdBudget = await db.budget.create({
    data: {
      id: uuid(),
      userId,
      name,
      totalAmount,
      description,
      icon,
      enableNotifications,
      currencyId,
      frequency,
      accounts: {
        create: Array.from(accounts).map((id) => ({
          userAccount: {
            connect: { id },
          },
        })),
      },
      budgetAllocations: {
        create: budgetAllocations.map(({ categoryId, allocatedAmount }) => ({
          category: { connect: { id: categoryId } },
          allocatedAmount,
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

/**
 * Fetches all budgets for a user
 * @param {String} userId - User ID
 * @param {Date} startDate - Start date for filtering transactions
 * @param {Date} endDate - End date for filtering transactions
 * @returns {Promise} - Promise object represents the budgets data
 * */
export async function getBudgets(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Omit<Budget, "allocateByCategories">[]> {
  if (!userId) {
    throw new Error("Bad Request");
  }
  const budgets = await db.budget.findMany({
    where: { userId, createdAt: { lte: endDate } },
    select: {
      id: true,
      name: true,
      totalAmount: true,
      description: true,
      icon: true,
      enableNotifications: true,
      frequency: true,
      currencyId: true,
      accounts: {
        select: {
          userAccount: {
            select: {
              id: true,
              currencyId: true,
            },
          },
        },
      },
      budgetAllocations: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          allocatedAmount: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  for (const budget of budgets) {
    // Get the start date for the current period based on the budget's frequency
    const periodStartDate = getStartDateForFrequency(
      budget.frequency,
      startDate
    );

    // Extract category IDs and account IDs
    const categoryIds = budget.budgetAllocations.map(
      (allocation) => allocation.category.id
    );
    const accountIds = budget.accounts.map((account) => account.userAccount.id);

    // Fetch the exchange rate for the budget's currency
    const budgetCurrency = await db.currency.findUnique({
      where: { id: budget.currencyId },
    });

    // Fetch transactions and their currencies
    const transactions = await db.transaction.findMany({
      where: {
        createdAt: {
          gte: periodStartDate,
        },
        AND: [
          { categoryId: { in: categoryIds } },
          { accountId: { in: accountIds } },
          {
            amount: {
              lt: 0, // Only include transactions with negative amounts
            },
          },
        ],
      },
      select: {
        categoryId: true,
        amount: true,
        account: {
          select: {
            currency: {
              select: {
                id: true,
                exchangeRate: true,
              },
            },
          },
        },
      },
    });

    // Convert transaction amounts to the budget's currency
    const totalTransactions = transactions.reduce((total, transaction) => {
      const transactionCurrency = transaction.account.currency;
      if (!transactionCurrency) {
        throw new Error("Transaction currency not found");
      }

      // Convert the transaction amount to the budget's currency
      const convertedAmount = convertCurrency(
        transaction.amount,
        transactionCurrency.exchangeRate,
        budgetCurrency?.exchangeRate ?? 1
      );

      return total + convertedAmount;
    }, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (budget as any).totalTransactions = Math.abs(totalTransactions);

    // Calculate transactions by category
    const transactionsByCategory = budget.budgetAllocations.map(
      (allocation) => {
        const categoryTransactions = transactions.filter(
          (transaction) => transaction.categoryId === allocation.category.id
        );

        const totalByCategory = categoryTransactions.reduce(
          (total, transaction) => {
            const transactionCurrency = transaction.account.currency;

            const convertedAmount = convertCurrency(
              transaction.amount,
              transactionCurrency.exchangeRate,
              budgetCurrency?.exchangeRate ?? 1
            );
            return total + convertedAmount;
          },
          0
        );
        return {
          categoryId: allocation.category.id,
          totalAmount: Math.abs(totalByCategory),
        };
      }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (budget as any).transactionsByCategory = transactionsByCategory;
  }

  const budgetsWithCategories = budgets.map((budget) => ({
    ...budget,
    accounts: budget.accounts.map((account) => account.userAccount.id),
    budgetAllocations: budget.budgetAllocations.map((allocation) => ({
      categoryId: allocation.category.id,
      allocatedAmount: allocation.allocatedAmount,
      name: allocation.category.name,
      spent: Math.abs(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (budget as any).transactionsByCategory.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (transaction: any) =>
            transaction.categoryId === allocation.category.id
        )?.totalAmount || 0
      ),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    totalTransactions: (budget as any).totalTransactions,
  }));
  for (const budget of budgetsWithCategories) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (budget as any).transactionsByCategory;
  }

  return budgetsWithCategories;
}

/**
 * Updates a budget
 * @param {String} userId - User ID
 * @param {String} budgetId - Budget ID
 * @param {Object} budget - Budget object
 * @returns {Promise} - Promise object represents the budget data
 */
export async function updateBudget(
  userId: string,
  budgetId: string,
  budget: Budget
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
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
    enableNotifications,
    description,
    icon,
  } = budget;
  const updatedBudget = await db.budget.update({
    where: { id: budgetId, userId },
    data: {
      name,
      totalAmount,
      description,
      icon,
      enableNotifications,
      currencyId,
      frequency,
      accounts: {
        deleteMany: {},
        create: Array.from(accounts).map((id) => ({
          userAccount: {
            connect: { id },
          },
        })),
      },
      budgetAllocations: {
        deleteMany: {},
        create: budgetAllocations.map(({ categoryId, allocatedAmount }) => ({
          category: { connect: { id: categoryId } },
          allocatedAmount,
        })),
      },
    },
  });
  return updatedBudget;
}

/**
 * Deletes a budget
 * @param {String} userId - User ID
 * @param {String} budgetId - Budget ID
 * @returns {Promise} - Promise object represents the budget data
 * */
export async function deleteBudget(userId: string, budgetId: string) {
  if (!userId || !budgetId) {
    throw new Error("Bad Request");
  }
  const deletedBudget = await db.budget.delete({
    where: { id: budgetId, userId },
  });
  return deletedBudget;
}

/**
 * Enables or disables notifications for a budget
 * @param {String} userId - User ID
 * @param {String} budgetId - Budget ID
 * @param {Boolean} enable - Enable or disable notifications
 * @returns {Promise} - Promise object represents the budget data
 */
export async function toggleBudgetNotifications(
  userId: string,
  budgetId: string,
  enable: boolean
) {
  if (!userId || !budgetId) {
    throw new Error("Bad Request");
  }
  const updatedBudget = await db.budget.update({
    where: { id: budgetId, userId },
    data: { enableNotifications: enable },
  });
  return updatedBudget;
}

/**
 * Fetches the count of budgets for a user
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the count of budgets
 */
export async function getBudgetsCount(userId: string) {
  if (!userId) {
    throw new Error("Bad Request");
  }
  const budgetsCount = await db.budget.count({
    where: { userId },
  });
  return budgetsCount;
}

/**
 * Checks if a a budgets has been exceeded
 * @param {String | Null} transactionId - Transaction ID
 * @param {String} userId - User ID
 * @param {String} amount - Amount
 * @param {String | Null} categoryId - Category ID
 * @param {String} accountId - Account ID
 * @returns {Promise} - Promise object represents the budgets data
 */
export async function checkBudgetExceedance(
  transactionId: string | null, // Pass `null` for new transactions
  userId: string,
  amount: number,
  categoryId: string,
  accountId: string
): Promise<
  | {
      frequency: string;
      name: string;
      totalAmount: number;
      amountSpent: number;
      currency: string;
    }[]
  | []
> {
  // Fetch budgets linked to the category and account
  const budgets = await db.budget.findMany({
    where: {
      userId,
      AND: [
        {
          budgetAllocations: {
            some: {
              categoryId,
            },
          },
        },
        {
          accounts: {
            some: {
              userAccountId: accountId,
            },
          },
        },
        {
          enableNotifications: true, // Only check budgets with notifications enabled
        },
      ],
    },
    select: {
      id: true,
      totalAmount: true,
      frequency: true,
      currencyId: true,
      name: true,
      budgetAllocations: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          allocatedAmount: true,
        },
      },
      accounts: {
        select: {
          userAccount: {
            select: {
              id: true,
              currencyId: true,
            },
          },
        },
      },
    },
  });

  const results = [];

  for (const budget of budgets) {
    // Calculate the total spent for the budget
    const startDate = getStartDateForFrequency(budget.frequency);

    // Extract category IDs and account IDs
    const categoryIds = budget.budgetAllocations.map(
      (allocation) => allocation.category.id
    );
    const accountIds = budget.accounts.map((account) => account.userAccount.id);

    // Fetch the exchange rate for the budget's currency
    const budgetCurrency = await db.currency.findUnique({
      where: { id: budget.currencyId },
    });

    // Fetch transactions and their currencies
    const transactions = await db.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        AND: [
          { categoryId: { in: categoryIds } },
          { accountId: { in: accountIds } },
          {
            amount: {
              lt: 0, // Only include transactions with negative amounts
            },
          },
          transactionId ? { id: { not: transactionId } } : {}, // Exclude the current transaction if updating
        ],
      },
      select: {
        categoryId: true,
        amount: true,
        account: {
          select: {
            currency: {
              select: {
                id: true,
                exchangeRate: true,
              },
            },
          },
        },
      },
    });

    const totalSpent = transactions.reduce((total, transaction) => {
      const transactionCurrency = transaction.account.currency;
      if (!transactionCurrency) {
        throw new Error("Transaction currency not found");
      }
      // Convert the transaction amount to the budget's currency
      const convertedAmount = convertCurrency(
        transaction.amount,
        transactionCurrency.exchangeRate,
        budgetCurrency?.exchangeRate ?? 1
      );
      return total + convertedAmount;
    }, 0);

    const totalWithNewTransaction =
      (Math.abs(totalSpent) || 0) + Math.abs(amount);

    // Check if the total exceeds the budget
    const exceeded =
      Math.abs(totalSpent) > budget.totalAmount
        ? false
        : Math.abs(totalWithNewTransaction) > budget.totalAmount;
    if (exceeded) {
      results.push({
        frequency: budget.frequency,
        name: budget.name,
        totalAmount: convertAmountFromMilliunits(budget.totalAmount),
        amountSpent: convertAmountFromMilliunits(totalWithNewTransaction),
        currency: budgetCurrency?.name || BASE_CURRENCY.toUpperCase(),
      } as {
        frequency: string;
        name: string;
        totalAmount: number;
        amountSpent: number;
        currency: string;
      });
    }
  }
  return results;
}
