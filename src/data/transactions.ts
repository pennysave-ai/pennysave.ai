import { v4 as uuid } from "uuid";
import {
  format,
  endOfDay,
  subMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { db } from "@/db";
import { UpdateTransaction } from "@/features/transactions/hooks";
import { createTransactionSchema } from "@/schemas";
import { checkBudgetExceedance } from "@/data/budgets";
import { sendBudgetExceedNotification } from "@/lib/mail";
import {
  convertCurrency,
  convertAmountFromMilliunits,
  isWithin,
  normalizePayee,
} from "@/lib/utils";
import { hasActiveAppleSubscription } from "@/data/user";
import { Transaction, NewTransaction } from "@/types";
import { accountSelect } from "@/data/accounts";
import { categorySelect } from "@/data/categories";

export const transactionSelect = {
  id: true,
  amount: true,
  payee: true,
  notes: true,
  createdAt: true,
  account: {
    select: accountSelect,
  },
  category: {
    select: categorySelect,
  },
  createdByUser: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
};

type TransactionAggregates = {
  expenseByCategory: Array<{ category: string; spend: number; pct: number }>;
  expenseByPayee: Array<{ payee: string; spend: number; pct: number }>;
  largestExpenses: Array<{
    amount: number; // positive, in target currency units
    category: string;
    payee: string;
    account: string;
  }>;
  largestIncome: Array<{
    amount: number; // positive, in target currency units
    category: string;
    payee: string;
    account: string;
  }>;
  uncategorized: { count: number; spend: number };
};

/**
 * Creates a new transaction
 * @param {Transaction} payload - Transaction data
 * @returns {Promise} - Promise object represents the transaction data
 * @throws {Error} - If the transaction creation fails
 */
export async function createTransaction(
  payload: NewTransaction,
  email: string,
  userName: string,
  userId: string,
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
        accountId,
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
      select: transactionSelect,
    });

    // Map institutionName to institution: { name }
    const { userAccess, ...accountWithoutUserAccess } = transaction.account;
    return {
      ...transaction,
      account: {
        ...accountWithoutUserAccess,
        institution: { name: transaction.account.institutionName || "" },
        users: userAccess.map((access) => ({
          id: access.userId,
          name: access.user.name,
          image: access.user.image,
        })),
      },
      payee: transaction.payee || "",
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
  text?: string,
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
  userId: string,
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
  data: Omit<UpdateTransaction, "id">,
): Promise<Transaction> {
  const { categoryId, amount, accountId } = data;
  if (!!categoryId && amount < 0 && userId) {
    const budgetExceedance = await checkBudgetExceedance(
      id,
      userId,
      amount,
      categoryId,
      accountId,
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
    select: transactionSelect,
  });

  // Map institutionName to institution: { name }
  const { userAccess, ...accountWithoutUserAccess } = transaction.account;
  return {
    ...transaction,
    account: {
      ...accountWithoutUserAccess,
      institution: { name: transaction.account.institutionName || "" },
      users: userAccess.map((access) => ({
        id: access.userId,
        name: access.user.name,
        image: access.user.image,
      })),
    },
    payee: transaction.payee || "",
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
  pageSize: number = 10,
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
        ", ",
      )}`,
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
      sortOrder as unknown as NestedSortObject,
    );
  };

  const dbSortBy = getGetNestedSortBy(sortBy, sortOrder);
  const transactions = await db.transaction.findMany({
    select: {
      ...transactionSelect,
      account: {
        select: {
          ...accountSelect,
          userAccess: {
            select: {
              ...accountSelect.userAccess.select,
              user: {
                select: {
                  ...accountSelect.userAccess.select.user.select,
                  appleSubscriptionStatus: true,
                },
              },
            },
          },
        },
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
    userId,
  );

  // Map institutionName to institution: { name } and exclude userAccess
  return filteredTransactions.map((transaction) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userAccess, ...accountWithoutUserAccess } = transaction.account;
    return {
      ...transaction,
      payee: transaction.payee || "",
      account: {
        ...accountWithoutUserAccess,
        institution: { name: transaction.account.institutionName || "" },
        users: userAccess.map((access) => ({
          id: access.userId,
          name: access.user.name,
          image: access.user.image,
        })),
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
  transactions: NewTransaction[],
  userId: string,
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
  accountId: string,
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
    transactions.map((t) => format(t.createdAt, "yyyy-MM")),
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
      createdByUser: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
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
      (t) => t.account.currency.id === currencyId,
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
        targetExchangeRate,
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
    const categoryName = transaction.category?.name || "";
    const categoryIcon = transaction.category?.icon || null;
    const user = transaction.createdByUser;
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
    }),
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
      (access) => access.userId === userId,
    );

    // If user is the owner, always include
    if (userAccess?.role === "owner") return true;

    // If user is not the owner, check if owner has active subscription
    const ownerAccess = transaction.account.userAccess.find(
      (access) => access.role === "owner",
    );

    if (!ownerAccess) return false;

    const ownerSubscriptionStatus =
      ownerAccess.user.appleSubscriptionStatus || "inactive";

    return hasActiveAppleSubscription(ownerSubscriptionStatus);
  });
}

/**
 * Convert amount from transaction currency to target currency using exchange rates
 */
function toTargetCurrencyMilliunits({
  amountMilliunits,
  fromCurrencyId,
  fromExchangeRate,
  targetCurrencyId,
  targetExchangeRate,
}: {
  amountMilliunits: number;
  fromCurrencyId: string;
  fromExchangeRate: number;
  targetCurrencyId: string;
  targetExchangeRate: number;
}) {
  if (fromCurrencyId === targetCurrencyId) return amountMilliunits;

  // convertCurrency works on numbers; we pass milliunits consistently across the app
  return convertCurrency(
    amountMilliunits,
    fromExchangeRate,
    targetExchangeRate,
  );
}

/**
 * Compute transaction aggregates for a user, including:
 * - Total spend by category and payee (for expenses)
 * - Largest expenses with details
 * - Largest income with details
 * - Uncategorized transactions count and spend
 * The function takes into account currency conversion to a target currency for accurate aggregation.
 */
export function computeTransactionAggregates(params: {
  userTransactions: Transaction[];
  targetCurrencyId: string;
  targetExchangeRate: number;
  topN?: number;
}): TransactionAggregates {
  const {
    userTransactions,
    targetCurrencyId,
    targetExchangeRate,
    topN = 5,
  } = params;

  const byCategory = new Map<string, number>(); // expense spend milliunits (positive)
  const byPayee = new Map<string, number>(); // expense spend milliunits (positive)

  const largestExpenses: Array<{
    spendMilliunits: number; // positive
    category: string;
    payee: string;
    account: string;
  }> = [];

  const largestIncome: Array<{
    incomeMilliunits: number; // positive
    category: string;
    payee: string;
    account: string;
  }> = [];

  let uncategorizedCount = 0;
  let uncategorizedSpendMilliunits = 0;
  let totalExpenseSpendMilliunits = 0;

  for (const t of userTransactions) {
    const fromCurrencyId = t.account.currency.id;
    const fromRate = t.account.currency.exchangeRate;

    const amtTarget = toTargetCurrencyMilliunits({
      amountMilliunits: t.amount,
      fromCurrencyId,
      fromExchangeRate: fromRate,
      targetCurrencyId,
      targetExchangeRate,
    });

    const cat = t.category?.name || "Uncategorized";
    const payee = normalizePayee(t.payee) || "(no payee)";
    const accountName = t.account.name;

    // Income (positive)
    if (amtTarget > 0) {
      largestIncome.push({
        incomeMilliunits: amtTarget,
        category: cat,
        payee,
        account: accountName,
      });
      continue;
    }

    // Expenses only (negative)
    if (amtTarget >= 0) continue;

    const spend = -amtTarget; // positive
    totalExpenseSpendMilliunits += spend;

    byCategory.set(cat, (byCategory.get(cat) ?? 0) + spend);
    byPayee.set(payee, (byPayee.get(payee) ?? 0) + spend);

    if (!t.category?.name) {
      uncategorizedCount += 1;
      uncategorizedSpendMilliunits += spend;
    }

    largestExpenses.push({
      spendMilliunits: spend,
      category: cat,
      payee,
      account: accountName,
    });
  }

  const expenseByCategory = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([category, spendMilliunits]) => ({
      category,
      spend: convertAmountFromMilliunits(spendMilliunits),
      pct:
        totalExpenseSpendMilliunits > 0
          ? Number(
              ((spendMilliunits / totalExpenseSpendMilliunits) * 100).toFixed(
                1,
              ),
            )
          : 0,
    }));

  const expenseByPayee = [...byPayee.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([payee, spendMilliunits]) => ({
      payee,
      spend: convertAmountFromMilliunits(spendMilliunits),
      pct:
        totalExpenseSpendMilliunits > 0
          ? Number(
              ((spendMilliunits / totalExpenseSpendMilliunits) * 100).toFixed(
                1,
              ),
            )
          : 0,
    }));

  const largestExpensesOut = largestExpenses
    .sort((a, b) => b.spendMilliunits - a.spendMilliunits)
    .slice(0, topN)
    .map((x) => ({
      amount: convertAmountFromMilliunits(x.spendMilliunits),
      category: x.category,
      payee: x.payee,
      account: x.account,
    }));

  const largestIncomeOut = largestIncome
    .sort((a, b) => b.incomeMilliunits - a.incomeMilliunits)
    .slice(0, topN)
    .map((x) => ({
      amount: convertAmountFromMilliunits(x.incomeMilliunits),
      category: x.category,
      payee: x.payee,
      account: x.account,
    }));

  return {
    expenseByCategory,
    expenseByPayee,
    largestExpenses: largestExpensesOut,
    largestIncome: largestIncomeOut,
    uncategorized: {
      count: uncategorizedCount,
      spend: convertAmountFromMilliunits(uncategorizedSpendMilliunits),
    },
  };
}

/**
 * Get transactions for multiple users within a date range, but also includes a
 * history window (default: 3 months prior to `start`) to support:
 * - previous-month comparisons
 * - recurring-candidate detection
 */
export async function getTransactions({ userIds }: { userIds: string[] }) {
  try {
    const now = new Date();

    const reportMonthDate = subMonths(now, 1);
    const currentStart = startOfMonth(reportMonthDate); // beginning of prev month
    const currentEnd = endOfMonth(reportMonthDate); // end of prev month

    // Month before previous (for comparisons)
    const prevMonthDate = subMonths(now, 2);
    const prevStart = startOfMonth(prevMonthDate);
    const prevEnd = endOfMonth(prevMonthDate);

    // History window for recurring detection (3 months before report start)
    const historyStart = subMonths(currentStart, 3);

    const allTransactionsData = await db.transaction.findMany({
      select: transactionSelect,
      where: {
        account: {
          userAccess: { some: { userId: { in: userIds } } },
        },
        createdAt: {
          gte: historyStart,
          lte: currentEnd,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const currentByUser = new Map<string, Transaction[]>();
    const prevByUser = new Map<string, Transaction[]>();
    const historyByUser = new Map<string, Transaction[]>();

    for (const transaction of allTransactionsData) {
      const createdAt = new Date(transaction.createdAt);

      for (const access of transaction.account.userAccess) {
        if (!userIds.includes(access.userId)) continue;
        const t: Transaction = {
          ...transaction,
          payee: transaction.payee || "",
          account: {
            ...transaction.account,
            institution: { name: transaction.account.institutionName || "" },
            users: transaction.account.userAccess.map((ua: any) => ({
              id: ua.userId,
              name: ua.user.name,
              email: ua.user.email,
              image: ua.user.image,
            })),
          },
        };

        // history bucket (everything in the query range)
        {
          const arr = historyByUser.get(access.userId) ?? [];
          arr.push(t);
          historyByUser.set(access.userId, arr);
        }

        // current month bucket
        if (isWithin(createdAt, currentStart, currentEnd)) {
          const arr = currentByUser.get(access.userId) ?? [];
          arr.push(t);
          currentByUser.set(access.userId, arr);
        }

        // previous month bucket
        if (isWithin(createdAt, prevStart, prevEnd)) {
          const arr = prevByUser.get(access.userId) ?? [];
          arr.push(t);
          prevByUser.set(access.userId, arr);
        }
      }
    }

    return { currentByUser, prevByUser, historyByUser };
  } catch (e) {
    console.error("Error fetching transactions:", e);
    throw new Error("Failed to fetch transactions");
  }
}
