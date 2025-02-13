import type { User } from "@prisma/client";

import bcrypt from "bcryptjs";
import { CredentialsSignin } from "next-auth";
import type { NextAuthConfig } from "next-auth";

import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { THIRD_PARTY_ERROR } from "@/constants";
import { signInSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  throw new Error("Missing github oauth credentials");
}

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing google oauth credentials");
}

// Custom error for third-party sign-in
export class ThirdPartyError extends CredentialsSignin {
  code = THIRD_PARTY_ERROR;
}

export default {
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    }),
    AppleProvider({
      clientId: APPLE_CLIENT_ID,
      clientSecret: APPLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          response_type: "code",
          code_challenge_method: "S256",
        },
      },
      userinfo: {
        url: "https://appleid.apple.com/auth/userinfo",
      },
      profile(profile) {
        console.log("@profile", profile);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: null,
        };
      },
    }),
    Credentials({
      async authorize(credentials): Promise<User | null | ThirdPartyError> {
        const validatedFields = signInSchema.safeParse(credentials);
        if (validatedFields.success) {
          const { email, password } = credentials as {
            email: string;
            password: string;
          };

          // Validate the form data
          const user = await getUserByEmail(email);
          if (!user) return null;

          // User might be authenticated with a third-party provider and not have a password
          if (!user?.password) {
            throw new ThirdPartyError();
          }

          // Check if the password is correct
          const isValid = await bcrypt.compare(password, user.password);
          if (isValid) return user;
        }
        return null;
      },
    }),
  ],
  cookies: {
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
} satisfies NextAuthConfig;
