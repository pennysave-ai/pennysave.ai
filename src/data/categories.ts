import { v4 as uuid } from "uuid";
import { Prisma } from "@prisma/client";
import { format, startOfMonth, subMonths } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { db } from "@/db";
import { categorySchema } from "@/schemas";
import { isValidIanaTimeZone } from "@/lib/utils";
import { Category, CategoryHistoryEntry, CategoryMonthTotal } from "@/types";
import type { CategoryResolver } from "@/data/categoryMappings";

// Return the same fields for GET/POST/PUT requests
export const categorySelect = {
  id: true,
  name: true,
  description: true,
  icon: true,
  archivedAt: true,
  owner: {
    select: { id: true, name: true, image: true, email: true, role: true },
  },
};

/**
 * Get the list of user categories
 * @param userId - User ID
 * @returns {Promise<Category[]>}
 */
export async function getUserCategories(userId?: string): Promise<Category[]> {
  return db.category.findMany({
    where: { userId, archivedAt: null },
    select: categorySelect,
  });
}

/** How many complete calendar months of history the API returns, oldest first. */
export const CATEGORY_HISTORY_MONTHS = 5;

type CategoryHistoryRow = {
  categoryId: string | null;
  categoryName: string | null;
  ownerId: string | null;
  archivedAt: Date | null;
  /** The viewer's own pick for these rows (TransactionPlacement), if any. */
  placedCategoryId: string | null;
  month: string;
  currencyId: string;
  amount: bigint;
};

/**
 * The complete calendar months immediately before the current one, as seen from
 * `timeZone`. The current month is deliberately left out: the client draws that
 * bar from the transactions it already holds, so anything the server sent for it
 * would be stale the moment someone adds a row.
 * @param {String} timeZone - IANA timezone id the months are cut on
 * @returns {{months: string[], start: Date, end: Date}} - "YYYY-MM" labels oldest
 * first, plus the half-open [start, end) instant range they cover
 */
function getHistoryWindow(timeZone: string) {
  const currentMonthStart = startOfMonth(toZonedTime(new Date(), timeZone));
  const months: string[] = [];
  for (let i = CATEGORY_HISTORY_MONTHS; i >= 1; i--) {
    months.push(format(subMonths(currentMonthStart, i), "yyyy-MM"));
  }
  return {
    months,
    start: fromZonedTime(
      subMonths(currentMonthStart, CATEGORY_HISTORY_MONTHS),
      timeZone,
    ),
    end: fromZonedTime(currentMonthStart, timeZone),
  };
}

/**
 * Get the per-month, per-currency net totals for a set of categories.
 *
 * Covers every account the user can see, owned and shared, the same set
 * /api/transactions returns without an accountId. Partner rows count under the
 * category `resolver` maps them to, exactly as they do in the transaction list;
 * unmapped partner rows are left out. Totals are the signed net of
 * every transaction in that category + month + currency, not a spend-only sum,
 * so income categories and refunds are reported truthfully. Amounts are left in
 * the account's own currency — the client folds them into its base currency with
 * the same function it uses for the live current-month bar.
 * @param {String} userId - User ID
 * @param {String[]} categoryIds - Categories to report on
 * @param {String} timezone - The user's stored IANA timezone; invalid or missing falls back to UTC
 * @param {CategoryResolver} resolver - The user's category resolver
 * @returns {Promise<Map<string, CategoryHistoryEntry[]>>} - History keyed by
 * category ID, with an entry for every requested category and every month in the
 * window, months with no activity carrying an empty `totals`
 */
