import { v4 as uuid } from "uuid";
import { format } from "date-fns";

import { db } from "@/db";
import { formatCurrency } from "@/lib/utils";
import { convertAmountFromMilliunits, convertCurrency } from "@/lib/utils";
import {
  CreateTransaction,
  UpdateTransaction,
} from "@/features/transactions/hooks";
import { createTransactionSchema } from "@/schemas";

/**
 * Fetch user data for AI model context
 * @param {String}  userId - User ID
 */
export async function getUserTransactions(userId: string) {
  const transactions = await db.transaction.findMany({
    select: {
      amount: true,
      payee: true,
      notes: true,
      createdAt: true,
      account: {
        select: {
          name: true,
          institutionName: true,
          currency: { select: { name: true } },
          balance: true,
        },
      },
      category: {
        select: { name: true },
      },
    },
    where: {
      account: {
        userId,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const convertedTransactions = transactions.map((transaction) => ({
    ...transaction,
    amount: convertAmountFromMilliunits(transaction.amount),
    createdAt: transaction.createdAt,
    account: {
      name: transaction.account.name,
      balance: transaction.account.balance || "unknown",
      currency: {
        name: transaction.account.currency.name,
      },
    },
    bank: {
      name: transaction.account.institutionName,
    },
  }));

  return convertedTransactions;
}

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
 * Fetch user analytics data for AI model context
 * @param {String} userId - User ID
 */
export async function getUserAnalytics(userId: string) {
  const transactionsData = await db.transaction.findMany({
    select: {
      amount: true,
      payee: true,
      notes: true,
      createdAt: true,
      account: {
        select: {
          name: true,
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
        userId,
      },
    },
    orderBy: { createdAt: "desc" },
  });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  > = transactionsData.reduce((acc: Record<string, any>, transaction) => {
    if (transaction.account.currency.id in acc) {
      acc[transaction.account.currency.id] = {
        ...acc[transaction.account.currency.id],
        count: acc[transaction.account.currency.id].count + 1,
        expenses:
          transaction.amount < 0
            ? acc[transaction.account.currency.id].expenses + transaction.amount
            : acc[transaction.account.currency.id].expenses,
        income:
          transaction.amount > 0
            ? acc[transaction.account.currency.id].income + transaction.amount
            : acc[transaction.account.currency.id].income,
        symbol: transaction.account.currency.symbol,
        currency: transaction.account.currency.name,
      };
    } else {
      acc[transaction.account.currency.id] = {
        count: 1,
        expenses: transaction.amount < 0 ? transaction.amount : 0,
        income: transaction.amount > 0 ? transaction.amount : 0,
        exchangeRate: transaction.account.currency.exchangeRate,
        symbol: transaction.account.currency.symbol,
        currency: transaction.account.currency.name,
      };
    }
    return acc;
  }, {});

  // sort by count
  const [targetCurrency] = Object.entries(transactionsByCurrency).sort(
    (a, b) => b[1].count - a[1].count
  );
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
  return {
    currenctSymbol: targetCurrency[1].symbol,
    currencyName: targetCurrency[1].currency,
    income: convertAmountFromMilliunits(sum.income),
    expenses: convertAmountFromMilliunits(sum.expenses),
    netFlow: convertAmountFromMilliunits(sum.income + sum.expenses),
    transactions: transactionsData.map((transaction) => ({
      amount: formatCurrency(
        convertAmountFromMilliunits(transaction.amount),
        transaction.account.currency.name
      ),
      category: transaction.category?.name || "Uncategorized",
      payee: transaction.payee,
      notes: transaction.notes,
      account: transaction.account.name,
    })),
  };
}
/**
 * Creates a new transaction
 * @param {Transaction} payload - Transaction data
 * @returns {Promise} - Promise object represents the transaction data
 * @throws {Error} - If the transaction creation fails
 */
export async function createTransaction(payload: CreateTransaction) {
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
    return { id: transaction.id };
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
export async function getUserTransactionsCount(userId?: string) {
  return await db.transaction.count({
    where: { account: { userId } },
  });
}

/**
 * Get user transactions count by account and creation date
 * @param {String} userId - User ID
 * @param {String} accountId - Account ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<number>} - Number of transactions
 */
export async function getUserTransactionsCountByAccount(
  userId: string,
  accountId: string,
  startDate: Date,
  endDate: Date
) {
  return await db.transaction.count({
    where: {
      accountId,
      account: {
        userId,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
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
  data: Omit<UpdateTransaction, "id">
) {
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
 * @param {String} accountId - Account ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise} - Promise object represents the transactions data
 */
export async function getUserTransactionsByAccountandCreatedDate(
  userId: string,
  accountId: string,
  startDate: Date,
  endDate: Date
) {
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
          currency: { select: { symbol: true, name: true } },
        },
      },
      category: {
        select: { id: true, name: true },
      },
    },
    where: {
      accountId,
      account: {
        userId,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: "desc" },
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
