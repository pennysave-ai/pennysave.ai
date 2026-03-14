import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextResponse } from "next/server";
import { markReportsAsSent } from "@/data/reports";
import { sendMonthlyReports } from "@/lib/mail";

/**
 * Send monthly reports to the users
 * @param req
 * @returns {Promise<NextResponse>}
 */
async function handler(req: Request): Promise<NextResponse> {
  try {
    const { reportsToSend } = await req.json();
    // This function emails the reports to the users
    await sendMonthlyReports(reportsToSend);
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
