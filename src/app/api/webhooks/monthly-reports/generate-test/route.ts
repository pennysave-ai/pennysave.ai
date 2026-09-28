import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  getPrevMonthSummaries,
  reportSelect,
  upsertReport,
  withLiveFacts,
} from "@/data/reports";
import { deriveFindings, findingKey } from "@/lib/reportFindings";
import {
  parseReportMonth,
  previousUtcMonth,
  safeTimeZone,
} from "@/lib/reportSchedule";

export const maxDuration = 60;

/**
 * Generate one user's report for one month, right now, and return it as the
 * app would receive it.
 *
 * Runs the same steps as the monthly pipeline (summarise → write) in one
 * request instead of through QStash, so a result or an error comes back
 * directly. For testing only:
 *
 * - needs `Authorization: Bearer <CRON_SECRET>`;
 * - answers 404 in production unless `REPORTS_TEST_ENDPOINT=true`.
 *
 * POST body (JSON):
 * - `userId` or `email` — whose report.
 * - `month` — "YYYY-MM", default the previous UTC month.
 * - `force` — replace an existing report for that month (it is deleted
 *   first, with its snapshot and breakdowns). Default false: 409 instead.
 * - `notify` — leave the report unsent, so the daily send-reports run pushes
 *   "your report is ready" to the user. Default false: it is marked sent.
 *
 * curl -X POST localhost:3000/api/webhooks/monthly-reports/generate-test \
 *   -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" \
 *   -d '{"email":"me@example.com","month":"2026-08","force":true}'
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.REPORTS_TEST_ENDPOINT !== "true"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    userId?: string;
    email?: string;
    month?: string;
    force?: boolean;
    notify?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const { userId, email, month, force = false, notify = false } = body;

  if (!userId && !email) {
    return NextResponse.json(
      { error: "Pass userId or email" },
      { status: 400 },
    );
  }

  let reportMonth: Date;
  try {
    reportMonth = month ? parseReportMonth(`${month}-01`) : previousUtcMonth();
  } catch {
    return NextResponse.json(
      { error: 'month must look like "2026-08"' },
      { status: 400 },
    );
  }

  const started = Date.now();
  try {
    const user = await db.user.findFirst({
      where: userId ? { id: userId } : { email },
      select: {
        id: true,
        preferredCurrencyId: true,
        timezone: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await db.report.findFirst({
      where: { userId: user.id, periodStart: reportMonth },
      select: { id: true },
    });
    if (existing && !force) {
      return NextResponse.json(
        {
          error:
            "A report for this month exists; pass force: true to replace it",
          reportId: existing.id,
        },
        { status: 409 },
      );
    }

    const currencies = await db.currency.findMany({
      select: { id: true, symbol: true, name: true, exchangeRate: true },
    });
    const [userData] = await getPrevMonthSummaries(
      [
        {
          id: user.id,
          currencyId: user.preferredCurrencyId ?? undefined,
          timeZone: safeTimeZone(user.timezone),
        },
      ],
      currencies,
      reportMonth,
    );
    if (!userData) {
      return NextResponse.json(
        { error: "No transactions in that month; nothing to report" },
        { status: 422 },
      );
    }

    if (existing) {
      await db.report.delete({ where: { id: existing.id } });
    }
    await upsertReport({ userData });
    if (!notify) {
      await db.report.updateMany({
        where: { userId: user.id, periodStart: reportMonth, sentAt: null },
        data: { sentAt: new Date() },
      });
    }

    const report = await db.report.findFirst({
      where: { userId: user.id, periodStart: reportMonth },
      select: reportSelect,
    });
    const [live] = report ? await withLiveFacts(user.id, [report]) : [];

    return NextResponse.json({
      tookMs: Date.now() - started,
      replaced: existing?.id ?? null,
      // Every claim the month supports, by score — what to look at when a
      // report leads with the wrong finding. `report.findings` is the four
      // it leads with.
      candidates: deriveFindings(userData.facts).map((f) => ({
        key: findingKey(f),
        ...f,
      })),
      report: live ?? null,
    });
  } catch (error) {
    console.error("Test report generation failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        tookMs: Date.now() - started,
      },
      { status: 500 },
    );
  }
}
