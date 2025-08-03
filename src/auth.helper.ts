import { NextRequest } from "next/server";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  familyId: string;
  version: number;
  type: "access" | "refresh";
  activeSubscription: boolean;
  priceId?: string;
  expires?: string;
  cancelAt?: string;
  monthlyReports: boolean;
  jti: string;
  iat: number;
  exp: number;
  aud: string;
}

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
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as JWTPayload;

      // Convert your token structure to match NextAuth user structure
      return {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        hasActiveStripeSubscription: decoded.activeSubscription,
        subscription: decoded.activeSubscription
          ? {
              priceId: decoded.priceId,
              expires: decoded.expires,
              cancelAt: decoded.cancelAt,
            }
          : undefined,
        notifications: {
          monthlyReports: decoded.monthlyReports,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  return null;
}
