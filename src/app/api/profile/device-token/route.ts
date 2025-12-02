import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { updateUserDeviceToken } from "@/data/user";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user || !user.id) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const { deviceToken } = await request.json();
  await updateUserDeviceToken(user.id, deviceToken);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user || !user.id) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  await updateUserDeviceToken(user.id, null);
  return NextResponse.json({ success: true });
}
