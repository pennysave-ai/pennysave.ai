import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setNotificationPreferences } from "@/data/user";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!Object.keys(body).includes("monthlyReports")) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    await setNotificationPreferences({
      userId: user.id,
      monthlyReports: body.monthlyReports,
    });
    return NextResponse.json({ data: "success" });
  } catch {
    return NextResponse.json("Error while saving notification status", {
      status: 500,
    });
  }
}
