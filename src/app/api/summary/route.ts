import { NextRequest, NextResponse } from "next/server";
import {
  subDays,
  differenceInDays,
  isSameDay,
  endOfDay,
  isSameMonth,
  subMonths,
} from "date-fns";
import { db } from "@/db";
import { auth } from "@/auth";
import { convertCurrency, parseUTCDate, parseUTCEndOfDay } from "@/lib/utils";
import { getTargetCurrency } from "@/data/currencies";
import { DEFAULT_DATA_PERIOD } from "@/constants";
import {
  calculatePercentageChange,
  fillMissingDates,
  fillMissingDatesForExpenceCategories,
} from "@/lib/utils";
import { Currency } from "@/types";

type FinancialDataResponse = {
  income: number;
  expences: number;
  remaining: number;
};

export type CategoryResponse = {
  id: string;
  name: string;
  amount: number;
};

export type DailyDataResponse = {
  date: string;
  income: number;
  expences: number;
};

/**
 * Fetches financial data (total income and expenses) for a user within a specified date range.
 *
 * @param {string} userId - The ID of the user.
 * @param {Date} startDate - The start date of the period.
 * @param {Date} endDate - The end date of the period.
 * @param {string | null} accountId - Optional account ID to filter transactions.
 * @param {Currency} targetCurrency - Optional target currency to convert the amounts to.
 * @returns {Promise<FinancialDataResponse>} - Aggregated financial data.
 */
const fetchFinancialData = async (
  userId: string = "",
  startDate: Date,
  endDate: Date,
  accountId: string | null,
  targetCurrency: Currency
) => {
  try {
    const query = `
  SELECT
    c."name" AS "currencyName",
    c."exchangeRate" AS "exchangeRate",
    c."id" AS "currencyId",
    c."symbol" AS "currencySymbol",
    SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) AS "income",
    SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END) AS "expences"
  FROM
    "Transaction" t
  INNER JOIN
    "UserAccount" ua ON t."accountId" = ua.id
  INNER JOIN
    "UserAccountAccess" uaa ON ua.id = uaa."userAccountId"
  INNER JOIN
    "Currency" c ON ua."currencyId" = c.id
  WHERE
    t."createdAt" BETWEEN $1 AND $2
    AND uaa."userId" = $3
    ${accountId ? `AND t."accountId" = $4` : ""}
  GROUP BY
    c."name",
    c."exchangeRate",
    c."id",
    c."symbol"`;
    const params = accountId
      ? [startDate, endDate, userId, accountId]
      : [startDate, endDate, userId];

    const queryResult = await db.$queryRawUnsafe<
      {
        currencyName: string;
        exchangeRate: number;
        currencyId: string;
        income: number;
        expences: number;
        currencySymbol: string;
      }[]
    >(query, ...params);
    const result: FinancialDataResponse = queryResult.reduce(
      (acc, item) => {
        if (item.currencyId === targetCurrency.id) {
          acc.income += Number(item.income);
          acc.expences += Number(item.expences);
          acc.remaining += Number(item.income) + Number(item.expences);
        } else {
          acc.income += convertCurrency(
            item.income,
            item.exchangeRate,
            targetCurrency.exchangeRate
          );
          acc.expences += convertCurrency(
            item.expences,
            item.exchangeRate,
            targetCurrency.exchangeRate
          );
          acc.remaining += convertCurrency(
            Number(item.income) + Number(item.expences),
            item.exchangeRate,
            targetCurrency.exchangeRate
          );
        }
        return acc;
      },
      {
        income: 0,
        expences: 0,
        remaining: 0,
      }
    );
    return result;
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    throw new Error("Internal Server Error");
  }
};

/**
 * Fetches the sum of spending categorized by each category for a user within a date range.
 *
 * @param {string} userId - The ID of the user.
 * @param {Date} startDate - The start date of the period.
 * @param {Date} endDate - The end date of the period.
 * @param {string | null} accountId - Optional account ID to filter transactions.
 * @param {Currency} targetCurrency - Optional target currency to convert the amounts to.
 * @returns {Promise<Array<CategoryResponse>>}
 */
