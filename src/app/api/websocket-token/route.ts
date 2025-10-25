import { NextRequest, NextResponse } from "next/server";
import { generateWebsocketToken } from "@/data/websocket-token";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const token = generateWebsocketToken(userId);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating WebSocket token:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
