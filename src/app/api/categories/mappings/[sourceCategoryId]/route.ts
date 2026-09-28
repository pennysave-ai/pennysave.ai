import { NextRequest, NextResponse, after } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  deleteCategoryMapping,
  notifyCategoryMappingsChanged,
} from "@/data/categoryMappings";

/**
 * Stop counting a partner category under any of the viewer's categories. This
 * covers a same-name match too: the removal is stored, so the name match doesn't
 * take over. Idempotent: 204 whether or not anything was counted. A PUT for the
 * same source maps it again. `?forget=1` deletes the stored row instead, which
 * is how Undo returns a source to "nothing stored" (name matching applies).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sourceCategoryId: string }> },
) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const { sourceCategoryId } = await params;
    const forget = req.nextUrl.searchParams.get("forget") === "1";
    await deleteCategoryMapping(user.id, sourceCategoryId, { forget });
    const userId = user.id;
    after(() => notifyCategoryMappingsChanged([userId], userId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error while deleting category mapping:", error);
    return NextResponse.json("Error while deleting category mapping", {
      status: 500,
    });
  }
}
