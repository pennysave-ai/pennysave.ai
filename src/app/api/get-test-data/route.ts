import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrevMonthSummaries } from "@/data/transactions";

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
    const [usersData] = await getPrevMonthSummaries(
      [user.id],
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1
      ).toISOString(),
      new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString()
    );
    return NextResponse.json({ data: usersData });
  } catch {
    return NextResponse.json("Error while fetching users data", {
      status: 500,
    });
  }
}
