import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { getUnsendedReports } from "@/data/reports";

/**
 * Send monthly reports to the users
 * runs once a month according the schedule defined in vercel.json file
 * @param req
 * @returns {Promise<NextResponse>}
 */
const BATCH_SIZE = 50;

export async function GET(
  req: Request,
): Promise<NextResponse<string | object>> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const reports = await getUnsendedReports();
    console.log("Unsended reports to send:", reports);
    // Sent notifications in batches to avoid timeouts and rate limits
    for (let i = 0; i < reports.length; i += BATCH_SIZE) {
      const batch = reports.slice(i, i + BATCH_SIZE);
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/send-notifications`,
        body: {
          reportsToSend: batch,
        },
      });
    }
    // Sent emails in batches to avoid timeouts and rate limits
    // for (let i = 0; i < reports.length; i += BATCH_SIZE) {
    //   const batch = reports.slice(i, i + BATCH_SIZE);
    //   await qstash.publishJSON({
    //     url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/send-email`,
    //     body: {
    //       reportsToSend: batch,
    //     },
    //   });
    // }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("error", error);
    return NextResponse.json({ ok: false });
  }
}
