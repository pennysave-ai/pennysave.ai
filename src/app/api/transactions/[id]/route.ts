import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTransactionById } from "@/data/transactions";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  try {
    const transaction = await getUserTransactionById(user.id!, id);
    if (!transaction) {
      return NextResponse.json("Not found", { status: 404 });
    }
    return NextResponse.json({ data: transaction });
  } catch {
    return NextResponse.json(`Error while fetching transaction ${id}`, {
      status: 500,
    });
  }
}
