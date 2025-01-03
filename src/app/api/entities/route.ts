import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  const categories = await db.category.count({
    where: { userId: user.id },
  });
  const accounts = await db.userAccount.count({
    where: { userId: user.id },
  });
  const transactions = await db.transaction.count({
    where: { account: { userId: user.id } },
  });
  return NextResponse.json({
    categories,
    accounts,
    transactions,
  });
}
