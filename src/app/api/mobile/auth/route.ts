import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import jwkToPem from "jwk-to-pem";

// Initialize Google OAuth2 client with your client ID
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.APPLE_MOBILE_JWT_SECRET || "";
const JWT_EXPIRES_IN = "1h";

// Helper to verify Apple identity token
async function verifyAppleToken(identityToken: string) {
  try {
    // Get Apple public keys
    const appleKeysUrl = "https://appleid.apple.com/auth/keys";
    const res = await fetch(appleKeysUrl);
    if (!res.ok) throw new Error("Failed to fetch Apple public keys");
    const { keys } = await res.json();

    // Decode Apple's token header to find which key was used
    const decodedHeader: any = jwt.decode(identityToken, { complete: true });
    if (!decodedHeader || !decodedHeader.header) {
      throw new Error("Invalid Apple identity token");
    }
    const { kid, alg } = decodedHeader.header;

    // Find corresponding key in Apple's JWKS
    const appleKey = keys.find(
      (key: any) => key.kid === kid && key.alg === alg
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

    let userPayload: any;

    if (idToken) {
      // Verify Google ID token
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID!,
        });
        userPayload = ticket.getPayload();
        if (!userPayload) throw new Error("Invalid Google ID token");
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid Google ID token" },
          { status: 401 }
        );
      }
    } else if (appleIdentityToken) {
      // Verify Apple identity token
      try {
        console.log("recieved apple identity token", appleIdentityToken);
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
    const email = userPayload.email || userPayload.sub;
    if (!email) {
      return NextResponse.json(
        { error: "Email not found in token" },
        { status: 400 }
      );
    }

    // Here: Implement user lookup/creation in your database if needed
    // Example:
    // const user = await findOrCreateUser({
    //   email,
    //   name: userPayload.name || "",
    //   picture: userPayload.picture || "",
    //   provider: idToken ? "google" : "apple",
    // });

    const payload = {
      email,
      name: userPayload.name || "",
      picture: userPayload.picture || "",
      sub: userPayload.sub,
      provider: idToken ? "google" : "apple",
      // Add any other user data you need
    };

    // Issue your own JWT token representing a session for your app
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return NextResponse.json({ token }, { status: 200 });
  } catch (error: any) {
    console.error("Authentication failed:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 401 }
    );
  }
}
