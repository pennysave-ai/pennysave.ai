import { NextRequest, NextResponse } from "next/server";
import { getTotalSchema } from "@/schemas";
import { getAuthenticatedUser } from "@/auth.helper";
import { getUserTransactionsTotalsByCategory } from "@/data/transactions";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.id) {
      return NextResponse.json("Unautorized", { status: 401 });
    }
    const searchParams = req.nextUrl.searchParams;
    const validationResult = getTotalSchema.safeParse({
      userId: user.id,
      startDate: searchParams.get("start") || undefined,
      endDate: searchParams.get("end") || undefined,
      accountId: searchParams.get("accountId") || undefined,
      currencyId: searchParams.get("currencyId") || undefined,
    });

    if (!validationResult.success) {
      console.log("validationResult", validationResult.error);
      return NextResponse.json("Bad Request", { status: 400 });
    }
    const payload = validationResult.data;
    const totals = await getUserTransactionsTotalsByCategory({
      ...payload,
      accountId: payload.accountId,
    });
    return NextResponse.json({
      data: totals,
    });
  } catch (e) {
    return NextResponse.json(`Error while fetching totals ${e}`, {
      status: 500,
    });
  }
}
