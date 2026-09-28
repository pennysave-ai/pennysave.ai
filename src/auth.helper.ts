import { NextRequest } from "next/server";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";
import type { JWTPayload } from "@/app/api/mobile/auth/JWTTokenManager";

export async function getAuthenticatedUser(req: NextRequest) {
  // Try NextAuth session first (for web app)
  try {
    const session = await auth();
    if (session?.user) {
      return session.user;
    }
  } catch (error) {
    console.log("NextAuth session error:", error);
  }

  // Try Authorization header (for mobile/API testing)
  const authHeader = req?.headers?.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as JWTPayload;
      // Only access tokens carry user claims; a refresh token here would
      // produce a user object with undefined email/name.
      if (decoded.type !== "access") {
        console.log("JWT verification error: expected an access token");
        return null;
      }
      // Convert your token structure to match NextAuth user structure
      return {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        image: decoded.picture,
        aud: decoded.aud,
        hasActiveStripeSubscription: decoded.activeSubscription,
        notifications: {
          monthlyReports: decoded.monthlyReports,
        },
      };
    } catch (e) {
      console.log("JWT verification error:", e);
      return null;
    }
  }

  return null;
}
