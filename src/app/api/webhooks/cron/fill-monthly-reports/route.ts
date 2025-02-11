import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { db } from "@/db";

// Batch size for processing
// Note that after we write reports to db
// we will send them to the users by calling
// api/webhooks/monthly-reports/send API
// and it has a batch size max 100
const BATCH_SIZE = 100;

/** Populate the database with the AI Generated data
 * runs accoording the schedule defined in vercel.json file
 * once a month on the 1st day
 * @param req
 * @returns {Promise<NextResponse>}
 */
export async function GET(
  req: Request
): Promise<NextResponse<string | object>> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    // Get all the users who has and enabled monthly reports
    const users = await db.user.findMany({
      select: {
        id: true,
      },
      where: {
        sendMonthlyReport: true,
      },
    });
    // Detrmine start and end of the previous month
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfPreviousMonth = new Date(startOfCurrentMonth.getTime() - 1);
    const startOfPreviousMonth = new Date(
      endOfPreviousMonth.getFullYear(),
      endOfPreviousMonth.getMonth(),
      1
    );
    const userIds = users.map((user) => user.id);

    // Batch user IDs and queue requests
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/create`,
        body: {
          userIds: batch,
          startOfPreviousMonth,
          endOfPreviousMonth,
        },
        retries: 3,
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
