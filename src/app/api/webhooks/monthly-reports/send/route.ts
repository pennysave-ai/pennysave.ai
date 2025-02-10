import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextResponse } from "next/server";
import { getUnsendedReports, markReportsAsSent } from "@/data/reports";
import { sendMonthlyReports } from "@/lib/mail";

/**
 * Send monthly reports to the users
 * @param req
 * @returns {Promise<NextResponse>}
 */
async function handler(req: Request): Promise<NextResponse> {
  try {
    const { ids } = await req.json();
    const reportsToSend = await getUnsendedReports(ids);
    await sendMonthlyReports(reportsToSend);
    await markReportsAsSent(reportsToSend.map((report) => report.id));
    return NextResponse.json({ message: "Monthly reports sent" });
  } catch (error) {
    console.error("Error sending monthly reports:", error);
    return NextResponse.json(
      { message: "Error sending monthly reports" },
      { status: 500 }
    );
  }
}
export const POST = verifySignatureAppRouter(handler);
