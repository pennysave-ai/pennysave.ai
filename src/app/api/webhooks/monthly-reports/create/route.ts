import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { getPrevMonthSummaries } from "@/data/reports";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
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
  const { users } = await req.json();

  try {
    const usersData = await getPrevMonthSummaries(users.map((u: any) => u.id));

    for (const userData of usersData) {
      console.log(
        "Queueing report for user:",
        JSON.stringify(userData, null, 2),
      );
      // Queue each user data for processing
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/process-user`,
        body: {
          userData: {
            language:
              users.find((u: any) => u.id === userData.userId)
                ?.preferredLanguage || "en",
            ...userData,
          },
        },
        retries: 3, // Retry up to 3 times if the endpoint fails
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
    return NextResponse.json({ status: "error", message: error });
  }
}
export const maxDuration = 60;

const isDev = process.env.NODE_ENV !== "production";
export const POST = isDev ? handler : verifySignatureAppRouter(handler);
