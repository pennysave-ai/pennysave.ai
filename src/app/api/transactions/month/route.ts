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
    const transactionMonths = await getUserTransactionMonths(user.id);
    // add current month
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
