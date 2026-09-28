import { NextResponse } from "next/server";
import { db } from "@/db";

import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { reportExistsForMonth, upsertReport } from "@/data/reports";

export const maxDuration = 60;

async function handler(req: Request): Promise<NextResponse> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const { userData } = await req.json();
  try {
    if (!userData) {
      throw new Error(`No data found for user ${userData}`);
    }
    // A month that already has a report is never rewritten.
    if (await reportExistsForMonth(userData.userId, userData.reportMonth)) {
      return NextResponse.json({ status: "skipped" });
    }
    await upsertReport({ userData });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error(
      `Error processing report for user ${userData.userId}:`,
      error,
    );
    // A non-2xx is what makes QStash retry; a 200 here used to mean a failed
    // write was never tried again until the next day's cron.
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 },
    );
  } finally {
    await db.$disconnect();
  }
}

const isDev = process.env.NODE_ENV !== "production";
export const POST = isDev ? handler : verifySignatureAppRouter(handler);
