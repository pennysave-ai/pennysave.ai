import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { getPrevMonthSummaries } from "@/data/reports";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { parseReportMonth, previousUtcMonth } from "@/lib/reportSchedule";

type QueuedUser = {
  id: string;
  language?: string;
  currencyId?: string;
  timeZone?: string;
  /** "YYYY-MM-01"; missing from messages queued before it was sent. */
  reportMonth?: string;
};
/**
 * Generate monthly reports for users
 * and save the results to the database
 * Called by the cron job once a month by the queue from fill-monthly-reports route
 * once a month on the 1st day
 * @param req
 * @returns {Promise<NextResponse>}
 */
async function handler(req: Request): Promise<NextResponse> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const { users, currencies }: { users: QueuedUser[]; currencies: any } =
    await req.json();
  console.log("@flow users ->", users);
  console.log("@flow currencies ->", currencies);
  try {
    // Users in different timezones can be due for different months (on the
    // 1st, UTC+ users have closed a month UTC- users haven't), so each month
    // is summarised on its own.
    const byMonth = new Map<string, QueuedUser[]>();
    for (const u of users) {
      const key =
        u.reportMonth ?? previousUtcMonth().toISOString().slice(0, 10);
      byMonth.set(key, [...(byMonth.get(key) ?? []), u]);
    }
    const usersData = [];
    for (const [month, group] of byMonth) {
      usersData.push(
        ...(await getPrevMonthSummaries(
          group.map((u) => ({
            id: u.id,
            currencyId: u.currencyId,
            timeZone: u.timeZone,
          })),
          currencies,
          parseReportMonth(month),
        )),
      );
    }

    for (const userData of usersData) {
      console.log(
        "@flow userData to process ->",
        JSON.stringify(userData, null, 2),
      );
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/process-user`,
        body: {
          userData: {
            ...userData,
            language:
              users.find((u) => u.id === userData.userId)?.language || "en",
          },
        },
        retries: 3,
        // One model call per user and month, even when a failed batch is
        // retried and publishes everyone in it again.
        deduplicationId: `report-${userData.userId}-${userData.period.start}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      });
    }
    return NextResponse.json({
      status: "success",
      message: "Users queued for processing",
    });
  } catch (error) {
    console.error("Error processing monthly reports:", error);
    // A non-2xx is what makes QStash retry the batch.
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 },
    );
  }
}
export const maxDuration = 60;

const isDev = process.env.NODE_ENV !== "production";
export const POST = isDev ? handler : verifySignatureAppRouter(handler);
