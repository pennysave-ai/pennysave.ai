import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrevMonthSummaries } from "@/data/reports";

export async function GET() {
  // const session = await auth();
  // if (!session) {
  //   return NextResponse.json("Unautorized", { status: 401 });
  // }
  // const user = session.user;
  // if (!user.id) {
  //   return NextResponse.json("Unautorized", { status: 401 });
  // }
  // get userid from params
  const userId = "44937619-02f9-4471-a14f-a5ffebdf98b4";
  try {
    const [usersData] = await getPrevMonthSummaries([userId]);
    return NextResponse.json({ data: usersData });
  } catch {
    return NextResponse.json("Error while fetching users data", {
      status: 500,
    });
  }
}