const fetchSpendingByCategory = async (
  userId: string = "",
  startDate: Date,
  endDate: Date,
  accountId: string | null,
  targetCurrency: Currency
): Promise<Array<CategoryResponse>> => {
  try {
    // Collect all transactions for the user within the date range and currencies for the account
    const query = `
  SELECT
    "Transaction"."categoryId",
    "Category"."name" AS "categoryName",
    COALESCE(SUM(-"Transaction"."amount"), 0) AS "amount",
    "Currency"."id" AS "currencyId",
    "Currency"."exchangeRate" AS "exchangeRate"
  FROM
    "Transaction"
  LEFT JOIN
    "Category" ON "Transaction"."categoryId" = "Category"."id"
  INNER JOIN
    "UserAccount" ON "Transaction"."accountId" = "UserAccount"."id"
  INNER JOIN
    "UserAccountAccess" ON "UserAccount"."id" = "UserAccountAccess"."userAccountId"
  INNER JOIN
    "Currency" ON "UserAccount"."currencyId" = "Currency"."id"
  WHERE
    "Transaction"."createdAt" BETWEEN $1 AND $2
    AND "Transaction"."amount" < 0
    AND "UserAccountAccess"."userId" = $3
    ${accountId ? `AND "Transaction"."accountId" = $4` : ""}
  GROUP BY
    "Transaction"."categoryId",
    "Category"."name",
    "Currency"."id",
    "Currency"."exchangeRate"
  ORDER BY
    "amount" DESC;
`;
    const params = accountId
      ? [startDate, endDate, userId, accountId]
      : [startDate, endDate, userId];

    const queryResult = await db.$queryRawUnsafe<
      {
        categoryId: string;
        categoryName: string;
        amount: number;
        currencyId: string;
        exchangeRate: number;
      }[]
    >(query, ...params);
    // Merge the spending for the same category and convert to the target currency
    const result = queryResult.reduce(
      (acc: { id: string; name: string; amount: number }[], item) => {
        const targetCurrencyAmount = item.currencyId === targetCurrency.id;
        const amount = targetCurrencyAmount
          ? Number(item.amount)
          : convertCurrency(
              item.amount,
              item.exchangeRate,
              targetCurrency.exchangeRate
            );

        const existingCategory = acc.find(
          (category: { id: string; name: string; amount: number }) =>
            category.id === item.categoryId
        );
        if (existingCategory) {
          existingCategory.amount += amount;
        } else {
          acc.push({
            id: item.categoryId,
            name: item.categoryName,
            amount,
          });
        }
        return acc;
      },
      []
    );
    return result.sort((a, b) => b.amount - a.amount);
  } catch {
    throw new Error("Failed to fetch spending by category.");
  }
};

/**
 * Fetches the sum of spendings and income grouped by day for a user within a date range.
 *
 * @param {string} userId - The ID of the user.
 * @param {Date} startDate - The start date of the period.
 * @param {Date} endDate - The end date of the period.
 * @param {string | null} accountId - Optional account ID to filter transactions.
 * @param {Currency} targetCurrency - Optional target currency to convert the amounts to.
 * @returns {Promise<Array<DailyDataResponse>>}
 */
const dailyData = async (
  userId: string = "",
  startDate: Date,
  endDate: Date,
  accountId: string | null,
  targetCurrency: Currency
) => {
  try {
    const query = `
  SELECT
    "Transaction"."createdAt" AS "date",
    COALESCE(SUM(CASE WHEN "Transaction"."amount" > 0 THEN "Transaction"."amount" ELSE 0 END)::FLOAT, 0) AS "income",
    COALESCE(SUM(CASE WHEN "Transaction"."amount" < 0 THEN "Transaction"."amount" ELSE 0 END)::FLOAT, 0) AS "expences",
    "Currency"."id" AS "currencyId",
    "Currency"."exchangeRate" AS "exchangeRate"
  FROM
    "Transaction"
  INNER JOIN
    "UserAccount" ON "Transaction"."accountId" = "UserAccount"."id"
  INNER JOIN
    "UserAccountAccess" ON "UserAccount"."id" = "UserAccountAccess"."userAccountId"
  INNER JOIN
    "Currency" ON "UserAccount"."currencyId" = "Currency"."id"
  WHERE
    "Transaction"."createdAt" BETWEEN $1 AND $2
    AND "UserAccountAccess"."userId" = $3
    ${accountId ? `AND "Transaction"."accountId" = $4` : ""}
  GROUP BY
    "date",
    "Currency"."id",
    "Currency"."exchangeRate"
  ORDER BY
    "date" ASC;
`;
    const params = accountId
      ? [startDate, endDate, userId, accountId]
      : [startDate, endDate, userId];

    const queryResult = await db.$queryRawUnsafe<
      {
        date: string;
        income: number;
        expences: number;
        exchangeRate: number;
        currencyId: string;
      }[]
    >(query, ...params);
    // Merge the spending and income for the same category and convert to the target currency
    const result = queryResult.reduce<DailyDataResponse[]>((acc, item) => {
      const targetCurrencyAmount = item.currencyId === targetCurrency.id;
      const income = targetCurrencyAmount
        ? Number(item.income)
        : convertCurrency(
            item.income,
            item.exchangeRate,
            targetCurrency.exchangeRate
          );
      const expences = targetCurrencyAmount
        ? Number(item.expences)
        : convertCurrency(
            item.expences,
            item.exchangeRate,
            targetCurrency.exchangeRate
          );
      const existingDay = acc.find((day) => {
        return isSameDay(day.date, item.date);
      });
      if (existingDay) {
        existingDay.income += income;
        existingDay.expences += expences;
      } else {
        acc.push({
          date: item.date,
          income,
          expences,
        });
      }
      return acc;
    }, []);
    return result;
  } catch {
    console.error("Error fetching daily data:");
    throw new Error("Failed to fetch daily data.");
  }
};

