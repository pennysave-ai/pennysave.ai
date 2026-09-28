import { db } from "@/db";
import { Prisma } from "@prisma/client";
import { getTopStores } from "@/data/stores";
import { format, addDays } from "date-fns";
import {
  getTopReceiptItems,
  getItemsTotal,
  getPriceDeltas,
} from "@/data/receiptItems";
import { type TopItemRow, ItemPriceDeltaRow } from "@/data/receiptItems";
import { type TopStoreRow } from "@/data/stores";
import {
  convertCurrency,
  convertAmountFromMilliunits,
  normalizePayee,
  parseMonthYearToUtcDate,
  convertAmountToMilliunits,
  convertPctToRatio,
} from "@/lib/utils";
import {
  computeTransactionAggregates,
  getTransactions,
} from "@/data/transactions";
import { Transaction } from "@/types";
import {
  type Finding,
  type MonthFacts,
  ruleHealth,
  topFindings,
} from "@/lib/reportFindings";
import {
  previousUtcMonth,
  reportMonthLabel,
  safeTimeZone,
} from "@/lib/reportSchedule";

/**
 * Whether a report for this user and month is already written. A report that
 * exists is never replaced.
 */
export async function reportExistsForMonth(
  userId: string,
  reportMonth: string,
): Promise<boolean> {
  const periodStart = parseMonthYearToUtcDate(reportMonth);
  const existing = await db.report.findFirst({
    select: { id: true },
    where: { userId, periodStart },
  });
  return !!existing;
}

/**
 * Writes one user's report for the month in `userData.reportMonth`, unless
 * that month already has one.
 *
 * The rows written here are the month as it stood at the time; a read
 * recomputes all of it (see `withLiveFacts`). What the stored report really
 * fixes is that the month has one, which the list and the "report ready" push
 * go by, and `Report.data.currencyId`, the currency to recompute it in.
 */
export async function upsertReport(report: { userData: any }): Promise<void> {
  try {
    const { userData } = report;
    const reportStart = parseMonthYearToUtcDate(userData.reportMonth);
    // Keyed on the month the report is about, not on when it was written: a
    // run that lands in a later month would otherwise write a second one.
    const existing = await db.report.findFirst({
      select: { id: true },
      where: { userId: userData.userId, periodStart: reportStart },
    });
    if (existing) return;

    const rows = reportRows(userData);
    await db.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          userId: userData.userId,
          periodStart: reportStart,
          health: ruleHealth(userData.facts),
          data: {
            version: 3,
            currencyId: userData.currency.id ?? null,
          },
        },
      });
      await tx.reportSnapshot.create({
        data: {
          reportId: report.id,
          currencyCode: userData.currency.code,
          currencySymbol: userData.currency.symbol,
          ...rows.snapshot,
        },
      });
      await tx.reportComparison.create({
        data: { reportId: report.id, ...rows.comparison },
      });
      if (rows.categoryBreakdowns.length) {
        await tx.reportCategoryBreakdown.createMany({
          data: rows.categoryBreakdowns.map((c) => ({
            reportId: report.id,
            ...c,
          })),
        });
      }
      if (userData.recurringCandidates.length) {
        await tx.reportRecurringCandidate.createMany({
          data: userData.recurringCandidates.map((r: any) => ({
            reportId: report.id,
            payee: r.payee,
            direction: r.direction,
            occurrences: r.occurrences,
            months: r.months,
            avgAmount: convertAmountToMilliunits(r.avgAmount),
            medianAmount: convertAmountToMilliunits(r.medianAmount),
            amountStdDev: convertAmountToMilliunits(r.amountStdDev),
            amountStdDevPct: convertPctToRatio(r.amountStdDevPct),
            lastSeenAt: new Date(r.lastSeenAt),
            last3Amounts: r.last3Amounts.map((a: any) =>
              convertAmountToMilliunits(a),
            ),
            nextExpectedWindow: r.nextExpectedWindow,
          })),
        });
      }
    });
  } catch (e) {
    console.error("Error inserting the following reports:", e);
    throw new Error("Failed to create reports");
  }
}

/**
 * Reports written in the last week whose "report ready" push hasn't gone out,
 * for users who want it, with each user's timezone so the push can be timed
 * to their morning.
 *
 * The week bounds it: a report left unsent for longer (the user turned the
 * push back on, say) is old news, not something to announce.
 * @returns {Promise}
 */
