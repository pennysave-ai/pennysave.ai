import { NextRequest, NextResponse } from "next/server";
import { JWTTokenManager } from "../auth/JWTTokenManager";

export async function POST(req: NextRequest) {
  // Validate request body
  const body = await req.json().catch(() => null);
  if (!body || !body.refreshToken) {
    return NextResponse.json(
      { error: "Refresh token is required" },
      { status: 400 }
    );
  }

  const { refreshToken } = body;
  if (typeof refreshToken !== "string" || refreshToken.length < 10) {
    return NextResponse.json(
      { error: "Invalid refresh token format" },
      { status: 400 }
    );
  }
  await JWTTokenManager.revokeTokens(refreshToken);

  return NextResponse.json({ success: true }, { status: 200 });
}
