import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { getPrevMonthSummaries } from "@/data/transactions";

/**
 * Generate monthly reports for users
 * and save the results to the database
 * Called by the cron job once a month by the queue from fill-monthly-reports route
 * once a month on the 1st day
 * @param req
 * @returns {Promise<NextResponse>}
 */
async function handler(req: Request): Promise<NextResponse> {
  const { userIds, startOfPreviousMonth, endOfPreviousMonth } =
    await req.json();

  try {
    const usersData = await getPrevMonthSummaries(
      userIds,
      startOfPreviousMonth,
      endOfPreviousMonth
    );
    for (const userData of usersData) {
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/process-user`,
        body: {
          userData,
          startOfPreviousMonth,
          endOfPreviousMonth,
        },
        retries: 3, // Retry up to 3 times if the endpoint fails
      });
    }
    return NextResponse.json({
      status: "success",
      message: "Users queued for processing",
    });
  } catch (error) {
    console.error("Error processing monthly reports:", error);
    return NextResponse.json({ status: "error", message: error });
  }
}
export const maxDuration = 60;
// export const POST = verifySignatureAppRouter(handler);
export const POST = handler;
