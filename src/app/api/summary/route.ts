import { NextRequest, NextResponse } from "next/server";
import { subDays, parse, differenceInDays } from "date-fns";
import { db } from "@/db";
import { auth } from "@/auth";

import { calculatePercentageChange, fillMissingDates } from "@/lib/utils";

/**
 * Fetches financial data (total income and expenses) for a user within a specified date range.
 *
 * @param {string} userId - The ID of the user.
 * @param {Date} startDate - The start date of the period.
 * @param {Date} endDate - The end date of the period.
 * @param {string | null} accountId - Optional account ID to filter transactions.
 * @returns {Promise<{ totalIncome: number; totalExpenses: number; netIncome: number }>} - Aggregated financial data.
 */
const fetchFinancialData = async (
  userId: string = "",
  startDate: Date,
  endDate: Date,
  accountId: string | null
) => {
  try {
    const query = `
      SELECT
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS "totalIncome",
        SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) AS "totalExpenses"
      FROM
        "Transaction"
      WHERE
        "createdAt" BETWEEN $1 AND $2
        AND "accountId" IN (
          SELECT "id" FROM "UserAccount" WHERE "userId" = $3
        )
        ${accountId ? `AND "accountId" = $4` : ""}
    `;

    const params = accountId
      ? [startDate, endDate, userId, accountId]
      : [startDate, endDate, userId];

    const result = await db.$queryRawUnsafe<
      { totalIncome: number; totalExpenses: number }[]
    >(query, ...params);
    const income = Number(result[0].totalIncome) || 0;
    const expences = Number(result[0].totalExpenses) || 0;
    const remaining = income + expences;
    return { income, expences, remaining };
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
 * @returns {Promise<Array<{ categoryId: string; categoryName: string; totalSpending: number }>>}
 */
const fetchSpendingByCategory = async (
  userId: string = "",
  startDate: Date,
  endDate: Date,
  accountId: string | null
): Promise<Array<{ id: string; name: string; totalSpending: number }>> => {
  try {
    const query = `
        SELECT
          "Transaction"."categoryId",
          "Category"."name" AS "categoryName",
          COALESCE(SUM(-"Transaction"."amount"), 0) AS "totalSpending"
        FROM
          "Transaction"
        INNER JOIN
          "Category" ON "Transaction"."categoryId" = "Category"."id"
        WHERE
          "Transaction"."createdAt" BETWEEN $1 AND $2
          AND "Transaction"."amount" < 0
          AND "Transaction"."accountId" IN (
            SELECT "id" FROM "UserAccount" WHERE "userId" = $3
          )
          ${accountId ? `AND "Transaction"."accountId" = $4` : ""}
        GROUP BY
          "Transaction"."categoryId",
          "Category"."name"
        ORDER BY
          "totalSpending" DESC;
      `;

    const params = accountId
      ? [startDate, endDate, userId, accountId]
      : [startDate, endDate, userId];

    const result = await db.$queryRawUnsafe<
      { categoryId: string; categoryName: string; totalSpending: number }[]
    >(query, ...params);
    const formattedResult = result.map((item) => ({
      id: item.categoryId,
      name: item.categoryName,
      totalSpending: Number(item.totalSpending) || 0,
    }));
    return formattedResult;
  } catch (error: any) {
    console.error("Error fetching spending by category:", error);
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
 * @returns {Promise<Array<{ date: string; income: number, expences: number }>>}
 */
const dailyData = async (
  userId: string = "",
  startDate: Date,
  endDate: Date,
  accountId: string | null
) => {
  try {
    const query = `
        SELECT
        DATE_TRUNC('day', "createdAt")::date AS "date",
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)::FLOAT, 0) AS "income",
        COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)::FLOAT, 0) AS "expences"
        FROM
            "Transaction"
        WHERE
            "createdAt" BETWEEN $1 AND $2
            AND "accountId" IN (
            SELECT "id" FROM "UserAccount" WHERE "userId" = $3
            )
            ${accountId ? `AND "accountId" = $4` : ""}
        GROUP BY
            "date"
        ORDER BY
            "date" ASC;
        `;

    const params = accountId
      ? [startDate, endDate, userId, accountId]
      : [startDate, endDate, userId];

    const result = await db.$queryRawUnsafe<
      { date: string; income: number; expences: number }[]
    >(query, ...params);
    return result.map((item) => ({
      date: item.date,
      income: Number(item.income) || 0,
      expences: Number(item.expences) || 0,
    }));
  } catch (error: any) {
    console.error("Error fetching daily data:", error);
    throw new Error("Failed to fetch daily data.");
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

  const to = searchParams.get("to");
  const from = searchParams.get("from");
  const accountId = searchParams.get("accountId");
  const defaultTo = new Date();
  const defaultFrom = subDays(defaultTo, 30);

  const startDate = from ? parse(from, "yyyy-MM-dd", new Date()) : defaultFrom;
  const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;
  const periodLength = differenceInDays(endDate, startDate) + 1;
  const lastPeriodStart = subDays(startDate, periodLength);
  const lastPeriodEnd = subDays(endDate, periodLength);
  try {
    const currentPeriod = await fetchFinancialData(
      user.id,
      startDate,
      endDate,
      accountId
    );
    const lastPeriod = await fetchFinancialData(
      user.id,
      lastPeriodStart,
      lastPeriodEnd,
      accountId
    );

    const spendingByCategory = await fetchSpendingByCategory(
      user.id,
      startDate,
      endDate,
      accountId || null
    );

    const dailyTransactions = await dailyData(
      user.id,
      startDate,
      endDate,
      accountId
    );
    const topCategories = spendingByCategory.slice(0, TOP_CATEGORIES);
    const otherCategories = spendingByCategory.slice(TOP_CATEGORIES);
    const otherCategoriesTotal = otherCategories.reduce(
      (sum, category) => sum + category.totalSpending,
      0
    );
    const spentByCategory = topCategories;
    if (otherCategories.length > 0) {
      spentByCategory.push({
        id: "other",
        name: "Other",
        totalSpending: otherCategoriesTotal,
      });
    }
    const incomeChange = calculatePercentageChange(
      currentPeriod.income,
      lastPeriod.income
    );
    const expensesChange = calculatePercentageChange(
      currentPeriod.expences,
      lastPeriod.expences
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

    return NextResponse.json({
      data: {
        remainingAmount: currentPeriod.remaining,
        remainingChange,
        incomeAmount: currentPeriod.income,
        incomeChange,
        expensesAmount: currentPeriod.expences,
        expensesChange,
        categories: spentByCategory,
        days: dailyTransactionsData,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
