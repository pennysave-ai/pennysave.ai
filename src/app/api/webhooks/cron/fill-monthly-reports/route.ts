import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { db } from "@/db";
import { Prisma } from "@prisma/client";

const BATCH_SIZE = 100;
const HOUR_TO_CREATE = parseInt(process.env.REPORTS_GENERATION_HOUR || "5", 10); // Default to 5 AM if not set

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
      }[]
    >(Prisma.sql`
      WITH due AS (
        SELECT
          u.id,
          u."preferredLanguage",
          u."preferredCurrencyId",
          COALESCE(p.name, 'UTC') AS tz,
          (date_trunc('month', (now() AT TIME ZONE COALESCE(p.name, 'UTC'))) AT TIME ZONE COALESCE(p.name, 'UTC')) AS start_current_month_utc,
          ((date_trunc('month', (now() AT TIME ZONE COALESCE(p.name, 'UTC'))) - interval '1 month') AT TIME ZONE COALESCE(p.name, 'UTC')) AS start_prev_month_utc
        FROM "User" u
        LEFT JOIN pg_timezone_names p ON p.name = u.timezone
        WHERE EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(p.name, 'UTC'))) = ${HOUR_TO_CREATE}
      )
      SELECT d.id, d."preferredLanguage", d."preferredCurrencyId"
      FROM due d
      WHERE EXISTS (
        SELECT 1
        FROM "UserAccountAccess" uaa
        JOIN "UserAccount" ua ON ua.id = uaa."userAccountId"
        JOIN "Transaction" t ON t."accountId" = ua.id
        WHERE uaa."userId" = d.id
          AND t."createdAt" >= d.start_prev_month_utc
          AND t."createdAt" <  d.start_current_month_utc
        LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "Report" r
        WHERE r."userId" = d.id
          AND r."periodStart" = d.start_prev_month_utc
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
      message: users.length ? "Processing started" : "No users due this hour",
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
