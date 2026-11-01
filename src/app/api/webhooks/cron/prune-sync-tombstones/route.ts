import { NextResponse } from "next/server";

import { db } from "@/db";

/**
 * How long a delete is remembered for the app's offline feed (`GET /sync` in
 * the API). A phone that hasn't synced for longer than this gets a full reset
 * instead of the changes since — it can no longer be told what was deleted.
 */
export const KEEP_TOMBSTONES = "90 days";

/**
 * Drops sync tombstones older than `KEEP_TOMBSTONES`. Without this the table
 * only grows: every deleted or moved transaction, category, mapping or pick
 * leaves one. `sync_prune_tombstones` also records how far it went, which is
 * how the API knows to answer an older cursor with a reset rather than with
 * changes that are missing deletes. Runs daily, per vercel.json.
 */
export async function GET(
  req: Request
): Promise<NextResponse<string | object>> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const [{ dropped }] = await db.$queryRaw<{ dropped: number }[]>`
      SELECT sync_prune_tombstones(${KEEP_TOMBSTONES}::interval) AS dropped
    `;
    console.log(`Pruned ${dropped} sync tombstones on ${new Date()}`);
    return NextResponse.json({ ok: true, dropped });
  } catch (error) {
    console.error("error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}
