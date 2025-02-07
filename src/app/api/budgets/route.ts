import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBudget } from "@/data/budgets";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const newBudget = await createBudget(user.id, body);
    return NextResponse.json({ data: newBudget });
  } catch {
    return NextResponse.json("Bad Request", { status: 400 });
  }
}
