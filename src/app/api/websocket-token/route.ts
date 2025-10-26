import { NextRequest, NextResponse } from "next/server";
import { generateWebsocketToken } from "@/data/websocket-token";
import { getAuthenticatedUser } from "@/auth.helper";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const token = generateWebsocketToken(userId, user.aud);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating WebSocket token:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
