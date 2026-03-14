import { db } from "@/db";
import { Prisma } from "@prisma/client";

export type TopItemRow = {
  userId: string;
  canonicalItemId: string | null;
  name: string;
  lineCount: number; // number of ReceiptItem rows (lines)
  purchaseCount: number; // units purchased (sum(quantity), fallback 1 per line)
  spendMilliunits: number; // sum of line totals
  medianLinePriceMilliunits: number | null; // median of line totals
  medianPriceMilliunits: number | null; // median UNIT price (kept name for compatibility)
};

export type ItemSpendTotalRow = {
  userId: string;
  totalSpendMilliunits: number;
};

export type ItemPriceDeltaRow = {
  userId: string;
  canonicalItemId: string | null;
  name: string;
  medianThisMilliunits: number | null;
  medianPrevMilliunits: number | null;
  deltaMilliunits: number | null;
};

/**
 * NOOP - is not used so far
 * Returns each user's top receipt items (by spend) within a date range.
 * Join ReceiptItem -> Receipt -> UserAccountAccess to attribute receipt items to the correct user.
 * Aggregate per (userId, canonicalItemId) to get:
 *    - total spend on that item
 *    - number of lines for that item
 *    - total quantity purchased for that item
 *    - median line price and median unit price for that item
 * Rank items per user and keep only the top N.
 * @param {Object} params
 * @param {Prisma.Sql} params.price - SQL expression for the price to sum
 * @param {Array<string>} params.userIds - list of user IDs to include
 * @param {Date} params.start - start date for receipts to include
 * @param {Date} params.end - end date for receipts to include
 * @returns {Promise<Array<TopItemRow>>} list of top receipt items per user with spend and counts
 */
export async function getTopReceiptItems({
  price,
  userIds,
  start,
  end,
}: {
  price: Prisma.Sql;
  userIds: string[];
  start: Date;
  end: Date;
}) {
  try {
    const TOP_RECEIPT_ITEMS_LIMIT = 10;
    return await db.$queryRaw<TopItemRow[]>(Prisma.sql`
        WITH item_spend AS (
          SELECT
            uaa."userId" AS "userId",
            ri."canonicalItemId" AS "canonicalItemId",
            COALESCE(ci."canonicalName", ri."rawName") AS "name",
            COUNT(*)::int AS "lineCount",
            SUM(
              CASE
                WHEN ri."quantity" IS NOT NULL AND ri."quantity" > 0 THEN ri."quantity"
                ELSE 1
              END
            )::float8 AS "purchaseCount",
            SUM(${price})::bigint AS "spendMilliunits",
            percentile_cont(0.5) WITHIN GROUP (ORDER BY ${price})::bigint AS "medianLinePriceMilliunits",
            percentile_cont(0.5) WITHIN GROUP (ORDER BY ${price})::bigint AS "medianPriceMilliunits"
          FROM "ReceiptItem" ri
          JOIN "Receipt" r ON r."id" = ri."receiptId"
          JOIN "UserAccountAccess" uaa ON uaa."userAccountId" = r."accountId"
          LEFT JOIN "CanonicalItem" ci ON ci."id" = ri."canonicalItemId"
          WHERE uaa."userId" IN (${Prisma.join(userIds)})
            AND COALESCE(r."purchasedAt", r."createdAt") >= ${start}
            AND COALESCE(r."purchasedAt", r."createdAt") <= ${end}
            AND ${price} IS NOT NULL
          GROUP BY uaa."userId", ri."canonicalItemId", COALESCE(ci."canonicalName", ri."rawName")
        ),
        ranked AS (
          SELECT
            *,
            ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "spendMilliunits" DESC) AS rn
          FROM item_spend
        )
        SELECT
          "userId",
          "canonicalItemId",
          "name",
          "lineCount",
          "purchaseCount",
          "spendMilliunits",
          "medianLinePriceMilliunits",
          "medianPriceMilliunits"
        FROM ranked
        WHERE rn <= ${TOP_RECEIPT_ITEMS_LIMIT}
        ORDER BY "userId", "spendMilliunits" DESC
      `);
  } catch (e) {
    console.error("Error fetching top receipt items:", e);
    throw new Error("Failed to fetch top receipt items");
  }
}

/**
 * NOOP - is not used so far
 * * Returns total receipt-item spend per user in a date range.
 * Join ReceiptItem -> Receipt -> UserAccountAccess to attribute receipt items to the correct user.
 * Sum the provided price expression across all receipt items for each user.
 * Used to calculate percentage of top items spend out of total receipt spend for the monthly report.
 * @param {Object} params
 * @param {Prisma.Sql} params.price - SQL expression for the price to sum
 * @param {Array<string>} params.userIds - list of user IDs to include
 * @param {Date} params.start - start date for receipts to include
 * @param {Date} params.end - end date for receipts to include
 * @returns {Promise<Array<ItemSpendTotalRow>>} total spend on receipt items per user
 */
