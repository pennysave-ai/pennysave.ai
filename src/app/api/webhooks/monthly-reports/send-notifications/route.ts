import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextResponse } from "next/server";
import { APNService, APNNotificationType } from "@/lib/apn";
import { markReportsAsSent, reportMonthName } from "@/data/reports";

/**
 * Send monthly reports to the users
 * @param req
 * @returns {Promise<NextResponse>}
 */
async function handler(req: Request): Promise<NextResponse> {
  try {
    const { reportsToSend }: any = await req.json();
    const apnService = APNService.getInstance();
    const messages = reportsToSend
      .filter(({ deviceToken }: any) => deviceToken)
      .map(({ deviceToken, reportDate, language }: any) => ({
        deviceToken: deviceToken,
        message: {
          "loc-key": "MONTHLY_REPORT_READY",
          // Was the raw periodStart, which the push printed as
          // "2026-08-01T00:00:00.000Z". Messages queued before `language`
          // was sent fall back to English.
          "loc-args": [reportMonthName(reportDate, language || "en")],
        },
        payload: {
          type: APNNotificationType.MONTHLY_REPORT_READY,
        },
        silent: false,
      }));
    console.log("Batch sending notifications:", messages);
    await apnService.sendBatchNotifications(messages);

    // This function emails the reports to the users NOOP
    // await sendMonthlyReports(reportsToSend);

    await markReportsAsSent(
      reportsToSend.map((report: { id: string }) => report.id),
    );

    return NextResponse.json({ message: "Monthly reports sent" });
  } catch (error) {
    console.error("Error sending monthly reports:", error);
    return NextResponse.json(
      { message: "Error sending monthly reports" },
      { status: 500 },
    );
  }
}
const isDev = process.env.NODE_ENV !== "production";
export const POST = isDev ? handler : verifySignatureAppRouter(handler);
