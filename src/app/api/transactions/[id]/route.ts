import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const transaction = await db.transaction.findFirst({
    where: {
      id: params.id,
      account: {
        userId: user.id,
      },
    },
    select: {
      id: true,
      amount: true,
      payee: true,
      notes: true,
      createdAt: true,
      account: {
        select: { id: true, name: true },
      },
      category: {
        select: { id: true, name: true },
      },
    },
  });
  if (!transaction) {
    return NextResponse.json("Not found", { status: 404 });
  }
  return NextResponse.json({ data: transaction });
}
