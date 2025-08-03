import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
// import { OAuth2Client } from "google-auth-library";
// import { db } from "@/db"; // Add this import
import { getUserByEmail, createUserWithOauth } from "@/data/user";
// import { createOauthAccount } from "@/data/oauthAccounts";

// Initialize Google OAuth2 client with your client ID
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Use the same secret as NextAuth.js
const JWT_SECRET = process.env.AUTH_SECRET || "";
// const JWT_EXPIRES_IN = "1h";

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
    throw new Error(`Apple token verification failed: ${error?.message}`);
  }
}

// Helper to find or create user in database
// async function findOrCreateUser(userInfo: {
//   email: string;
//   name?: string;
//   picture?: string;
//   provider: string;
// }) {
//   let user = await getUserByEmail(userInfo.email);

//   if (!user) {
//     // Create new user if doesn't exist
//     user = await db.user.create({
//       data: {
//         email: userInfo.email,
//         name: userInfo.name || "",
//         image: userInfo.picture || "",
//         emailVerified: new Date(), // Auto-verify OAuth users
//         gdprConsent: new Date(),
//       },
//     });
//   }

//   return user;
// }
// A route handler for mobile authentication
// This handles both Google and Apple sign-in
export async function POST(req: NextRequest) {
  try {
    console.log("Authentication request received");
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
          name: userPayload?.name || "",
          image: userPayload?.picture || "",
        });
        return NextResponse.json({
          token: "test",
          refreshToken: "test",
          data: {
            userPayload,
            user,
          },
        });
        // Create Oauth account for the created user
        // await createOauthAccount({
        //   userId: user.id,
        //   type: "oauth",
        //   provider: idToken ? "google" : "apple",
        //   providerAccountId: userPayload?.sub || "",

        // });
      } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }
    // Get user's subscription and other data (same as your NextAuth JWT callback)
    // const existingUser = await db.user.findUnique({
    //   select: {
    //     id: true,
    //     email: true,
    //     name: true,
    //     image: true,
    //     role: true,
    //     hasActiveStripeSubscription: true,
    //     stripePriceId: true,
    //     stripeSubscriptionEndDate: true,
    //     stripeSubscriptionCancelAtDate: true,
    //     sendMonthlyReport: true,
    //   },
    //   where: { id: user.id },
    // });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create JWT token with NextAuth.js compatible structure
    const tokenPayload = {
      sub: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      picture: existingUser.image,
      role: existingUser.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour

      // Add the same fields as your NextAuth JWT callback
      activeSubscription: existingUser.hasActiveStripeSubscription,
      priceId: existingUser.stripePriceId,
      expires: existingUser.stripeSubscriptionEndDate,
      cancelAt: existingUser.stripeSubscriptionCancelAtDate,
      monthlyReports: existingUser.sendMonthlyReport,
    };

    // Use the same secret as NextAuth.js
    const token = jwt.sign(tokenPayload, JWT_SECRET);

    return NextResponse.json(
      {
        token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          image: existingUser.image,
          role: existingUser.role,
          hasActiveStripeSubscription: existingUser.hasActiveStripeSubscription,
          subscription: existingUser.hasActiveStripeSubscription
            ? {
                priceId: existingUser.stripePriceId,
                expires: existingUser.stripeSubscriptionEndDate,
                cancelAt: existingUser.stripeSubscriptionCancelAtDate,
              }
            : undefined,
          notifications: {
            monthlyReports: existingUser.sendMonthlyReport,
          },
        },
      },
      { status: 200 }
    );
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
