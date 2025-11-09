import { NextRequest, NextResponse } from "next/server";
import { JWTTokenManager } from "../auth/JWTTokenManager";

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();
  try {
    await JWTTokenManager.confirmRefreshToken(refreshToken);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
