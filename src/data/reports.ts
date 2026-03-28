import { db } from "@/db";
import { Prisma } from "@prisma/client";
import { getTopStores } from "@/data/stores";
import { format, startOfMonth, endOfMonth, subMonths, addDays } from "date-fns";
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

export type MonthlyReportLLMResponse = {
  insights: string;
  income_analysis: string;
  expense_analysis: string;
  health: "green" | "yellow" | "red";
  health_analysis: string;
  blocks?: Array<{
    id:
      | "overview"
      | "month_over_month"
      | "categories"
      | "recurring"
      | "tips"
      | "limitations";
    title: string;
    bullets: string[];
  }>;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Bulk upsert reports into the database
 * @param reports
 * @returns {Promise<void>}
 */
export async function upsertReport(report: any): Promise<void> {
  try {
    // Check if the reports are already exists
    // for the current month and user
    const { llmResponse, userData } = report;
    const existingReports = await db.report.findMany({
      select: {
        userId: true,
      },
      where: {
        userId: {
          in: [userData.userId],
        },
        createdAt: {
          gte: startOfMonth(new Date()),
          lte: endOfMonth(new Date()),
        },
      },
    });
    if (!existingReports.length) {
      const reportStart = parseMonthYearToUtcDate(userData.reportMonth);
      // Where you create reports, use a transaction to insert everything atomically:
      const { health, ...rest } = llmResponse;
      await db.$transaction(async (tx) => {
        const report = await tx.report.create({
          data: {
            userId: userData.userId,
            periodStart: reportStart,
            health,
            data: rest,
          },
        });
        await tx.reportSnapshot.create({
          data: {
            reportId: report.id,
            currencyCode: userData.currency.code,
            currencySymbol: userData.currency.symbol,
            incomeReceived: convertAmountToMilliunits(
              userData.totalsAbs.incomeReceived,
            ),
            expenseSpend: convertAmountToMilliunits(
              userData.totalsAbs.expenseSpend,
            ),
            netFlow: convertAmountToMilliunits(userData.netFlow),
            expenseByPayee: userData.transactionAggregates.expenseByPayee.map(
              (e: any) => ({
                ...e,
                pct: convertPctToRatio(e.pct),
                spend: convertAmountToMilliunits(e.spend),
              }),
            ),
            largestExpenses: userData.transactionAggregates.largestExpenses.map(
              (e: any) => ({
                ...e,
                amount: convertAmountToMilliunits(e.amount),
              }),
            ),
            largestIncome: userData.transactionAggregates.largestIncome.map(
              (e: any) => ({
                ...e,
                amount: convertAmountToMilliunits(e.amount),
              }),
            ),
            uncategorized: userData.transactionAggregates.uncategorized,
          },
        });
        await tx.reportComparison.create({
          data: {
            reportId: report.id,
            prevMonthAvailable: userData.comparisons.prevMonthAvailable,
            incomeReceivedDelta: convertAmountToMilliunits(
              userData.comparisons.incomeReceivedDelta,
            ),
            incomeReceivedDeltaPct: convertPctToRatio(
              userData.comparisons.incomeReceivedDeltaPct,
            ),
            expenseSpendDelta: convertAmountToMilliunits(
              userData.comparisons.expenseSpendDelta,
            ),
            expenseSpendDeltaPct: convertPctToRatio(
              userData.comparisons.expenseSpendDeltaPct,
            ),
            netFlowDelta: convertAmountToMilliunits(
              userData.comparisons.netFlowDelta ?? 0,
            ),
            netFlowDeltaPct: convertPctToRatio(
              userData.comparisons.netFlowDeltaPct,
            ),
            topCategoryChanges: userData.comparisons.topCategoryChanges.map(
              (c: any) => ({
                category: c.category,
                delta: convertAmountToMilliunits(c.delta),
                prevSpend: convertAmountToMilliunits(c.prevSpend),
                thisSpend: convertAmountToMilliunits(c.thisSpend),
              }),
            ),
          },
        });
        if (userData.transactionAggregates.expenseByCategory.length) {
          await tx.reportCategoryBreakdown.createMany({
            data: userData.transactionAggregates.expenseByCategory.map(
              (c: any) => ({
                reportId: report.id,
                category: c.category,
                spend: convertAmountToMilliunits(c.spend),
                pct: convertPctToRatio(c.pct),
              }),
            ),
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
    }
  } catch (e) {
    console.error("Error inserting the following reports:", e);
    throw new Error("Failed to create reports");
  }
}

/**
 * Get the created and unsended reports for the current month
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
  }[]
> {
  try {
    const HOUR_TO_SEND = parseInt(process.env.REPORT_SENT_HOUR || "9", 10);
    console.log(
      `Getting unsended reports for hour ${HOUR_TO_SEND} (user's local time)`,
    );
    const reports = await db.$queryRaw<
      {
        id: string;
        userId: string;
        data: any;
        email: string | null;
        deviceToken: string | null;
        reportDate: Date;
      }[]
    >(Prisma.sql`
      SELECT
        r.id,
        r."userId",
        r.data,
        u.email,
        u."deviceToken",
        r."periodStart" AS "reportDate"
      FROM "Report" r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN pg_timezone_names p ON p.name = u.timezone
      WHERE r."sentAt" IS NULL
        -- current month (UTC). If you want "current month per user", that's a different filter.
        AND r."createdAt" >= date_trunc('month', now())
        AND r."createdAt" <  (date_trunc('month', now()) + interval '1 month')
        -- only users whose local time is HOUR_TO_SEND:xx right now
        AND EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(p.name, 'UTC'))) = ${HOUR_TO_SEND}
    `);

    console.log(
      `Found ${reports.length} unsended reports for hour ${HOUR_TO_SEND}`,
    );

    return reports.map((r) => ({
      id: r.id,
      userId: r.userId,
      data: r.data,
      user: { email: r.email },
      deviceToken: r.deviceToken,
      reportDate: r.reportDate,
    }));
  } catch (e) {
    console.error("Error getting the unsended reports:", e);
    throw new Error("Failed to get unsended reports");
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

/**
 * Build a prompt for the LLM based on the provided facts pack,
 * following strict instructions for output format and content.
 */
export function buildLLMPrompt(factsPack: any): ChatMessage[] {
  const language = factsPack.language ?? "en";

  const languageMap: Record<string, string> = {
    en: "English",
    de: "German",
    fr: "French",
    es: "Spanish",
  };

  const languageName = languageMap[language] ?? "English";

  const userContent = [
    "Return ONLY a valid JSON object. No Markdown. No greeting. No sign-off. No extra text.",
    "You must follow this JSON shape (keys exactly):",
    `{`,
    `  "insights": string,`,
    `  "income_analysis": string,`,
    `  "expense_analysis": string,`,
    `  "health": "green"|"yellow"|"red",`,
    `  "health_analysis": string,`,
    `}`,
    "",
    "Rules:",
    `- Write ALL text fields (insights, income_analysis, expense_analysis, health_analysis) in ${languageName}.`,
    "- Use totalsAbs.expenseSpend for 'spending' and totalsAbs.incomeReceived for 'income'.",
    "- Use netFlow (signed) for surplus/deficit wording.",
    "- Use comparisons.expenseSpendDelta and comparisons.incomeReceivedDelta for month-over-month changes when prevMonthAvailable is true.",
    "- IMPORTANT: Interpret comparisons.netFlowDeltaPct sign as trend: negative => worse (net flow decreased), positive => better (net flow increased).",
    "- If a percentage is null, do not mention a percent change.",
    "- Do NOT recommend external tools or methods (no apps, no notebooks, no spreadsheets, no 'track your spending' advice).",
    "- Tips must be action-oriented and based on the provided aggregates (categories/payees/recurring), not generic tracking advice.",
    "- Do NOT invent transactions, stores, prices, or savings opportunities.",
    "- Do NOT include an expenses breakdown (but you may mention top categories at a high level).",
    "- Keep numbers consistent with totalsAbs, netFlow, and comparisons.",
    "",
    `DATA: ${JSON.stringify(factsPack)}`,
  ].join("\n");

  return [
    {
      role: "system",
      content:
        "You are a financial assistant. Output strictly valid JSON following the required shape.",
    },
    { role: "user", content: userContent },
  ];
}

function extractJsonObject(text: string): any {
  // Try fenced ```json blocks first
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1]);
  }

  // Otherwise parse the first {...} block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }

  // Last resort
  return JSON.parse(text);
}

/**
 * Normalize and validate the LLM response,
 * ensuring it adheres to the expected structure and types.
 */
function normalizeReportShape(raw: any): MonthlyReportLLMResponse {
  const expenseAnalysis = raw.expense_analysis ?? raw.expence_analysis ?? "";

  const out: MonthlyReportLLMResponse = {
    insights: String(raw.insights ?? ""),
    income_analysis: String(raw.income_analysis ?? ""),
    expense_analysis: String(expenseAnalysis ?? ""),
    health: (raw.health ?? "yellow") as MonthlyReportLLMResponse["health"],
    health_analysis: String(raw.health_analysis ?? ""),
  };

  if (
    !out.insights ||
    !out.income_analysis ||
    !out.expense_analysis ||
    !out.health_analysis
  ) {
    throw new Error("LLM returned incomplete JSON report payload");
  }
  if (!["green", "yellow", "red"].includes(out.health)) {
    out.health = "yellow";
  }
  return out;
}

/**
 * Call Hugging Face's text generation API with the given messages and return the generated text.
 */
async function callHuggingFaceTextGeneration(messages: ChatMessage[]) {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN is not set");

  const model = process.env.HF_LLM_MODEL ?? "Qwen/Qwen2.5-7B-Instruct";

  const resp = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 700,
        temperature: 0.3,
        top_p: 0.9,
      }),
    },
  );

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`HF text-generation failed (${resp.status}): ${body}`);
  }

  const json = await resp.json();
  const generated = json?.choices?.[0]?.message?.content;
  if (!generated || typeof generated !== "string") {
    throw new Error(
      `HF returned unexpected payload: ${JSON.stringify(json).slice(0, 2000)}`,
    );
  }

  return generated;
}

