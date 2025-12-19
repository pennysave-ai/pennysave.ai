import { v4 as uuid } from "uuid";
import { format, endOfDay } from "date-fns";

import { db } from "@/db";
import { formatCurrency } from "@/lib/utils";
import { convertAmountFromMilliunits, convertCurrency } from "@/lib/utils";
import {
  CreateTransaction,
  UpdateTransaction,
} from "@/features/transactions/hooks";
import { createTransactionSchema } from "@/schemas";
import { checkBudgetExceedance } from "@/data/budgets";
import { sendBudgetExceedNotification } from "@/lib/mail";
import { hasActiveAppleSubscription } from "@/data/user";

export type Transaction = {
  id: string;
  amount: number;
  payee: string | null;
  notes: string | null;
  createdAt: Date;
  account: {
    id: string;
    name: string;
    last4: string | null;
    institution: {
      name: string | null;
    };
    currency: {
      symbol: string;
      name: string;
      id: string;
      exchangeRate: number;
    };
    userAccess?: Array<{
      userId: string;
      user: {
        email: string | null;
      };
    }>;
  };
  category: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
};

/**
 * Fetch users analytics data for AI model context
 * @param usersIds {String[]} - Array of user IDs
 * @param startDate {Date} - Start date
 * @param endDate {Date} - End date
 */
