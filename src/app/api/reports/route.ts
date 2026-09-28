import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { db } from "@/db";
import { reportSelect, withLiveFacts } from "@/data/reports";

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
      select: reportSelect,
      orderBy: { periodStart: "desc" },
      take: limit,
    });
    return NextResponse.json({ data: await withLiveFacts(user.id, reports) });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Error while fetching reports" },
      { status: 500 },
    );
  }
}