export async function getUnsendedReports(): Promise<
  {
    id: string;
    userId: string;
    data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    user: { email: string | null };
    deviceToken?: string | null;
    reportDate: Date;
    timeZone: string;
    language: string;
  }[]
> {
  try {
    const reports = await db.$queryRaw<
      {
        id: string;
        userId: string;
        data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        email: string | null;
        deviceToken: string | null;
        reportDate: Date;
        timeZone: string | null;
        language: string | null;
      }[]
    >(Prisma.sql`
      SELECT
        r.id,
        r."userId",
        r.data,
        u.email,
        u."deviceToken",
        r."periodStart" AS "reportDate",
        u.timezone AS "timeZone",
        u."preferredLanguage" AS "language"
      FROM "Report" r
      JOIN "User" u ON u.id = r."userId"
      WHERE r."sentAt" IS NULL
        AND r."createdAt" >= (now() AT TIME ZONE 'UTC') - interval '7 days'
        AND u."sendMonthlyReport" = true
    `);

    return reports.map((r) => ({
      id: r.id,
      userId: r.userId,
      data: r.data,
      user: { email: r.email },
      deviceToken: r.deviceToken,
      reportDate: r.reportDate,
      timeZone: safeTimeZone(r.timeZone),
      language: (r.language || "en").toLowerCase(),
    }));
  } catch (e) {
    console.error("Error getting the unsended reports:", e);
    throw new Error("Failed to get unsended reports");
  }
}

/**
 * "August 2026" in the user's language, for the push's `loc-args`: the app
 * supplies the sentence, the server only the month it names.
 */
