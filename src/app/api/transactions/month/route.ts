import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { getUserTransactionMonths } from "@/data/transactions";
import { getAuthenticatedUser } from "@/auth.helper";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const transactionMonths = await getUserTransactionMonths(
      user.id,
      accountId
    );
    const currentMonth = format(new Date(), "yyyy-MM");
    if (!transactionMonths.includes(currentMonth)) {
      transactionMonths.push(currentMonth);
    }
    return NextResponse.json({ data: transactionMonths });
  } catch {
    return NextResponse.json("Error while fetching transaction months", {
      status: 500,
    });
  }
}
