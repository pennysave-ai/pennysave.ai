import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { v4 as uuid } from "uuid";
import { createTransactionsSchema } from "@/schemas";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  const body = await req.json();
  const validationResult = createTransactionsSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json("Bad Request", { status: 400 });
  }

  const transactions = await db.transaction.create({
    data: body.map((transaction: any) => ({
      id: uuid(),
      ...transaction,
    })),
  });
  return NextResponse.json({ data: transactions });
}
