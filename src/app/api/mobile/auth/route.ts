import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import { getUserByEmail, createUserWithOauth } from "@/data/user";
import { createOauthAccount } from "@/data/oauthAccounts";
import { JWTTokenManager, type SubscriptionStatus } from "./JWTTokenManager";

// Helper to verify Apple identity token
async function verifyAppleToken(identityToken: string) {
  try {
    // Get Apple public keys
    const appleKeysUrl = "https://appleid.apple.com/auth/keys";
    const res = await fetch(appleKeysUrl);
    if (!res.ok) throw new Error("Failed to fetch Apple public keys");
    const { keys } = await res.json();

    // Decode Apple's token header to find which key was used
    const decodedHeader = jwt.decode(identityToken, {
      complete: true,
    }) as { header: jwt.JwtHeader } | null;
    if (!decodedHeader || !decodedHeader?.header) {
      throw new Error("Invalid Apple identity token");
    }
    const { kid, alg } = decodedHeader.header;

    // Find corresponding key in Apple's JWKS
    const appleKey = keys.find(
      (key: { kid: string | undefined; alg: string }) =>
        key.kid === kid && key.alg === alg
    );
    if (!appleKey) throw new Error("Public key for Apple token not found");

    const pem = jwkToPem(appleKey);

    // Verify Apple identity token JWT
    const payload = jwt.verify(identityToken, pem, {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_MOBILE_CLIENT_ID, // Your Apple app's client ID
    }) as jwt.JwtPayload;

    return payload;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Apple token verification failed: ${errorMessage}`);
  }
}
// A route handler for mobile authentication
// This handles both Google and Apple sign-in
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, appleIdentityToken } = body;

    if (!idToken && !appleIdentityToken) {
      return NextResponse.json(
        { error: "No tokens provided" },
        { status: 400 }
      );
    }

    let userPayload: jwt.JwtPayload | null = null;

    if (idToken) {
      // Verify Google ID token
      // try {
      //   const ticket = await googleClient.verifyIdToken({
      //     idToken,
      //     audience: process.env.GOOGLE_CLIENT_ID!,
      //   });
      //   const payload = ticket.getPayload();
      //   userPayload = payload ? (payload as jwt.JwtPayload) : null;
      //   if (!userPayload) throw new Error("Invalid Google ID token");
      // } catch {
      //   return NextResponse.json(
      //     { error: "Invalid Google ID token" },
      //     { status: 401 }
      //   );
      // }
    } else if (appleIdentityToken) {
      // Verify Apple identity token
      try {
        console.log("received apple identity token", appleIdentityToken);
        userPayload = await verifyAppleToken(appleIdentityToken);
        if (!userPayload) throw new Error("Invalid Apple identity token");
      } catch (error) {
        console.log("error", error);
        return NextResponse.json(
          { error: "Invalid Apple identity token" },
          { status: 401 }
        );
      }
    }

    // Extract user details
    const email = userPayload?.email || userPayload?.sub;
    if (!email) {
      return NextResponse.json(
        { error: "Email not found in token" },
        { status: 400 }
      );
    }
    const existingUser = await getUserByEmail(email);

    // If user does not exist, create a new user and link the account
    if (!existingUser) {
      try {
        const user = await createUserWithOauth({
          email,
          name: userPayload?.name || userPayload?.email,
          image: userPayload?.picture,
        });
        // Create Auth account for the created user
        const accountData = {
          userId: user.id,
          type: "oidc",
          provider: idToken ? "google" : "apple",
          providerAccountId: userPayload?.sub || "",
          expires_at: userPayload?.exp,
          token_type: "bearer",
          id_token: idToken || appleIdentityToken,
        };
        if (idToken) {
          // Google OAuth
          await createOauthAccount({
            ...accountData,
            access_token: idToken,
            refresh_token: null, // Google ID tokens don't include refresh tokens either
            scope:
              "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          });
        } else {
          // Apple Oauth
          await createOauthAccount({
            ...accountData,
            access_token: appleIdentityToken,
            refresh_token: null, // Apple doesn't provide refresh tokens
            scope: null,
          });
        }
        const tokens = await JWTTokenManager.createTokenFamily({
          ...user,
          email: user.email ?? "", // Ensure email is always a string
          name: user.name ?? "", // Ensure name is always a string
          hasActiveStripeSubscription:
            user.hasActiveStripeSubscription ?? false, // Ensure boolean
          sendMonthlyReport: user?.sendMonthlyReport ?? false,
          subscription: {
            status: "inactive",
            expiresAt: undefined,
          },
        });
        return NextResponse.json({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }

    const tokens = await JWTTokenManager.createTokenFamily({
      ...existingUser,
      email: existingUser.email ?? "",
      name: existingUser.name ?? "",
      hasActiveStripeSubscription:
        existingUser.hasActiveStripeSubscription ?? false,
      sendMonthlyReport: existingUser?.sendMonthlyReport ?? false,
      subscription: {
        status: existingUser.appleSubscriptionStatus as SubscriptionStatus,
        expiresAt: existingUser.appleSubscriptionExpiresAt,
      },
    });

    const { accessToken, refreshToken } = tokens;

    return NextResponse.json({
      accessToken,
      refreshToken,
    });
  } catch (error: unknown) {
    console.error("Authentication failed:", error);
    return NextResponse.json(
      {
        error:
          (error as { message?: string })?.message || "Authentication failed",
      },
      { status: 401 }
    );
  }
}
