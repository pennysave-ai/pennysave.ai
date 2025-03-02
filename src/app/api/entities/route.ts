import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategoriesCount } from "@/data/categories";
import { getUserAccountsCount } from "@/data/accounts";
import { getUserTransactionsCount } from "@/data/transactions";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  try {
    const categories = await getCategoriesCount(user.id);
    const accounts = await getUserAccountsCount(user.id);
    const transactions = await getUserTransactionsCount(user.id);
    return NextResponse.json({
      categories,
      accounts,
      transactions,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch entities" },
      { status: 500 }
    );
  }
}