export function reportMonthName(reportDate: Date | string, language: string) {
  const date = new Date(reportDate);
  try {
    return new Intl.DateTimeFormat(language, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }
}

/**
 * Mark reports as sent
 * @param {Array<string>} ids - reports IDs
 */
export const markReportsAsSent = async (ids: string[]) => {
  try {
    await db.report.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error marking reports as sent:", error);
    throw error;
  }
};

/** What `GET /api/reports` returns for each report, before live facts. */
export const reportSelect = {
  id: true,
  periodStart: true,
  health: true,
  data: true,
  createdAt: true,
  sentAt: true,
  snapshot: true,
  comparisons: true,
  categoryBreakdowns: { orderBy: { spend: "desc" } },
  recurringCandidates: { orderBy: { occurrences: "desc" } },
} satisfies Prisma.ReportSelect;

/**
 * NOOP - is not used so far
 * Get Store and ReceiptItem aggregates for a list of users and date range,
 * including price deltas vs a previous period
 * @param {Object} params
 * @param {string[]} params.userIds - list of user IDs to get data for
 * @param {Date} params.start - start date for receipts to include
 * @param {Date} params.end - end date for receipts to include
 * @param {Date} params.compareStart - start date for previous period receipts to include
 * @param {Date} params.compareEnd - end date for previous period receipts to include
 * @returns {Promise<Object>} maps of top items, top stores, total item spend, and item price deltas by user ID
 */
async function getItemAndStoreAggregates({
  userIds,
  start,
  end,
  compareStart,
  compareEnd,
}: {
  userIds: string[];
  start: Date;
  end: Date;
  compareStart: Date;
  compareEnd: Date;
}) {
  if (!userIds.length) {
    return {
      topItemsByUser: new Map<string, TopItemRow[]>(),
      topStoresByUser: new Map<string, TopStoreRow[]>(),
      itemTotalsByUser: new Map<string, number>(),
      itemPriceDeltasByUser: new Map<string, ItemPriceDeltaRow[]>(),
    };
  }

  // LINE total (milliunits)
  const effectiveLinePrice = Prisma.sql`
    CASE
      WHEN ri."price" IS NOT NULL THEN ri."price"::bigint
      WHEN ri."unitPrice" IS NOT NULL AND ri."quantity" IS NOT NULL AND ri."quantity" > 0
        THEN ROUND(ri."unitPrice"::numeric * ri."quantity"::numeric)::bigint
      ELSE NULL
    END
  `;

  // UNIT price (milliunits)
  const effectiveUnitPrice = Prisma.sql`
    CASE
      WHEN ri."normalizedUnitPrice" IS NOT NULL THEN ri."normalizedUnitPrice"::bigint
      WHEN ri."unitPrice" IS NOT NULL THEN ri."unitPrice"::bigint
      WHEN ri."price" IS NOT NULL AND ri."quantity" IS NOT NULL AND ri."quantity" > 0
        THEN ROUND(ri."price"::numeric / ri."quantity"::numeric)::bigint
      ELSE NULL
    END
  `;

  const topItems = await getTopReceiptItems({
    price: effectiveLinePrice,
    userIds,
    start,
    end,
  });

  const topStores = await getTopStores({
    price: effectiveLinePrice,
    userIds,
    start,
    end,
  });

  const itemsTotal = await getItemsTotal({
    price: effectiveLinePrice,
    userIds,
    start,
    end,
  });

  const priceDeltas = await getPriceDeltas({
    price: effectiveUnitPrice,
    userIds,
    start,
    end,
    compareStart,
    compareEnd,
  });

  const topItemsByUser = new Map<string, TopItemRow[]>();
  for (const row of topItems) {
    const arr = topItemsByUser.get(row.userId) ?? [];
    arr.push({
      ...row,
      purchaseCount: Number(row.purchaseCount), // float8 -> number
      spendMilliunits: Number(row.spendMilliunits),
      medianLinePriceMilliunits:
        row.medianLinePriceMilliunits != null
          ? Number(row.medianLinePriceMilliunits)
          : null,
      medianPriceMilliunits:
        row.medianPriceMilliunits != null
          ? Number(row.medianPriceMilliunits)
          : null,
    });
    topItemsByUser.set(row.userId, arr);
  }

  const topStoresByUser = new Map<string, TopStoreRow[]>();
  for (const row of topStores) {
    const arr = topStoresByUser.get(row.userId) ?? [];
    arr.push({ ...row, spendMilliunits: Number(row.spendMilliunits) });
    topStoresByUser.set(row.userId, arr);
  }

  const itemTotalsByUser = new Map<string, number>();
  for (const row of itemsTotal) {
    itemTotalsByUser.set(row.userId, Number(row.totalSpendMilliunits));
  }

  const itemPriceDeltasByUser = new Map<string, ItemPriceDeltaRow[]>();
  for (const row of priceDeltas) {
    const arr = itemPriceDeltasByUser.get(row.userId) ?? [];
    arr.push({
      ...row,
      medianThisMilliunits:
        row.medianThisMilliunits != null
          ? Number(row.medianThisMilliunits)
          : null,
      medianPrevMilliunits:
        row.medianPrevMilliunits != null
          ? Number(row.medianPrevMilliunits)
          : null,
      deltaMilliunits:
        row.deltaMilliunits != null ? Number(row.deltaMilliunits) : null,
    });
    itemPriceDeltasByUser.set(row.userId, arr);
  }

  return {
    topItemsByUser,
    topStoresByUser,
    itemTotalsByUser,
    itemPriceDeltasByUser,
  };
}

/**
 * Compute aggregates and deltas for a user's category spend,
 * and identify top category changes vs a previous period.
 */
function buildTopCategoryChanges(params: {
  current: Array<{ category: string; spend: number; pct: number }>;
  prev: Array<{ category: string; spend: number; pct: number }>;
  topN?: number;
}) {
  const { current, prev, topN = 5 } = params;

  const prevMap = new Map(prev.map((x) => [x.category, x.spend]));
  const categories = new Set<string>([
    ...current.map((x) => x.category),
    ...prev.map((x) => x.category),
  ]);

  return [...categories]
    .map((category) => {
      const thisSpend =
        current.find((x) => x.category === category)?.spend ?? 0;
      const prevSpend = prevMap.get(category) ?? 0;
      const delta = Number((thisSpend - prevSpend).toFixed(2));
      return { category, thisSpend, prevSpend, delta };
    })
    .filter((c) => Math.abs(c.delta) > 0.01)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, topN);
}

function toTargetCurrencyMilliunits(params: {
  amountMilliunits: number;
  fromCurrencyId: string;
  fromExchangeRate: number;
  targetCurrencyId: string;
  targetExchangeRate: number;
}) {
  const {
    amountMilliunits,
    fromCurrencyId,
    fromExchangeRate,
    targetCurrencyId,
    targetExchangeRate,
  } = params;

  if (fromCurrencyId === targetCurrencyId) return amountMilliunits;
  return convertCurrency(
    amountMilliunits,
    fromExchangeRate,
    targetExchangeRate,
  );
}

/**
 * Compute total income and expenses
 * in a target currency for a set of transactions,
 */