export async function getItemsTotal({
  price,
  userIds,
  start,
  end,
}: {
  price: Prisma.Sql;
  userIds: string[];
  start: Date;
  end: Date;
}) {
  try {
    return await db.$queryRaw<ItemSpendTotalRow[]>(Prisma.sql`
        SELECT
          uaa."userId" AS "userId",
          SUM(${price})::bigint AS "totalSpendMilliunits"
        FROM "ReceiptItem" ri
        JOIN "Receipt" r ON r."id" = ri."receiptId"
        JOIN "UserAccountAccess" uaa ON uaa."userAccountId" = r."accountId"
        WHERE uaa."userId" IN (${Prisma.join(userIds)})
          AND COALESCE(r."purchasedAt", r."createdAt") >= ${start}
          AND COALESCE(r."purchasedAt", r."createdAt") <= ${end}
          AND ${price} IS NOT NULL
        GROUP BY uaa."userId"
      `);
  } catch (e) {
    console.error("Error fetching total spend on receipt items:", e);
    throw new Error("Failed to fetch total spend on receipt items");
  }
}

/**
 * NOOP - is not used so far
 * Returns price changes for receipt items between two date ranges.
 * Join ReceiptItem -> Receipt -> UserAccountAccess to attribute receipt items to the correct user.
 * For each (user, canonicalItemId) combination, calculate the median unit price in each date range and the difference between them.
 * Used to identify significant price changes for items in the monthly report.
 * @param {Object} params
 * @param {Prisma.Sql} params.price - SQL expression for the price to compare
 * @param {Array<string>} params.userIds - list of user IDs to include
 * @param {Date} params.start - start date for current period receipts to include
 * @param {Date} params.end - end date for current period receipts to include
 * @param {Date} params.compareStart - start date for previous period receipts to include
 * @param {Date} params.compareEnd - end date for previous period receipts to include
 * @returns {Promise<Array<ItemPriceDeltaRow>>} price changes for receipt items per user
 */
export async function getPriceDeltas({
  price,
  userIds,
  start,
  end,
  compareStart,
  compareEnd,
}: {
  price: Prisma.Sql;
  userIds: string[];
  start: Date;
  end: Date;
  compareStart: Date;
  compareEnd: Date;
}) {
  try {
    return await db.$queryRaw<ItemPriceDeltaRow[]>(Prisma.sql`
        WITH cur AS (
          SELECT
            uaa."userId" AS "userId",
            ri."canonicalItemId" AS "canonicalItemId",
            COALESCE(ci."canonicalName", ri."rawName") AS "name",
            percentile_cont(0.5) WITHIN GROUP (ORDER BY ${price})::bigint AS "medianThisMilliunits"
          FROM "ReceiptItem" ri
          JOIN "Receipt" r ON r."id" = ri."receiptId"
          JOIN "UserAccountAccess" uaa ON uaa."userAccountId" = r."accountId"
          LEFT JOIN "CanonicalItem" ci ON ci."id" = ri."canonicalItemId"
          WHERE uaa."userId" IN (${Prisma.join(userIds)})
            AND COALESCE(r."purchasedAt", r."createdAt") >= ${start}
            AND COALESCE(r."purchasedAt", r."createdAt") <= ${end}
            AND ${price} IS NOT NULL
          GROUP BY uaa."userId", ri."canonicalItemId", COALESCE(ci."canonicalName", ri."rawName")
        ),
        prev AS (
          SELECT
            uaa."userId" AS "userId",
            ri."canonicalItemId" AS "canonicalItemId",
            COALESCE(ci."canonicalName", ri."rawName") AS "name",
            percentile_cont(0.5) WITHIN GROUP (ORDER BY ${price})::bigint AS "medianPrevMilliunits"
          FROM "ReceiptItem" ri
          JOIN "Receipt" r ON r."id" = ri."receiptId"
          JOIN "UserAccountAccess" uaa ON uaa."userAccountId" = r."accountId"
          LEFT JOIN "CanonicalItem" ci ON ci."id" = ri."canonicalItemId"
          WHERE uaa."userId" IN (${Prisma.join(userIds)})
            AND COALESCE(r."purchasedAt", r."createdAt") >= ${compareStart}
            AND COALESCE(r."purchasedAt", r."createdAt") <= ${compareEnd}
            AND ${price} IS NOT NULL
          GROUP BY uaa."userId", ri."canonicalItemId", COALESCE(ci."canonicalName", ri."rawName")
        )
        SELECT
          cur."userId",
          cur."canonicalItemId",
          cur."name",
          cur."medianThisMilliunits",
          prev."medianPrevMilliunits",
          (cur."medianThisMilliunits" - prev."medianPrevMilliunits")::bigint AS "deltaMilliunits"
        FROM cur
        JOIN prev
          ON prev."userId" = cur."userId"
         AND (prev."canonicalItemId" IS NOT DISTINCT FROM cur."canonicalItemId")
         AND prev."name" = cur."name"
        ORDER BY cur."userId", (cur."medianThisMilliunits" - prev."medianPrevMilliunits") DESC
      `);
  } catch (e) {
    console.error("Error fetching price deltas on receipt items:", e);
    throw new Error("Failed to fetch price deltas on receipt items");
  }
}
