import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategoriesCount } from "@/data/categories";
import { getUserAccountsCount } from "@/data/accounts";
import { getUserTransactionsCount } from "@/data/transactions";
import { getBudgetsCount } from "@/data/budgets";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const categories = await getCategoriesCount(user.id);
    const accounts = await getUserAccountsCount(user.id);
    const transactions = await getUserTransactionsCount(user.id);
    const budgets = await getBudgetsCount(user.id);
    return NextResponse.json({
      categories,
      accounts,
      transactions,
      budgets,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch entities" },
      { status: 500 }
    );
  }
}
