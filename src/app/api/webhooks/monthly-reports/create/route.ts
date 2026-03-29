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
  const { users, currencies } = await req.json();
  console.log("@flow users ->", users);
  console.log("@flow currencies ->", currencies);
  try {
    const usersData = await getPrevMonthSummaries(
      users.map((u: any) => ({ id: u.id, currencyId: u.currencyId })),
      currencies,
    );

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
              users.find((u: any) => u.id === userData.userId)?.language ||
              "en",
          },
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
