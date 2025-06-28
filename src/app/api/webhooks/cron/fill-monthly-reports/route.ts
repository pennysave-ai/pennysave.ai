import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { db } from "@/db";

const BATCH_SIZE = 100;

/** Get reports data for all users
 * @param req
 * @returns {Promise<NextResponse>}
 */
export async function GET(
  req: Request
): Promise<NextResponse<string | object>> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  try {
    // Detrmine start and end of the previous month
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfPreviousMonth = new Date(startOfCurrentMonth.getTime() - 1);
    const startOfPreviousMonth = new Date(
      endOfPreviousMonth.getFullYear(),
      endOfPreviousMonth.getMonth(),
      1
    );

    // Get all the users who has and enabled monthly reports and have transactions in the previous month
    const users = await db.user.findMany({
      where: {
        sendMonthlyReport: true,
        userAccounts: {
          some: {
            transactions: {
              some: {
                createdAt: {
                  gte: startOfPreviousMonth,
                  lte: endOfPreviousMonth,
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });
    // Batch user IDs and queue requests
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/create`,
        body: {
          userIds: batch.map((user) => user.id),
          startOfPreviousMonth,
          endOfPreviousMonth,
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
      message: "Processing started",
    });
  } catch (error) {
    return NextResponse.json({ status: "error", message: error });
  } finally {
    await db.$disconnect();
  }
}
