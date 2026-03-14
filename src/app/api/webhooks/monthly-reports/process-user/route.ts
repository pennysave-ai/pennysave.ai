import { NextResponse } from "next/server";
import { db } from "@/db";

import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import {
  generateMonthlyReportWithHuggingFace,
  upsertReport,
} from "@/data/reports";

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
    // Generate the report using the AI model
    const { userId, ...rest } = userData;
    const llmResponse = await generateMonthlyReportWithHuggingFace(rest);

    await upsertReport({
      llmResponse,
      userData,
    });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error(
      `Error processing report for user ${userData.userId}:`,
      error,
    );
    return NextResponse.json({ status: "error", message: error });
  } finally {
    await db.$disconnect();
  }
}

const isDev = process.env.NODE_ENV !== "production";
export const POST = isDev ? handler : verifySignatureAppRouter(handler);