export async function getPrevMonthSummaries(
  usersIds: string[],
  startDate: string,
  endDate: string
) {
  type Transaction = {
    category?: {
      name: string;
    } | null;
    payee: string | null;
    notes: string | null;
    account: {
      name: string;
      currency: {
        id: string;
        symbol: string;
        name: string;
        exchangeRate: number;
      };
      userAccess: Array<{
        userId: string;
        user: {
          email: string | null;
        };
      }>;
    };
    amount: number;
  };

  const transactionsData = await db.transaction.findMany({
    select: {
      amount: true,
      payee: true,
      notes: true,
      createdAt: true,
      account: {
        select: {
          name: true,
          userAccess: {
            select: {
              userId: true,
              user: {
                select: { email: true },
              },
            },
          },
          institutionName: true,
          currency: {
            select: { name: true, id: true, exchangeRate: true, symbol: true },
          },
          balance: true,
        },
      },
      category: {
        select: { name: true },
      },
    },
    where: {
      account: {
        userAccess: { some: { userId: { in: usersIds } } },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Flatten transactions by user access
  // Each transaction should appear for each user who has access to the account
  const transactionsByUser = new Map<string, Transaction[]>();

  for (const transaction of transactionsData) {
    for (const access of transaction.account.userAccess) {
      // Only include users in the requested usersIds
      if (usersIds.includes(access.userId)) {
        if (!transactionsByUser.has(access.userId)) {
          transactionsByUser.set(access.userId, []);
        }
        transactionsByUser.get(access.userId)!.push(transaction);
      }
    }
  }

  // Iterate over each user to generate summaries
  const usersData = [];

  for (const [userId, userTransactions] of transactionsByUser) {
    // Get user email from first transaction
    const userEmail =
      userTransactions[0]?.account.userAccess.find(
        (access) => access.userId === userId
      )?.user.email || "";

    const transactionsByCurrency: Record<
      string,
      {
        count: number;
        expenses: number;
        income: number;
        exchangeRate: number;
        symbol: string;
        currency: string;
      }
    > = userTransactions.reduce(
      (
        acc: Record<
          string,
          {
            count: number;
            expenses: number;
            income: number;
            exchangeRate: number;
            symbol: string;
            currency: string;
          }
        >,
        transaction: Transaction
      ) => {
        const currencyId = transaction.account.currency.id;

        if (currencyId in acc) {
          acc[currencyId] = {
            ...acc[currencyId],
            count: acc[currencyId].count + 1,
            expenses:
              transaction.amount < 0
                ? acc[currencyId].expenses + transaction.amount
                : acc[currencyId].expenses,
            income:
              transaction.amount > 0
                ? acc[currencyId].income + transaction.amount
                : acc[currencyId].income,
          };
        } else {
          acc[currencyId] = {
            count: 1,
            expenses: transaction.amount < 0 ? transaction.amount : 0,
            income: transaction.amount > 0 ? transaction.amount : 0,
            exchangeRate: transaction.account.currency.exchangeRate,
            symbol: transaction.account.currency.symbol,
            currency: transaction.account.currency.name,
          };
        }
        return acc;
      },
      {}
    );

    // Sort by count to find the most used currency
    const [targetCurrency] = Object.entries(transactionsByCurrency).sort(
      (a, b) => b[1].count - a[1].count
    );

    // Convert income and expenses to base currency
    const sum = Object.entries(transactionsByCurrency).reduce(
      (acc, [currency, { income, expenses, exchangeRate }]) => {
        if (currency === targetCurrency[0]) {
          acc.income += Number(income);
          acc.expenses += Number(expenses);
        } else {
          acc.income += convertCurrency(
            income,
            exchangeRate,
            targetCurrency[1].exchangeRate
          );
          acc.expenses += convertCurrency(
            expenses,
            exchangeRate,
            targetCurrency[1].exchangeRate
          );
        }
        return acc;
      },
      {
        income: 0,
        expenses: 0,
      }
    );

    const transactions = userTransactions.map((transaction: Transaction) => ({
      amount: formatCurrency(
        convertAmountFromMilliunits(transaction.amount),
        targetCurrency[1].currency
      ),
      category: transaction.category?.name || "Uncategorized",
      payee: transaction.payee,
      notes: transaction.notes,
      account: transaction.account.name,
    }));

    usersData.push({
      userId,
      email: userEmail,
      currencySymbol: targetCurrency[1].symbol,
      currencyName: targetCurrency[1].currency,
      income: convertAmountFromMilliunits(sum.income),
      expenses: convertAmountFromMilliunits(sum.expenses),
      netFlow: convertAmountFromMilliunits(sum.income + sum.expenses),
      reportDate: format(startDate, "MMMM yyyy"),
      transactions,
    });
  }

  return usersData;
}

/**
 * Creates a new transaction
 * @param {Transaction} payload - Transaction data
 * @returns {Promise} - Promise object represents the transaction data
 * @throws {Error} - If the transaction creation fails
 */
export async function createTransaction(
  payload: CreateTransaction,
  email: string,
  userName: string,
  userId: string
): Promise<Transaction> {
  try {
    const { amount, payee, notes, accountId, categoryId, createdAt } = payload;
    const id = uuid();
    const validationResult = createTransactionSchema.safeParse({
      id,
      amount,
      payee,
      notes,
      accountId,
      categoryId,
      createdAt,
    });
    if (!validationResult.success) {
      console.log(validationResult.error.flatten().fieldErrors);
      throw new Error("Invalid transaction data");
    }

    // Check if the transaction exceeds the budget limit
    // only check if the transaction has a category and the amount is negative
    // if the transaction is an income, we don't need to check the budget
    // if the transaction is an expense, we need to check the budget
    if (!!categoryId && amount < 0 && userId) {
      const budgetExceedance = await checkBudgetExceedance(
        null,
        userId,
        amount,
        categoryId,
        accountId
      );
      for (const budget of budgetExceedance) {
        sendBudgetExceedNotification(email, budget, userName);
      }
    }

    const transaction = await db.transaction.create({
      data: {
        id,
        amount,
        payee: payee || "",
        notes,
        accountId,
        categoryId,
        createdAt,
        createdBy: userId,
      },
      select: {
        id: true,
        amount: true,
        payee: true,
        notes: true,
        createdAt: true,
        account: {
          select: {
            id: true,
            name: true,
            last4: true,
            institutionName: true,
            currency: {
              select: {
                symbol: true,
                name: true,
                id: true,
                exchangeRate: true,
              },
            },
          },
        },
        category: {
          select: { id: true, name: true, icon: true },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Map institutionName to institution: { name }
    return {
      ...transaction,
      account: {
        ...transaction.account,
        institution: { name: transaction.account.institutionName },
      },
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw new Error("Failed to create transaction");
  }
}

/**
 * Get user transactions count
 * @param {String} userId - User ID
 * @returns {Promise<number>} - Number of transactions
 */
export async function getUserTransactionsCount(userId: string) {
  return await db.transaction.count({
    where: { account: { userAccess: { some: { userId } } } },
  });
}

/**
 * Get user transactions count by account and creation date
 * @param {String} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {String} text - text to search
 * @returns {Promise<number>} - Number of transactions
 */
export async function getUserTransactionsCountByAccount(
  userId: string,
  startDate: Date,
  endDate: Date,
  text?: string
) {
  return await db.transaction.count({
    where: {
      account: {
        userAccess: { some: { userId } },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      notes: {
        contains: text,
        mode: "insensitive",
      },
    },
  });
}

/**
 * Bulk delete transactions
 * @param {String[]} transactionIds - Array of transaction IDs
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the deleted transactions
 */
export async function deleteTransactions(
  transactionIds: string[],
  userId: string
) {
  return await db.transaction.deleteMany({
    where: {
      id: {
        in: transactionIds,
      },
      account: {
        userAccess: { some: { userId } },
      },
    },
  });
}

/**
 * Update transaction by ID
 * @param {String} id - Transaction ID
 * @param {String} userId - User ID
 * @param {Object} data - Transaction data
 * @returns {Promise} - Promise object represents the updated transaction
 */
export async function updateTransaction(
  id: string,
  userId: string,
  email: string,
  userName: string,
  data: Omit<UpdateTransaction, "id">
): Promise<Transaction> {
  const { categoryId, amount, accountId } = data;
  if (!!categoryId && amount < 0 && userId) {
    const budgetExceedance = await checkBudgetExceedance(
      id,
      userId,
      amount,
      categoryId,
      accountId
    );
    for (const budget of budgetExceedance) {
      sendBudgetExceedNotification(email, budget, userName);
    }
  }
  const transaction = await db.transaction.update({
    where: {
      id,
      account: {
        userAccess: { some: { userId } },
      },
    },
    data,
    select: {
      id: true,
      amount: true,
      payee: true,
      notes: true,
      createdAt: true,
      createdByUser: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          last4: true,
          institutionName: true,
          currency: {
            select: {
              symbol: true,
              name: true,
              id: true,
              exchangeRate: true,
            },
          },
        },
      },
      category: {
        select: { id: true, name: true, icon: true },
      },
    },
  });

  // Map institutionName to institution: { name }
  return {
    ...transaction,
    account: {
      ...transaction.account,
      institution: { name: transaction.account.institutionName },
    },
  };
}

/**
 * Get user transactions by account and creation date
 * @param {String} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {String} text - text to search
 * @param {String} page - Page number
 * @param {String} pageSize - Page size
 * @param {String} sortBy - Sort by field
 * @param {String} sortDirection - Sort direction (ascending or descending)
 * @returns {Promise} - Promise object represents the transactions data
 */
export async function getUserTransactions(
  userId: string,
  startDate: Date,
  endDate: Date,
  sortBy: string,
  sortDirection: string,
  text?: string,
  accountId?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<Transaction[]> {
  const sortOrder = sortDirection === "ascending" ? "asc" : "desc";
  const validSortFields = [
    "createdAt",
    "amount",
    "account.name",
    "account.institution.name",
    "category.name",
    "payee",
    "notes",
  ];
  if (!validSortFields.includes(sortBy)) {
    throw new Error(
      `Invalid sort field: ${sortBy}. Valid fields are: ${validSortFields.join(
        ", "
      )}`
    );
  }
  // Make nested object from sortBy string
  const getGetNestedSortBy = (sortBy: string, sortOrder: string = "desc") => {
    if (sortBy === "account.institution.name") {
      return {
        account: {
          institutionName: sortOrder,
        },
      };
    }
    const keys = sortBy.split(".");
    type NestedSortObject = { [key: string]: string | NestedSortObject };
    return keys.reduceRight<NestedSortObject>(
      (acc, key) => {
        return { [key]: acc };
      },
      sortOrder as unknown as NestedSortObject
    );
  };
  const dbSortBy = getGetNestedSortBy(sortBy, sortOrder);
  const transactions = await db.transaction.findMany({
    select: {
      id: true,
      amount: true,
      payee: true,
      notes: true,
      createdAt: true,
      createdByUser: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          last4: true,
          institutionName: true,
          currency: {
            select: { symbol: true, name: true, id: true, exchangeRate: true },
          },
          userAccess: {
            select: {
              userId: true,
              role: true,
              user: {
                select: { appleSubscriptionStatus: true },
              },
            },
          },
        },
      },
      category: {
        select: { id: true, name: true, icon: true },
      },
    },
    where: {
      account: {
        userAccess: { some: { userId } },
        ...(accountId ? { id: accountId } : {}),
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        {
          payee: {
            contains: text,
            mode: "insensitive",
          },
        },
        {
          category: {
            name: {
              contains: text,
              mode: "insensitive",
            },
          },
        },
        {
          notes: {
            contains: text,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      ...(dbSortBy as Record<string, string | Record<string, string>>),
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Filter by subscription status
  const filteredTransactions = filterTransactionsBySubscription(
    transactions,
    userId
  );

  // Map institutionName to institution: { name } and exclude userAccess
  return filteredTransactions.map((transaction) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userAccess, ...accountWithoutUserAccess } = transaction.account;
    return {
      ...transaction,
      account: {
        ...accountWithoutUserAccess,
        institution: { name: transaction.account.institutionName },
      },
    };
  });
}

/**
 * Get user transaction by transaction ID and user ID
 * @param {String} id - Transaction ID
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the transaction data
 */
export async function getUserTransactionById(id: string, userId: string) {
  return await db.transaction.findFirst({
    where: {
      id,
      account: {
        userAccess: { some: { userId } },
      },
    },
    select: {
      id: true,
      amount: true,
      payee: true,
      notes: true,
      createdAt: true,
      account: {
        select: { id: true, name: true },
      },
      category: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Bulk create transactions
 * @param {Object[]} transactions - Array of transactions
 * @returns {Promise} - Promise object represents the created transactions
 */
export async function bulkCreateTransactions(
  transactions: CreateTransaction[],
  userId: string
) {
  return await db.transaction.createMany({
    data: transactions.map((transaction) => ({
      id: uuid(),
      amount: transaction.amount,
      payee: transaction.payee || "",
      notes: transaction.notes,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      createdAt: transaction.createdAt,
      createdBy: userId,
    })),
  });
}

/**
 * Get user transaction months
 * @param {String} userId - User ID
 * @returns {Promise} - Promise Array of transaction months
 */
export async function getUserTransactionMonths(
  userId: string,
  accountId: string
) {
  const transactions = await db.transaction.findMany({
    where: {
      account: {
        userAccess: { some: { userId } },
        ...(accountId === "all" ? {} : { id: accountId }),
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Extract unique months in 'YYYY-MM' format
  const monthsSet = new Set(
    transactions.map((t) => format(t.createdAt, "yyyy-MM"))
  );

  return Array.from(monthsSet);
}

/**
 * Get user expenses and income totals by category for a given month
 * @param {String} userId - User ID
 * @param {String?} startDate - Month in 'YYYY-MM' format
 * @param {String?} endDate - Month in 'YYYY-MM' format
 * @param {String} accountId - Account ID
 * @param {String} currencyId - Currency ID
 * @returns {Promise} - Promise object represents the expenses and income totals by category
 */
export async function getUserTransactionsTotalsByCategory({
  userId,
  startDate,
  endDate,
  accountId,
  currencyId,
}: {
  userId: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  currencyId?: string;
}) {
  const accountIdFilter = !accountId ? {} : { id: accountId };
  // Convert to Date objects if provided
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? endOfDay(new Date(endDate)) : undefined;

  const transactions = await db.transaction.findMany({
    where: {
      account: { userAccess: { some: { userId } }, ...accountIdFilter },
      ...(start && end ? { createdAt: { gte: start, lte: end } } : {}),
    },
    select: {
      amount: true,
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      account: {
        select: {
          currency: {
            select: { id: true, name: true, symbol: true, exchangeRate: true },
          },
        },
      },
    },
  });

  let targetExchangeRate = 1;
  if (!accountId && currencyId) {
    // Find the exchange rate for the target currency
    const targetCurrency = transactions.find(
      (t) => t.account.currency.id === currencyId
    )?.account.currency;
    if (targetCurrency) {
      targetExchangeRate = targetCurrency.exchangeRate;
    }
  }

  const convertedTransactions = transactions.map((t) => {
    let amount = t.amount;
    if (!accountId && currencyId && t.account.currency.id !== currencyId) {
      amount = convertCurrency(
        t.amount,
        t.account.currency.exchangeRate,
        targetExchangeRate
      );
    }
    return {
      ...t,
      amount,
    };
  });

  const totals: Record<
    string,
    {
      name: string;
      icon: string | null;
      amount: number;
      user?: { id: string; name: string; image: string | null };
    }
  > = {};
  let totalExpenses = 0;
  let totalIncome = 0;
  // Aggregate amounts by category calculate persentaces and totals
  for (const transaction of convertedTransactions) {
    const categoryId = transaction.category?.id || "uncategorized";
    const categoryName = transaction.category?.name || "Uncategorized";
    const categoryIcon = transaction.category?.icon || null;
    const user = transaction.category?.user;
    if (!totals[categoryId]) {
      totals[categoryId] = {
        user: user ? { ...user, name: user.name || "" } : undefined,
        name: categoryName,
        icon: categoryIcon,
        amount: 0,
      };
    }
    totals[categoryId].amount += transaction.amount;
    if (transaction.amount < 0) {
      totalExpenses += transaction.amount;
    } else {
      totalIncome += transaction.amount;
    }
  }

  const result = Object.entries(totals).map(
    ([id, { name, icon, amount, user }]) => ({
      id,
      name,
      icon,
      amount,
      user,
      percentage:
        amount < 0
          ? totalExpenses
            ? (Number(amount) / Number(totalExpenses)) * 100
            : 0
          : totalIncome
            ? (Number(amount) / Number(totalIncome)) * 100
            : 0,
    })
  );
  return result;
}

/**
 * Filter transactions based on account ownership and subscription status
 * Only include transactions where:
 * 1. User is the owner (always include)
 * 2. User is NOT the owner, but the owner has an active subscription
 * @param {Transaction[]} transactions - Array of transactions
 * @param {string} userId - Current user ID
 * @returns {Promise<Transaction[]>} - Filtered transactions
 */
export function filterTransactionsBySubscription<
  T extends {
    account: {
      userAccess: Array<{
        userId: string;
        role: string | null;
        user: { appleSubscriptionStatus: string };
      }>;
    };
  },
>(transactions: T[], userId: string): T[] {
  return transactions.filter((transaction) => {
    const userAccess = transaction.account.userAccess.find(
      (access) => access.userId === userId
    );

    // If user is the owner, always include
    if (userAccess?.role === "owner") return true;

    // If user is not the owner, check if owner has active subscription
    const ownerAccess = transaction.account.userAccess.find(
      (access) => access.role === "owner"
    );

    if (!ownerAccess) return false;

    const ownerSubscriptionStatus =
      ownerAccess.user.appleSubscriptionStatus || "inactive";

    return hasActiveAppleSubscription(ownerSubscriptionStatus);
  });
}
