import { db } from "@/db";
import {
  convertCurrency,
  convertAmountFromMilliunits,
  normalizePayee,
} from "@/lib/utils";
import {
  previousUtcMonth,
  reportWindows,
  safeTimeZone,
} from "@/lib/reportSchedule";
import { Transaction } from "@/types";
import { accountSelect } from "@/data/accounts";
import { categorySelect } from "@/data/categories";
import {
  getCategoryResolvers,
} from "@/data/categoryMappings";

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

    // A partner row that resolves to none of the viewer's categories is left
    // out of the category breakdown and is not "uncategorized" either; where a
    // name is still shown, it is the one the author picked.
    const unmappedPartner = !t.category && !!t.sourceCategory;
    const cat =
      t.category?.name ||
      (unmappedPartner ? t.sourceCategory!.name : "Uncategorized");
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

    if (!unmappedPartner) {
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + spend);
    }
    byPayee.set(payee, (byPayee.get(payee) ?? 0) + spend);

    if (!t.category?.name && !unmappedPartner) {
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
 *
 * `reportMonth` names the month to report on by its UTC year and month (a
 * `Report.periodStart`); it defaults to the previous UTC month. Each user's
 * rows are split into months in that user's timezone from `timeZones` (UTC
 * when missing), so a purchase at 23:30 on 31 August in Madrid counts in
 * August for them.
 */
export async function getTransactions({
  userIds,
  reportMonth = previousUtcMonth(),
  timeZones,
}: {
  userIds: string[];
  reportMonth?: Date;
  timeZones?: Map<string, string>;
}) {
  try {
    const windows = new Map(
      userIds.map((id) => [
        id,
        reportWindows(reportMonth, safeTimeZone(timeZones?.get(id))),
      ]),
    );
    // One query wide enough for every user's timezone; each row is then kept
    // only where it falls inside its viewer's own months.
    const all = [...windows.values()];
    const historyStart = new Date(
      Math.min(...all.map((w) => w.historyStart.getTime())),
    );
    const currentEnd = new Date(Math.max(...all.map((w) => w.end.getTime())));

    console.log("Fetching transactions for users:", userIds);
    console.log(
      "Date range - History Start:",
      historyStart,
      "Current End:",
      currentEnd,
    );

    const allTransactionsData = await db.transaction.findMany({
      select: transactionSelect,
      where: {
        account: {
          userAccess: { some: { userId: { in: userIds } } },
        },
        createdAt: {
          gte: historyStart,
          lt: currentEnd,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const resolvers = await getCategoryResolvers(userIds);
    const currentByUser = new Map<string, Transaction[]>();
    const prevByUser = new Map<string, Transaction[]>();
    const historyByUser = new Map<string, Transaction[]>();

    for (const transaction of allTransactionsData) {
      const createdAt = new Date(transaction.createdAt);

      for (const access of transaction.account.userAccess) {
        const w = windows.get(access.userId);
        if (!w || createdAt < w.historyStart || createdAt >= w.end) continue;
        const t: Transaction = {
          ...transaction,
          // Each recipient sees the row under their own category.
          category:
            resolvers
              .get(access.userId)
              ?.resolve(transaction.category, transaction.id) ?? null,
          sourceCategory: transaction.category,
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
        if (createdAt >= w.start) {
          const arr = currentByUser.get(access.userId) ?? [];
          arr.push(t);
          currentByUser.set(access.userId, arr);
        }

        // previous month bucket
        if (createdAt >= w.prevStart && createdAt < w.start) {
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