/**
 * Generate a monthly report for a user by calling the LLM with a built prompt based on their data,
 */
export async function generateMonthlyReportWithHuggingFace(
  userData: any,
): Promise<MonthlyReportLLMResponse> {
  const messages = buildLLMPrompt(userData);
  console.log("Generated messages for LLM:", messages);
  const text = await callHuggingFaceTextGeneration(messages);
  const raw = extractJsonObject(text);

  return normalizeReportShape(raw);
}

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

    if (amtTarget > 0) income += amtTarget;
    else expenses += amtTarget; // negative
  }

  return { income, expenses, netFlow: income + expenses };
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
  usersIds: string[],
): Promise<any[]> {
  // Report is always previous month; keep params for now to avoid breaking call sites,
  // but derive the report month from "now" to match getTransactions().
  const now = new Date();
  const reportMonthDate = subMonths(now, 1);
  const reportStart = startOfMonth(reportMonthDate);
  const reportEnd = endOfMonth(reportMonthDate);

  const { currentByUser, prevByUser, historyByUser } = await getTransactions({
    userIds: usersIds,
  });

  const usersData: any[] = [];

  for (const [userId, currentTx] of currentByUser) {
    const prevTx = prevByUser.get(userId) ?? [];
    const historyTx = historyByUser.get(userId) ?? currentTx;

    // Pick a target currency from the report-month transactions (most frequent)
    const transactionsByCurrency: Record<
      string,
      { count: number; exchangeRate: number; symbol: string; name: string }
    > = {};

    for (const t of currentTx) {
      const c = t.account.currency;
      const id = c.id;
      const existing = transactionsByCurrency[id];
      transactionsByCurrency[id] = existing
        ? { ...existing, count: existing.count + 1 }
        : {
            count: 1,
            exchangeRate: c.exchangeRate,
            symbol: c.symbol,
            name: c.name,
          };
    }

    const [targetCurrency] = Object.entries(transactionsByCurrency).sort(
      (a, b) => b[1].count - a[1].count,
    );

    const targetCurrencyId =
      targetCurrency?.[0] ?? currentTx[0]!.account.currency.id;
    const targetExchangeRate =
      targetCurrency?.[1].exchangeRate ??
      currentTx[0]!.account.currency.exchangeRate;

    // Current month totals & aggregates
    const currentTotals = computeTotalsInTargetCurrency({
      transactions: currentTx,
      targetCurrencyId,
      targetExchangeRate,
    });

    const transactionAggregates = computeTransactionAggregates({
      userTransactions: currentTx,
      targetCurrencyId,
      targetExchangeRate,
      topN: 5,
    });

    // Previous month aggregates (same target currency)
    const prevTotals = computeTotalsInTargetCurrency({
      transactions: prevTx,
      targetCurrencyId,
      targetExchangeRate,
    });

    const prevTransactionAggregates =
      prevTx.length > 0
        ? computeTransactionAggregates({
            userTransactions: prevTx,
            targetCurrencyId,
            targetExchangeRate,
            topN: 5,
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

    const comparisons = {
      prevMonthAvailable: prevTx.length > 0,

      incomeReceivedDelta:
        prevTx.length > 0
          ? Number((incomeReceivedThis - incomeReceivedPrev).toFixed(2))
          : 0,
      incomeReceivedDeltaPct:
        prevTx.length > 0
          ? pctChange(
              incomeReceivedThis - incomeReceivedPrev,
              incomeReceivedPrev,
            )
          : 0,

      expenseSpendDelta:
        prevTx.length > 0
          ? Number((expenseSpendThis - expenseSpendPrev).toFixed(2))
          : 0,
      expenseSpendDeltaPct:
        prevTx.length > 0
          ? pctChange(expenseSpendThis - expenseSpendPrev, expenseSpendPrev)
          : 0,

      netFlowDelta:
        prevTx.length > 0 ? Number((netFlowThis - netFlowPrev).toFixed(2)) : 0,

      netFlowDeltaPct:
        prevTx.length > 0
          ? pctChange(netFlowThis - netFlowPrev, netFlowPrev)
          : 0,

      topCategoryChanges: prevTransactionAggregates
        ? buildTopCategoryChanges({
            current: transactionAggregates.expenseByCategory,
            prev: prevTransactionAggregates.expenseByCategory,
            topN: 5,
          })
        : [],
    };

    // Recurring candidates already computed elsewhere; keep your existing logic
    const recurringCandidates = buildRecurringCandidates({
      historyTransactions: historyTx,
      targetCurrencyId,
      targetExchangeRate,
      topN: 5,
    });

    usersData.push({
      userId,
      reportMonth: format(reportStart, "MMMM yyyy"),
      period: {
        start: toISODateOnly(reportStart),
        end: toISODateOnly(reportEnd),
      },
      currency: {
        symbol: currentTx[0]?.account.currency.symbol,
        code: currentTx[0]?.account.currency.name,
      },
      totalsAbs: {
        incomeReceived: incomeReceivedThis,
        expenseSpend: expenseSpendThis,
      },
      netFlow: netFlowThis,
      transactionAggregates,
      comparisons,
      recurringCandidates,
      dataQuality: {
        transactionCount: currentTx.length,
        expenseTransactionCount: currentTx.filter((t) => t.amount < 0).length,
        incomeTransactionCount: currentTx.filter((t) => t.amount > 0).length,
        accountCount: new Set(currentTx.map((t) => t.account.id)).size,
      },
    });
  }
  return usersData;
}
