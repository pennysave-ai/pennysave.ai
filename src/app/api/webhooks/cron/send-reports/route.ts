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
  req: Request
): Promise<NextResponse<string | object>> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    // Get Reports which are not sent yet
    const reports = await getUnsendedReports();
    for (let i = 0; i < reports.length; i += BATCH_SIZE) {
      const batch = reports.slice(i, i + BATCH_SIZE);
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/send`,
        body: {
          reportsToSend: batch,
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("error", error);
    return NextResponse.json({ ok: false });
  }
}
