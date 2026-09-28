import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { db } from "@/db";
import { Prisma } from "@prisma/client";

const BATCH_SIZE = 100;

/**
 * Queue a report for every user whose last month has closed in their own
 * timezone, has transactions, and has no report yet.
 *
 * Runs once a day (vercel.json). There is no hour-of-day filter: it was
 * written for an hourly cron and, run once a day at 00:00 UTC, only ever
 * matched users five hours ahead of UTC. When a report is generated doesn't
 * matter to the user; the push that announces it is timed separately, by
 * send-reports.
 *
 * All timestamps are Prisma `DateTime`s, stored as UTC wall time without a
 * zone, so every bound is brought back to UTC wall time before comparing.
 */
export async function GET(
  req: Request,
): Promise<NextResponse<string | object>> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const users = await db.$queryRaw<
      {
        id: string;
        preferredLanguage: string;
        preferredCurrencyId: string | null;
        timeZone: string;
        reportMonth: string;
      }[]
    >(Prisma.sql`
      WITH zoned AS (
        SELECT
          u.id,
          u."preferredLanguage",
          u."preferredCurrencyId",
          COALESCE(p.name, 'UTC') AS tz,
          -- 1st of the user's current month, on their wall clock
          date_trunc('month', now() AT TIME ZONE COALESCE(p.name, 'UTC')) AS local_month_start
        FROM "User" u
        LEFT JOIN pg_timezone_names p ON p.name = u.timezone
      ),
      due AS (
        SELECT
          z.*,
          -- The report month, named as Report.periodStart stores it
          z.local_month_start - interval '1 month' AS period_start,
          -- The report month's instants, as UTC wall time
          ((z.local_month_start - interval '1 month') AT TIME ZONE z.tz) AT TIME ZONE 'UTC' AS from_utc,
          (z.local_month_start AT TIME ZONE z.tz) AT TIME ZONE 'UTC' AS to_utc
        FROM zoned z
      )
      SELECT
        d.id,
        d."preferredLanguage",
        d."preferredCurrencyId",
        d.tz AS "timeZone",
        to_char(d.period_start, 'YYYY-MM-DD') AS "reportMonth"
      FROM due d
      WHERE EXISTS (
        SELECT 1
        FROM "UserAccountAccess" uaa
        JOIN "UserAccount" ua ON ua.id = uaa."userAccountId"
        JOIN "Transaction" t ON t."accountId" = ua.id
        WHERE uaa."userId" = d.id
          AND t."createdAt" >= d.from_utc
          AND t."createdAt" <  d.to_utc
        LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "Report" r
        WHERE r."userId" = d.id
          AND r."periodStart" = d.period_start
      );
    `);

    // Fetch ALL currencies once — passed down through the queue payload
    const allCurrencies = await db.currency.findMany({
      select: { id: true, symbol: true, name: true, exchangeRate: true },
    });

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/create`,
        body: {
          users: batch.map((u) => ({
            id: u.id,
            language: u.preferredLanguage,
            currencyId: u.preferredCurrencyId ?? undefined,
            timeZone: u.timeZone,
            reportMonth: u.reportMonth,
          })),
          // Pass full currency table once per batch — not per user
          currencies: allCurrencies,
        },
        retries: 3,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      });
    }

    return NextResponse.json({
      status: "success",
      message: users.length ? "Processing started" : "No users due",
      processedUsers: users.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    await db.$disconnect();
  }
}