/**
 * Fetch daily expences by category
 * @param {string} userId - The ID of the user.
 * @param {Date} startDate - The start date of the period.
 * @param {Date} endDate - The end date of the period.
 * @param {string | null} accountId - Optional account ID to filter transactions.
 * @param {Currency} targetCurrency - Optional target currency to convert the amounts to.
 * @returns {Promise<Map<{ [key: string]: string | number }>>}
 */
const dailyExpences = async (
  userId: string = "",
  startDate: Date,
  endDate: Date,
  accountId: string | null,
  targetCurrency: Currency
): Promise<Map<string, { [key: string]: string | number }>> => {
  try {
    const query = `
  SELECT
    "Transaction"."createdAt" AS "date",
    "Category"."name" AS "categoryName",
    "Category"."id" as "categoryId",
    COALESCE(SUM(-"Transaction"."amount"), 0) AS "amount",
    "Currency"."id" AS "currencyId",
    "Currency"."exchangeRate" AS "exchangeRate"
  FROM
    "Transaction"
  LEFT JOIN
    "Category" ON "Transaction"."categoryId" = "Category"."id"
  INNER JOIN
    "UserAccount" ON "Transaction"."accountId" = "UserAccount"."id"
  INNER JOIN
    "UserAccountAccess" ON "UserAccount"."id" = "UserAccountAccess"."userAccountId"
  INNER JOIN
    "Currency" ON "UserAccount"."currencyId" = "Currency"."id"
  WHERE
    "Transaction"."createdAt" BETWEEN $1 AND $2
    AND "Transaction"."amount" < 0
    AND "UserAccountAccess"."userId" = $3
    ${accountId ? `AND "Transaction"."accountId" = $4` : ""}
  GROUP BY
    "date",
    "Category"."name",
    "Category"."id",
    "Currency"."id",
    "Currency"."exchangeRate"
  ORDER BY
    "date" ASC;
`;
    const params = accountId
      ? [startDate, endDate, userId, accountId]
      : [startDate, endDate, userId];

    const queryResult = await db.$queryRawUnsafe<
      {
        date: string;
        categoryId: string;
        categoryName: string;
        amount: number;
        currencyId: string;
        exchangeRate: number;
      }[]
    >(query, ...params);

    // Get all transactions categories
    const allTransactionsCategories = new Map(
      queryResult.map(({ categoryId, categoryName }) => [
        categoryId,
        categoryName ? categoryName.replace(/ /g, "_") : "Uncategorized",
      ]) as [string, string][]
    );

    const dateMap = new Map();
    queryResult.map((item) => {
      const targetCurrencyAmount = item.currencyId === targetCurrency.id;
      const amount = targetCurrencyAmount
        ? Number(item.amount)
        : convertCurrency(
            item.amount,
            item.exchangeRate,
            targetCurrency.exchangeRate
          );
      const existingDay = dateMap.get(endOfDay(item.date).toISOString());
      if (existingDay) {
        const existingEntity = dateMap.get(endOfDay(item.date).toISOString());
        const categoryName = allTransactionsCategories.get(
          item.categoryId
        ) as string;
        dateMap.set(endOfDay(item.date).toISOString(), {
          ...existingEntity,
          [categoryName]: existingEntity[categoryName] + amount,
        });
      } else {
        dateMap.set(endOfDay(item.date).toISOString(), {
          ...Object.fromEntries(
            Array.from(allTransactionsCategories.entries()).map(
              ([key, value]) => [value, item.categoryId === key ? amount : 0]
            )
          ),
        });
      }
    });
    return dateMap;
  } catch {
    console.error("Error fetching daily expences:");
    throw new Error("Failed to fetch daily expences.");
  }
};

