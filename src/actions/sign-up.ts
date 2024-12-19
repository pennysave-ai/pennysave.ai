"use server";

import { db } from "@/db";
import { signIn } from "@/auth";
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/schemas";
import { DEFAULT_LOGGED_IN_REDIRECT } from "@/routes";

interface SignUserUpErrors {
  errors: {
    username?: string[];
    email?: string[];
    password?: string[];
    password2?: string[];
    _form?: string[];
  };
}

export async function signUp(
  _: SignUserUpErrors,
  formData: FormData
): Promise<SignUserUpErrors> {
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");
  const password2 = formData.get("password2");

  // Validate the form data
  const validationResult = signUpSchema.safeParse({
    email,
    password,
    username,
    password2,
  });

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
    };
  }
  // Check if user already exists
  const user = await db.user.findUnique({
    where: { email } as { email: string },
  });
  if (user) {
    return {
      errors: {
        _form: ["User already exists"],
      },
    };
  }

  const hashedPassword = await bcrypt.hash(password as string, 10);
  try {
    // Create a new user
    await db.user.create({
      data: {
        name: username as string,
        email: email as string,
        password: hashedPassword,
      },
    });
    // eslint-disable-next-line
  } catch (error: unknown) {
    return {
      errors: {
        _form: ["Failed to create a new user"],
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

    return {
      errors: {},
    };
    // eslint-disable-next-line
  } catch (error: unknown) {
    throw error;
  }
}