function computeTotalsInTargetCurrency(params: {
  transactions: Transaction[];
  targetCurrencyId: string;
  targetExchangeRate: number;
}) {
  const { transactions, targetCurrencyId, targetExchangeRate } = params;

  let income = 0;
  let expenses = 0;

  for (const t of transactions) {
    const amtTarget = toTargetCurrencyMilliunits({
      amountMilliunits: t.amount,
      fromCurrencyId: t.account.currency.id,
      fromExchangeRate: t.account.currency.exchangeRate,
      targetCurrencyId,
      targetExchangeRate,
    });
    if (amtTarget > 0) {
      income += amtTarget;
    } else {
      expenses += amtTarget;
    }
  }

  return {
    income: Math.round(income),
    expenses: Math.round(expenses),
    netFlow: Math.round(income + expenses),
  };
}

function normalizeForRecurring(s: string | null | undefined) {
  // Normalize text so notes like "NETFLIX 12345" and "NETFLIX 67890" group together.
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // drop punctuation (unicode-aware)
    .replace(/\d+/g, "#") // collapse digits
    .replace(/\s+/g, " ");
}

function median(values: number[]) {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 0 ? Math.round((v[mid - 1]! + v[mid]!) / 2) : v[mid]!;
}

function stddev(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, x) => acc + (x - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function pctChange(delta: number, prev: number) {
  // Uses absolute prev as denominator; returns null when prev is 0 or missing
  if (!prev) return null;
  return Number(((delta / Math.abs(prev)) * 100).toFixed(1));
}

/**
 * Heuristic recurring detection (transaction-based; money-precise).
 * Groups transactions by (direction + normalized descriptor) over a history window.
 *
 * Descriptor uses payee and notes:
 * - If payee exists: key includes payee, and also notes when notes adds info.
 * - If payee missing: falls back to notes.
 */
function buildRecurringCandidates(params: {
  historyTransactions: Transaction[];
  targetCurrencyId: string;
  targetExchangeRate: number;
  topN?: number;
}) {
  const {
    historyTransactions,
    targetCurrencyId,
    targetExchangeRate,
    topN = 5,
  } = params;

  const groups = new Map<
    string,
    {
      descriptor: string;
      direction: "expense" | "income";
      occurrences: number;
      months: Set<string>;
      sumAbsMilli: number;
      lastSeenAt: Date;

      // NEW: stability signals
      absAmountsMilli: number[]; // abs amounts in target currency milliunits
      lastAmountsMilli: Array<{ at: Date; absMilli: number }>; // keep a short list
    }
  >();

  for (const t of historyTransactions) {
    const payeeRaw = normalizePayee(t.payee);
    const notesRaw = normalizePayee((t as any).notes);

    const payeeKey = normalizeForRecurring(payeeRaw);
    const notesKey = normalizeForRecurring(notesRaw);

    const baseKey = payeeKey || notesKey;
    if (!baseKey) continue;

    const descriptorKey =
      payeeKey && notesKey && notesKey !== payeeKey
        ? `${payeeKey}|${notesKey}`
        : baseKey;

    const amtTarget = toTargetCurrencyMilliunits({
      amountMilliunits: t.amount,
      fromCurrencyId: t.account.currency.id,
      fromExchangeRate: t.account.currency.exchangeRate,
      targetCurrencyId,
      targetExchangeRate,
    });
    if (!amtTarget) continue;

    const direction: "expense" | "income" =
      amtTarget < 0 ? "expense" : "income";
    const key = `${direction}:${descriptorKey}`;

    const createdAt =
      t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
    const monthKey = `${createdAt.getFullYear()}-${String(
      createdAt.getMonth() + 1,
    ).padStart(2, "0")}`;

    const abs = Math.abs(amtTarget);

    const g = groups.get(key) ?? {
      descriptor: payeeRaw || notesRaw || "(unknown)",
      direction,
      occurrences: 0,
      months: new Set<string>(),
      sumAbsMilli: 0,
      lastSeenAt: createdAt,
      absAmountsMilli: [],
      lastAmountsMilli: [],
    };

    g.occurrences += 1;
    g.months.add(monthKey);
    g.sumAbsMilli += abs;

    g.absAmountsMilli.push(abs);
    g.lastAmountsMilli.push({ at: createdAt, absMilli: abs });
    // keep only a small list (we'll sort later anyway)
    if (g.lastAmountsMilli.length > 10) g.lastAmountsMilli.shift();

    if (createdAt > g.lastSeenAt) g.lastSeenAt = createdAt;

    groups.set(key, g);
  }

  return [...groups.values()]
    .filter((g) => g.months.size >= 2 || g.occurrences >= 3)
    .map((g) => {
      const avgMilli = g.occurrences
        ? Math.round(g.sumAbsMilli / g.occurrences)
        : 0;
      const medMilli = median(g.absAmountsMilli);
      const sdMilli = stddev(g.absAmountsMilli);

      const last3 = [...g.lastAmountsMilli]
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, 3)
        .map((x) => convertAmountFromMilliunits(x.absMilli));

      // Simple next expected window: ~30 days after last seen (kept as a hint, not a promise)
      const nextExpectedWindow =
        g.months.size >= 2
          ? {
              startDate: toISODateOnly(addDays(g.lastSeenAt, 25)),
              endDate: toISODateOnly(addDays(g.lastSeenAt, 35)),
            }
          : null;

      return {
        payee: g.descriptor,
        direction: g.direction,
        occurrences: g.occurrences,
        months: g.months.size,

        // Existing
        avgAmount: convertAmountFromMilliunits(avgMilli),
        lastSeenAt: toISODateOnly(g.lastSeenAt),

        // NEW: stability signals
        medianAmount: convertAmountFromMilliunits(medMilli),
        amountStdDev: Number(convertAmountFromMilliunits(sdMilli).toFixed(2)),
        amountStdDevPct:
          avgMilli > 0 ? Number(((sdMilli / avgMilli) * 100).toFixed(1)) : null,
        last3Amounts: last3,
        nextExpectedWindow,
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, topN);
}

function toISODateOnly(d: Date) {
  // Produces YYYY-MM-DD (no time component)
  return format(d, "yyyy-MM-dd");
}

/**
 * Fetch users analytics data for AI model context
 */
export async function getPrevMonthSummaries(
  users: { id: string; currencyId?: string; timeZone?: string }[],
  allCurrencies: {
    id: string;
    symbol: string;
    name: string;
    exchangeRate: number;
  }[] = [],
  /** UTC midnight on the 1st of the month to report on. */
  reportMonth: Date = previousUtcMonth(),
): Promise<any[]> {
  const { currentByUser, prevByUser, historyByUser } = await getTransactions({
    userIds: users.map((u) => u.id),
    reportMonth,
    timeZones: new Map(
      users.map((u) => [u.id, safeTimeZone(u.timeZone)] as const),
    ),
  });

  // Use pre-fetched currencies if provided, otherwise fetch from DB (direct call fallback)
  const currencyMap = new Map(
    (allCurrencies.length
      ? allCurrencies
      : await db.currency.findMany({
          select: { id: true, symbol: true, name: true, exchangeRate: true },
        })
    ).map((c) => [c.id, c]),
  );

  const usersData: any[] = [];

  for (const [userId, currentTx] of currentByUser) {
    const prevTx = prevByUser.get(userId) ?? [];
    const historyTx = historyByUser.get(userId) ?? currentTx;

    // Build currency frequency map from transactions
    const transactionsByCurrency: Record<string, { count: number }> = {};
    for (const t of currentTx) {
      const id = t.account.currency.id;
      transactionsByCurrency[id] = {
        count: (transactionsByCurrency[id]?.count ?? 0) + 1,
      };
    }

    // 1. Use user's preferred currency if set and exists in currencyMap
    // 2. Fall back to most frequent transaction currency
    // 3. Last resort: first transaction's currency
    const preferredCurrencyId = users.find((u) => u.id === userId)?.currencyId;
    const preferredCurrency = preferredCurrencyId
      ? currencyMap.get(preferredCurrencyId)
      : undefined;

    const fallbackCurrencyId =
      Object.entries(transactionsByCurrency).sort(
        (a, b) => b[1].count - a[1].count,
      )[0]?.[0] ?? currentTx[0]!.account.currency.id;

    const targetCurrencyId = preferredCurrency
      ? preferredCurrencyId!
      : fallbackCurrencyId;

    const targetCurrency =
      currencyMap.get(targetCurrencyId) ??
      currencyMap.get(currentTx[0]!.account.currency.id)!;

    usersData.push({
      userId,
      reportMonth: reportMonthLabel(reportMonth),
      // Calendar dates of the month, in the user's own timezone.
      period: {
        start: reportMonth.toISOString().slice(0, 10),
        end: new Date(
          Date.UTC(
            reportMonth.getUTCFullYear(),
            reportMonth.getUTCMonth() + 1,
            0,
          ),
        )
          .toISOString()
          .slice(0, 10),
      },
      currency: {
        id: targetCurrencyId,
        symbol: targetCurrency.symbol,
        code: targetCurrency.name,
      },
      ...summarizeMonth({
        currentTx,
        prevTx,
        historyTx,
        targetCurrencyId,
        targetExchangeRate: targetCurrency.exchangeRate,
      }),
    });
  }
  return usersData;
}

export type MonthSummary = ReturnType<typeof summarizeMonth>;

/** What `computeTransactionAggregates` calls spend with no category. */
const UNCATEGORIZED_LABEL = "Uncategorized";

/**
 * Everything a report says about one month, from that month's transactions,
 * the month before and the recurring-detection history. The monthly job runs
 * it once to write the report; `GET /api/reports` runs it again on every read,
 * so the numbers a report shows are always the transactions as they are now.
 */
export function summarizeMonth({
  currentTx,
  prevTx,
  historyTx,
  targetCurrencyId,
  targetExchangeRate,
}: {
  currentTx: Transaction[];
  prevTx: Transaction[];
  historyTx: Transaction[];
  targetCurrencyId: string;
  targetExchangeRate: number;
}) {
  const currentTotals = computeTotalsInTargetCurrency({
    transactions: currentTx,
    targetCurrencyId,
    targetExchangeRate,
  });

  // Every category and payee: findings compare categories across months,
  // and one outside the top five can still be the one that moved.
  const allAggregates = computeTransactionAggregates({
    userTransactions: currentTx,
    targetCurrencyId,
    targetExchangeRate,
    topN: Number.MAX_SAFE_INTEGER,
  });
  const transactionAggregates = {
    ...allAggregates,
    expenseByCategory: allAggregates.expenseByCategory.slice(0, 5),
    expenseByPayee: allAggregates.expenseByPayee.slice(0, 5),
    largestExpenses: allAggregates.largestExpenses.slice(0, 5),
    largestIncome: allAggregates.largestIncome.slice(0, 5),
  };

  const prevTotals = computeTotalsInTargetCurrency({
    transactions: prevTx,
    targetCurrencyId,
    targetExchangeRate,
  });

  const prevAggregates =
    prevTx.length > 0
      ? computeTransactionAggregates({
          userTransactions: prevTx,
          targetCurrencyId,
          targetExchangeRate,
          topN: Number.MAX_SAFE_INTEGER,
        })
      : null;

  const incomeReceivedThis = Number(
    convertAmountFromMilliunits(currentTotals.income).toFixed(2),
  ); // positive
  const expenseSpendThis = Number(
    Math.abs(convertAmountFromMilliunits(currentTotals.expenses)).toFixed(2),
  ); // positive
  const netFlowThis = Number(
    (incomeReceivedThis - expenseSpendThis).toFixed(2),
  ); // signed

  const incomeReceivedPrev = Number(
    convertAmountFromMilliunits(prevTotals.income).toFixed(2),
  );
  const expenseSpendPrev = Number(
    Math.abs(convertAmountFromMilliunits(prevTotals.expenses)).toFixed(2),
  );
  const netFlowPrev = Number(
    (incomeReceivedPrev - expenseSpendPrev).toFixed(2),
  );

  const hasPrev = prevTx.length > 0;

  const comparisons = {
    prevMonthAvailable: hasPrev,

    incomeReceivedDelta: hasPrev
      ? Number((incomeReceivedThis - incomeReceivedPrev).toFixed(2))
      : 0,
    incomeReceivedDeltaPct: hasPrev
      ? pctChange(incomeReceivedThis - incomeReceivedPrev, incomeReceivedPrev)
      : 0,

    expenseSpendDelta: hasPrev
      ? Number((expenseSpendThis - expenseSpendPrev).toFixed(2))
      : 0,
    expenseSpendDeltaPct: hasPrev
      ? pctChange(expenseSpendThis - expenseSpendPrev, expenseSpendPrev)
      : 0,

    netFlowDelta: hasPrev ? Number((netFlowThis - netFlowPrev).toFixed(2)) : 0,

    netFlowDeltaPct: hasPrev
      ? pctChange(netFlowThis - netFlowPrev, netFlowPrev)
      : 0,

    topCategoryChanges: prevAggregates
      ? buildTopCategoryChanges({
          current: transactionAggregates.expenseByCategory,
          prev: prevAggregates.expenseByCategory.slice(0, 5),
          topN: 5,
        })
      : [],
  };

  const recurringCandidates = buildRecurringCandidates({
    historyTransactions: historyTx,
    targetCurrencyId,
    targetExchangeRate,
    topN: 5,
  });

  const milli = convertAmountToMilliunits;
  // The aggregates file rows without a category under an English
  // "Uncategorized" label. Findings have their own kind for that spend, and a
  // category name is shown as-is, so the label must not pass as a category.
  const named = (c: { category: string }) => c.category !== UNCATEGORIZED_LABEL;
  const facts: MonthFacts = {
    income: Math.round(currentTotals.income),
    expense: Math.round(-currentTotals.expenses),
    net: Math.round(currentTotals.income + currentTotals.expenses),
    prev: hasPrev
      ? {
          income: Math.round(prevTotals.income),
          expense: Math.round(-prevTotals.expenses),
          net: Math.round(prevTotals.income + prevTotals.expenses),
        }
      : null,
    categories: allAggregates.expenseByCategory.filter(named).map((c) => ({
      name: c.category,
      spend: milli(c.spend),
    })),
    prevCategories: (prevAggregates?.expenseByCategory ?? [])
      .filter(named)
      .map((c) => ({
        name: c.category,
        spend: milli(c.spend),
      })),
    payees: allAggregates.expenseByPayee.map((p) => ({
      name: p.payee,
      spend: milli(p.spend),
    })),
    largestExpenses: transactionAggregates.largestExpenses.map((e) => ({
      payee: e.payee,
      amount: milli(e.amount),
    })),
    uncategorizedSpend: milli(allAggregates.uncategorized.spend),
    recurring: recurringCandidates.map((r) => ({
      payee: r.payee,
      direction: r.direction,
      months: r.months,
      medianAmount: milli(r.medianAmount),
    })),
  };

  return {
    totalsAbs: {
      incomeReceived: incomeReceivedThis,
      expenseSpend: expenseSpendThis,
    },
    netFlow: netFlowThis,
    transactionAggregates,
    comparisons,
    recurringCandidates,
    facts,
    dataQuality: {
      transactionCount: currentTx.length,
      expenseTransactionCount: currentTx.filter((t) => t.amount < 0).length,
      incomeTransactionCount: currentTx.filter((t) => t.amount > 0).length,
      accountCount: new Set(currentTx.map((t) => t.account.id)).size,
    },
  };
}

/**
 * The stored shape of a month — milliunits and ratios — as the report tables
 * hold it and the app reads it. One mapping for both the write and the live
 * read, so a live report can never be in different units from a stored one.
 */
export function reportRows(
  summary: Omit<MonthSummary, "facts" | "dataQuality">,
) {
  const milli = convertAmountToMilliunits;
  const ratio = (pct: number | null | undefined) => convertPctToRatio(pct ?? 0);
  const { transactionAggregates: agg, comparisons: cmp } = summary;
  return {
    snapshot: {
      incomeReceived: milli(summary.totalsAbs.incomeReceived),
      expenseSpend: milli(summary.totalsAbs.expenseSpend),
      netFlow: milli(summary.netFlow),
      expenseByPayee: agg.expenseByPayee.map((e) => ({
        ...e,
        pct: ratio(e.pct),
        spend: milli(e.spend),
      })),
      largestExpenses: agg.largestExpenses.map((e) => ({
        ...e,
        amount: milli(e.amount),
      })),
      largestIncome: agg.largestIncome.map((e) => ({
        ...e,
        amount: milli(e.amount),
      })),
      uncategorized: agg.uncategorized,
    },
    comparison: {
      prevMonthAvailable: cmp.prevMonthAvailable,
      incomeReceivedDelta: milli(cmp.incomeReceivedDelta),
      incomeReceivedDeltaPct: ratio(cmp.incomeReceivedDeltaPct),
      expenseSpendDelta: milli(cmp.expenseSpendDelta),
      expenseSpendDeltaPct: ratio(cmp.expenseSpendDeltaPct),
      netFlowDelta: milli(cmp.netFlowDelta ?? 0),
      netFlowDeltaPct: ratio(cmp.netFlowDeltaPct),
      topCategoryChanges: cmp.topCategoryChanges.map((c) => ({
        category: c.category,
        delta: milli(c.delta),
        prevSpend: milli(c.prevSpend),
        thisSpend: milli(c.thisSpend),
      })),
    },
    categoryBreakdowns: agg.expenseByCategory.map((c) => ({
      category: c.category,
      spend: milli(c.spend),
      pct: ratio(c.pct),
    })),
  };
}

type StoredReport = {
  periodStart: Date;
  health: string | null;
  data: unknown;
  snapshot: {
    currencyCode: string;
  } | null;
  comparisons: object | null;
  categoryBreakdowns: object[];
};

export type LiveFinding = Omit<Finding, "score">;

type LiveReport<R> = R & { findings: LiveFinding[] | null };

/** Reports recomputed in parallel at most this many at a time. */
const LIVE_CONCURRENCY = 4;

/**
 * Reports as the transactions stand now, not as they stood when each was
 * written.
 *
 * Each month is summarised again: its totals, comparisons, breakdowns and
 * payees replace the stored ones, in the same shape and units; `health` is
 * worked out again from those totals; and `findings` are the claims the month
 * leads with, with today's numbers. Nothing a report shows is kept from when
 * it was written, so none of it can disagree with the rest.
 *
 * A month that can't be recomputed is returned as stored, with `findings`
 * null, rather than failing the whole list.
 */
export async function withLiveFacts<R extends StoredReport>(
  userId: string,
  reports: R[],
): Promise<Array<LiveReport<R>>> {
  if (!reports.length) return [];
  const [currencies, user] = await Promise.all([
    db.currency.findMany({
      select: { id: true, name: true, exchangeRate: true },
    }),
    // Months are cut in the viewer's timezone, as the monthly job cuts them.
    db.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);
  const timeZone = safeTimeZone(user?.timezone);
  const byId = new Map(currencies.map((c) => [c.id, c]));
  // Reports written before `currencyId` was stored only have the snapshot's
  // `currencyCode`, which holds the currency's `name` ("USD", "EUR").
  const byName = new Map(currencies.map((c) => [c.name, c]));

  const out: Array<LiveReport<R>> = [];
  for (let i = 0; i < reports.length; i += LIVE_CONCURRENCY) {
    const batch = reports.slice(i, i + LIVE_CONCURRENCY);
    out.push(
      ...(await Promise.all(
        batch.map(async (report) => {
          const currency =
            byId.get(storedCurrencyId(report) ?? "") ??
            (report.snapshot
              ? byName.get(report.snapshot.currencyCode)
              : undefined);
          if (!currency || !report.snapshot) {
            return { ...report, findings: null };
          }
          try {
            return await liveReport(userId, timeZone, report, currency);
          } catch (e) {
            console.error(
              `Could not recompute report for ${report.periodStart.toISOString()}:`,
              e,
            );
            return { ...report, findings: null };
          }
        }),
      )),
    );
  }
  return out;
}

async function liveReport<R extends StoredReport>(
  userId: string,
  timeZone: string,
  report: R,
  currency: { id: string; exchangeRate: number },
): Promise<LiveReport<R>> {
  const { currentByUser, prevByUser, historyByUser } = await getTransactions({
    userIds: [userId],
    reportMonth: report.periodStart,
    timeZones: new Map([[userId, timeZone]]),
  });
  const currentTx = currentByUser.get(userId) ?? [];
  const summary = summarizeMonth({
    currentTx,
    prevTx: prevByUser.get(userId) ?? [],
    historyTx: historyByUser.get(userId) ?? currentTx,
    targetCurrencyId: currency.id,
    targetExchangeRate: currency.exchangeRate,
  });
  const rows = reportRows(summary);

  return {
    ...report,
    health: ruleHealth(summary.facts),
    snapshot: { ...report.snapshot, ...rows.snapshot },
    comparisons: report.comparisons
      ? { ...report.comparisons, ...rows.comparison }
      : report.comparisons,
    // Keyed by category name so the same category has the same id in every
    // month — the app pairs a month's category with the one before by id.
    categoryBreakdowns: rows.categoryBreakdowns.map((c) => ({
      id: c.category,
      ...c,
    })),
    findings: topFindings(summary.facts).map(({ score: _score, ...f }) => f),
  };
}

/** `Report.data.currencyId`; reports from before it was stored have none. */
function storedCurrencyId(report: StoredReport): string | undefined {
  const data = report.data;
  if (!data || typeof data !== "object") return undefined;
  const id = (data as { currencyId?: unknown }).currencyId;
  return typeof id === "string" ? id : undefined;
}
