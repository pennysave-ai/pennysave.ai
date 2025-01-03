import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const currencies = await db.currency.findMany({
    select: { id: true, name: true, symbol: true },
  });
  return NextResponse.json({ data: currencies });
}
