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
    payee?: string;
    notes?: string;
    email: string;
    account: {
      name: string;
      currency: {
        id: string;
        symbol: string;
        name: string;
        exchangeRate: number;
      };
      user: {
        email: string;
      };
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
          userId: true,
          institutionName: true,
          currency: {
            select: { name: true, id: true, exchangeRate: true, symbol: true },
          },
          user: {
            select: { email: true },
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
        userId: {
          in: usersIds,
        },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group transactions by account user ID
  const groupedTransactionsByUserId = transactionsData.reduce(
    (acc, transaction) => {
      const userId = transaction.account.userId;
      if (acc.has(userId)) {
        acc.set(userId, [...acc.get(userId), transaction]);
      } else {
        acc.set(userId, [transaction]);
      }
      return acc;
    },
    new Map()
  );
  // Iterate over each user id to determine the base currency
  const usersData = [];
  for (const [userId, userTransactions] of groupedTransactionsByUserId) {
    const transactionsByCurrency: Record<
      string,
      {
        count: number;
        expenses: number;
        income: number;
        exchangeRate: number;
        symbol: string;
        currency: string;
        email: string;
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
            email: string;
          }
        >,
        transaction: Transaction
      ) => {
        if (transaction.account.currency.id in acc) {
          acc[transaction.account.currency.id] = acc[
            transaction.account.currency.id
          ] = {
            ...acc[transaction.account.currency.id],
            count: acc[transaction.account.currency.id].count + 1,
            expenses:
              transaction.amount < 0
                ? acc[transaction.account.currency.id].expenses +
                  transaction.amount
                : acc[transaction.account.currency.id].expenses,
            income:
              transaction.amount > 0
                ? acc[transaction.account.currency.id].income +
                  transaction.amount
                : acc[transaction.account.currency.id].income,
            symbol: transaction.account.currency.symbol,
            currency: transaction.account.currency.name,
            email: transaction.account.user.email,
          };
        } else {
          acc[transaction.account.currency.id] = {
            count: 1,
            expenses: transaction.amount < 0 ? transaction.amount : 0,
            income: transaction.amount > 0 ? transaction.amount : 0,
            exchangeRate: transaction.account.currency.exchangeRate,
            symbol: transaction.account.currency.symbol,
            currency: transaction.account.currency.name,
            email: transaction.account.user.email,
          };
        }
        return acc;
      },
      {}
    );
    // sort by count
    const [targetCurrency] = Object.entries(transactionsByCurrency).sort(
      (a, b) => b[1].count - a[1].count
    );
    // Convert income and expenses to base currency and find a total for income and expences
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
      email: targetCurrency[1].email,
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
  userId?: string
) {
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
      },
    });

    return { ...transaction };
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
    where: { account: { userId } },
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
        userId,
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
        userId,
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
) {
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
  return await db.transaction.update({
    where: {
      id,
      account: {
        userId,
      },
    },
    data,
  });
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
) {
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
  return await db.transaction.findMany({
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
            select: { symbol: true, name: true, id: true, exchangeRate: true },
          },
        },
      },
      category: {
        select: { id: true, name: true, icon: true },
      },
    },
    where: {
      account: {
        userId,
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
}

/**
 * Get user transaction buy transaction ID and user ID
 * @param {String} id - Transaction ID
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the transaction data
 */
export async function getUserTransactionById(id: string, userId: string) {
  return await db.transaction.findFirst({
    where: {
      id,
      account: {
        userId,
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
  transactions: CreateTransaction[]
) {
  return await db.transaction.createMany({
    data: transactions,
  });
}

/**
 * Get user transaction months
 * @param {String} userId - User ID
 * @returns {Promise} - Promise Array of transaction months
 */
export async function getUserTransactionMonths(userId: string) {
  const transactions = await db.transaction.findMany({
    where: {
      account: {
        userId,
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
      account: { userId, ...accountIdFilter },
      ...(start && end ? { createdAt: { gte: start, lte: end } } : {}),
    },
    select: {
      amount: true,
      category: { select: { id: true, name: true, icon: true } },
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
    { name: string; icon: string | null; amount: number }
  > = {};
  let totalExpenses = 0;
  let totalIncome = 0;

  // Aggregate amounts by category calculate persentaces and totals
  for (const transaction of convertedTransactions) {
    const categoryId = transaction.category?.id || "uncategorized";
    const categoryName = transaction.category?.name || "Uncategorized";
    const categoryIcon = transaction.category?.icon || null;
    if (!totals[categoryId]) {
      totals[categoryId] = {
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

  const result = Object.entries(totals).map(([id, { name, icon, amount }]) => ({
    id,
    name,
    icon,
    amount,
    percentage:
      amount < 0
        ? totalExpenses
          ? (Number(amount) / Number(totalExpenses)) * 100
          : 0
        : totalIncome
          ? (Number(amount) / Number(totalIncome)) * 100
          : 0,
  }));
  return result;
}
