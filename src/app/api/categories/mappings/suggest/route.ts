import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { suggestCategoryMappings } from "@/data/categoryMappings";

/**
 * Which of the viewer's categories a partner category probably corresponds to,
 * best first. An empty list means no confident guess.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const source = req.nextUrl.searchParams.get("source");
  if (!source) {
    return NextResponse.json("Not Found", { status: 404 });
  }
  try {
    const data = await suggestCategoryMappings(user.id, source);
    if (!data) {
      return NextResponse.json("Not Found", { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error while suggesting category mappings:", error);
    return NextResponse.json("Error while suggesting category mappings", {
      status: 500,
    });
  }
}