export async function getCategoriesHistory(
  userId: string,
  categoryIds: string[],
  timezone: string | null | undefined,
  resolver: CategoryResolver,
): Promise<Map<string, CategoryHistoryEntry[]>> {
  const timeZone = timezone && isValidIanaTimeZone(timezone) ? timezone : "UTC";
  const { months, start, end } = getHistoryWindow(timeZone);

  const rows = categoryIds.length
    ? await db.$queryRaw<CategoryHistoryRow[]>(Prisma.sql`
        SELECT
          t."categoryId" AS "categoryId",
          c."name" AS "categoryName",
          c."userId" AS "ownerId",
          c."archivedAt" AS "archivedAt",
          p."categoryId" AS "placedCategoryId",
          to_char(
            date_trunc(
              'month',
              t."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}
            ),
            'YYYY-MM'
          ) AS "month",
          ua."currencyId" AS "currencyId",
          SUM(t."amount")::bigint AS "amount"
        FROM "Transaction" t
        LEFT JOIN "Category" c ON c."id" = t."categoryId"
        LEFT JOIN "TransactionPlacement" p
          ON p."transactionId" = t."id" AND p."viewerId" = ${userId}
        JOIN "UserAccount" ua ON ua."id" = t."accountId"
        JOIN "UserAccountAccess" uaa
          ON uaa."userAccountId" = ua."id" AND uaa."userId" = ${userId}
        WHERE (
            t."categoryId" IN (${Prisma.join(categoryIds)})
            OR c."userId" <> ${userId}
            OR p."categoryId" IS NOT NULL
          )
          AND t."createdAt" >= ${start}
          AND t."createdAt" < ${end}
        GROUP BY 1, 2, 3, 4, 5, 6, 7
        ORDER BY 1, 6, 7
      `)
    : [];

  // Keyed by category + month so the dense build below is a lookup per bar.
  // Several source categories can resolve to one of the user's, so totals for
  // the same currency are summed rather than appended.
  const requested = new Set(categoryIds);
  const totalsByMonth = new Map<string, CategoryMonthTotal[]>();
  for (const row of rows) {
    // Rows with a pick are grouped by it, so resolving the pick first is the
    // same as resolving each of them.
    const picked = row.placedCategoryId
      ? resolver.categories.find((c) => c.id === row.placedCategoryId)
      : undefined;
    const resolved =
      picked ??
      (row.categoryId && row.categoryName !== null && row.ownerId
        ? resolver.resolve({
            id: row.categoryId,
            name: row.categoryName,
            owner: { id: row.ownerId },
            archivedAt: row.archivedAt,
          })
        : null);
    if (!resolved || !requested.has(resolved.id)) continue;
    const key = `${resolved.id}:${row.month}`;
    const amount = Number(row.amount);
    const existing = totalsByMonth.get(key);
    const sameCurrency = existing?.find(
      (total) => total.currencyId === row.currencyId,
    );
    if (sameCurrency) {
      sameCurrency.amount += amount;
    } else if (existing) {
      existing.push({ currencyId: row.currencyId, amount });
    } else {
      totalsByMonth.set(key, [{ currencyId: row.currencyId, amount }]);
    }
  }

  return new Map(
    categoryIds.map((categoryId) => [
      categoryId,
      months.map((month) => ({
        month,
        totals: totalsByMonth.get(`${categoryId}:${month}`) ?? [],
      })),
    ]),
  );
}

/**
 * Get categories number
 * @param userId - User ID
 * @returns {Promise<number>}
 */
export async function getCategoriesCount(userId: string): Promise<number> {
  return await db.category.count({ where: { userId, archivedAt: null } });
}

/**
 * Creates a new category
 * @param {String} name - Category name
 * @param {String} userId - User ID
 * @param {String} description - Category description
 * @returns {Promise<Category>} - Promise object represents the category data
 * @throws {Error} - If the category creation fails
 */
export async function createCategory(
  name: string,
  userId: string,
  description?: string,
  icon?: string,
): Promise<Category> {
  const validationResult = categorySchema.safeParse({
    name,
  });
  if (!validationResult.success) {
    throw new Error("Bad Request");
  }
  return await db.category.create({
    data: {
      id: uuid(),
      name,
      userId,
      description,
      icon,
    },
    select: categorySelect,
  });
}
/**
 * Delete user categories. They are archived rather than removed: for the owner
 * they are gone and their rows read as uncategorized, but a partner's mapping
 * or pick for those rows keeps working (see CategoryResolver).
 * @param {String[]} ids - Array of category Id's
 * @param {String} userId - User ID
 * @returns {Promise<{count: number}>} - How many were deleted
 * @throws {Error} - If the category deletion fails
 */
export async function deleteCategories(ids: string[], userId: string) {
  return db.category.updateMany({
    where: { id: { in: ids }, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
}

/**
 * Update user category
 * @param {String} id - Category ID
 * @param {String} userId - User ID
 * @param {String} name - Category Name
 * @param {String} description - Category Description
 * @returns {Promise<{id: string, name: string}>} - Category data
 * @throws {Error} - If the category update fails
 */
export async function updateCategory(
  id: string,
  userId: string,
  name: string,
  description?: string,
  icon?: string,
): Promise<Category> {
  return await db.category.update({
    where: { id, userId, archivedAt: null },
    data: {
      name,
      description,
      icon,
    },
    select: categorySelect,
  });
}
