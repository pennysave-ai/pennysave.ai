import { NextResponse } from "next/server";
import { qstash } from "@/qstash";
import { getUnsendedReports } from "@/data/reports";
import { nextLocalHour } from "@/lib/reportSchedule";

/** Local hour the "report ready" push arrives at. */
const HOUR_TO_SEND = parseInt(process.env.REPORT_SENT_HOUR || "9", 10);

/**
 * Queue the "report ready" push for every report that hasn't had one.
 *
 * The cron runs once a day (vercel.json), so it can't be the thing that fires
 * at 9:00 in every timezone. Instead each push is handed to QStash with
 * `notBefore` set to the user's next local 9:00, and QStash delivers it then.
 *
 * A report stays unsent until the push is actually delivered, so the next
 * day's run finds it again if delivery is still pending; the deduplication id
 * makes that second enqueue a no-op instead of a second notification.
 */
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
    const now = new Date();
    for (const report of reports) {
      const sendAt = nextLocalHour(now, report.timeZone, HOUR_TO_SEND);
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/monthly-reports/send-notifications`,
        body: {
          reportsToSend: [report],
        },
        notBefore: Math.floor(sendAt.getTime() / 1000),
        deduplicationId: `report-ready-${report.id}`,
      });
    }
    // Emails (disabled): would go through /send-email the same way, one per
    // report with its own deduplication id.
    return NextResponse.json({ ok: true, queued: reports.length });
  } catch (error) {
    console.error("error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
