"use server";

import { signIn } from "@/auth";
import { signInSchema } from "@/schemas";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/data";
import { generateVerificationToken } from "@/data/verification-token";
import { DEFAULT_LOGGED_IN_REDIRECT } from "@/routes";
import { ThirdPartyError } from "@/auth.config";
import { sendVerificationEmail } from "@/lib/mail";

interface SignUserInErrors {
  errors: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  success?: {
    _form?: string[];
  };
}

export async function emailSignIn(
  _: SignUserInErrors,
  formData: FormData
): Promise<SignUserInErrors> {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate the form data
  const validationResult = signInSchema.safeParse({
    email,
    password,
  });

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
    };
  }
  const existingUser = await getUserByEmail(email as string);
  if (!existingUser || !existingUser.email || !existingUser.password) {
    return {
      errors: {
        _form: ["Invalid credentials"],
      },
    };
  }
  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );
    return {
      errors: {},
      success: {
        _form: [
          "Please verify your email before signing in. We've sent you a new verification email.",
        ],
      },
    };
  }

  try {
    // Sign in the user with the provided credentials
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGGED_IN_REDIRECT,
    });
    // If successful, return an empty errors object and update the session
    // in the client
    return {
      errors: {},
    };
  } catch (error: unknown) {
    if (error instanceof ThirdPartyError) {
      return {
        errors: {
          _form: ["This email is already in use with different provider"],
        },
      };
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            errors: {
              _form: ["Invalid credentials"],
            },
          };
        default:
          return {
            errors: {
              _form: ["Something went wrong"],
            },
          };
      }
    }
    throw error;
  }
}

export async function githubSignIn() {
  return signIn("github", { redirectTo: DEFAULT_LOGGED_IN_REDIRECT });
}

export async function googleSignIn() {
  return signIn("google", { redirectTo: DEFAULT_LOGGED_IN_REDIRECT });
}

export async function appleSignIn() {
  return signIn("apple", { redirectTo: DEFAULT_LOGGED_IN_REDIRECT });
}
