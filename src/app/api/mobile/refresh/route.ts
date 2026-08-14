import { NextRequest, NextResponse } from "next/server";
import { JWTTokenManager } from "../auth/JWTTokenManager";

export async function POST(req: NextRequest) {
  // Validate request body
  const body = await req.json().catch(() => null);
  if (!body || !body.refreshToken) {
    return NextResponse.json(
      { error: "Refresh token is required" },
      { status: 400 },
    );
  }
  // Validate refresh token format (basic check)
  const { refreshToken } = body;
  if (typeof refreshToken !== "string" || refreshToken.length < 10) {
    return NextResponse.json(
      { error: "Invalid refresh token format" },
      { status: 400 },
    );
  }
  try {
    const tokens = await JWTTokenManager.refreshAccessToken(refreshToken);
    if (!tokens) {
      return NextResponse.json(
        { error: "Failed to refresh access token" },
        { status: 500 },
      );
    }
    return NextResponse.json(tokens, { status: 200 });
  } catch (error: unknown) {
    console.error("recieved refresh token:", refreshToken);
    console.error("Error refreshing access token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 },
    );
  }
}