export async function GET(req: NextRequest) {
  const TOP_CATEGORIES = 5;
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const { searchParams } = req.nextUrl;
  const user = session.user;

  let lastPeriodStart, lastPeriodEnd;
  const to = searchParams.get("end");
  const from = searchParams.get("start");
  const accountId = searchParams.get("accountId");
  const currencyId = searchParams.get("currencyId");
  const defaultTo = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    )
  );
  const defaultFrom = subDays(defaultTo, DEFAULT_DATA_PERIOD);

  const startDate = from ? parseUTCDate(from) : defaultFrom;
  const endDate = to ? parseUTCEndOfDay(to) : defaultTo;
  const periodLength = differenceInDays(endDate, startDate) + 1;

  // If the period is less than month pick the same dates from the previous month
  // Otherwise pick the the same range 30, 40, etc. days ago
  if (!isSameMonth(startDate, endDate)) {
    lastPeriodStart = subDays(startDate, periodLength);
    lastPeriodEnd = subDays(endDate, periodLength);
  } else {
    lastPeriodStart = subMonths(startDate, 1);
    lastPeriodEnd = subMonths(endDate, 1);
  }
  try {
    const targetCurrency = await getTargetCurrency(accountId, currencyId);
    const currentPeriod = await fetchFinancialData(
      user.id,
      startDate,
      endDate,
      accountId,
      targetCurrency
    );
    const lastPeriod = await fetchFinancialData(
      user.id,
      lastPeriodStart,
      lastPeriodEnd,
      accountId,
      targetCurrency
    );
    const spendingByCategory = await fetchSpendingByCategory(
      user.id,
      startDate,
      endDate,
      accountId || null,
      targetCurrency
    );

    const dailyExpencesMap = await dailyExpences(
      user.id,
      startDate,
      endDate,
      accountId || null,
      targetCurrency
    );

    const dailyTransactions = await dailyData(
      user.id,
      startDate,
      endDate,
      accountId,
      targetCurrency
    );

    const topCategories = spendingByCategory.slice(0, TOP_CATEGORIES);
    const otherCategories = spendingByCategory.slice(TOP_CATEGORIES);
    const otherCategoriesTotal = otherCategories.reduce(
      (sum, category) => sum + category.amount,
      0
    );
    const spentByCategory = topCategories;
    if (otherCategories.length > 0 && spentByCategory.length < TOP_CATEGORIES) {
      spentByCategory.push({
        id: "other",
        name: "Other",
        amount: otherCategoriesTotal,
      });
    }
    const incomeChange = calculatePercentageChange(
      currentPeriod.income,
      lastPeriod.income
    );
    const expensesChange = calculatePercentageChange(
      Math.abs(currentPeriod.expences),
      Math.abs(lastPeriod.expences)
    );
    const remainingChange = calculatePercentageChange(
      currentPeriod.remaining,
      lastPeriod.remaining
    );
    const dailyTransactionsData = fillMissingDates(
      dailyTransactions,
      startDate,
      endDate
    );

    const expencesByCategory = fillMissingDatesForExpenceCategories(
      dailyExpencesMap,
      startDate,
      endDate
    );

    return NextResponse.json({
      data: {
        remainingAmount: currentPeriod.remaining,
        remainingChange,
        incomeAmount: currentPeriod.income,
        incomeChange,
        expensesAmount: currentPeriod.expences,
        expensesChange,
        categories: spentByCategory,
        expencesByCategory,
        days: dailyTransactionsData,
      },
      meta: {
        currency: {
          name: targetCurrency.name,
          symbol: targetCurrency.symbol,
          id: targetCurrency.id,
        },
        prevPeriod: {
          start: lastPeriodStart.toISOString(),
          end: lastPeriodEnd.toISOString(),
        },
      },
    });
  } catch {
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
