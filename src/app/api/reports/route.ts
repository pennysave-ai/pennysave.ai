import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If you truly only have ~12/year, simplest is “return all”.
    // Still keep a sane upper bound to avoid accidental blowups.
    const MAX = 240; // ~20 years
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(
      Math.max(parseInt(limitParam ?? String(MAX), 10), 1),
      MAX,
    );

    const reports = await db.report.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        periodStart: true,
        health: true,
        data: true,
        createdAt: true,
        sentAt: true,
        snapshot: true,
        comparisons: true,
        categoryBreakdowns: { orderBy: { spend: "desc" } },
        recurringCandidates: { orderBy: { occurrences: "desc" } },
      },
      orderBy: { periodStart: "desc" },
      take: limit,
    });
    console.log("Fetched reports for user", { reports });
    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Error while fetching reports" },
      { status: 500 },
    );
  }
}
