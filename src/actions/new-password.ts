"use server";

import { db } from "@/db";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { resetPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { DEFAULT_LOGGED_IN_REDIRECT } from "@/routes";
import { signIn } from "@/auth";

interface ResetPasswordErrors {
  errors: {
    password?: string[];
    password2?: string[];
    _form?: string[];
  };
  success?: {
    _form?: string[];
  };
}

export async function setNewPassword(
  _: ResetPasswordErrors,
  formData: FormData
): Promise<ResetPasswordErrors> {
  const password = formData.get("password");
  const password2 = formData.get("password2");
  const token = formData.get("token") as string;
  if (!password || !password2) {
    return {
      errors: {
        _form: ["Password is required"],
      },
    };
  }
  const validationResult = resetPasswordSchema.safeParse({
    password,
    password2,
  });
  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
    };
  }
  if (password !== password2) {
    return {
      errors: {
        _form: ["Passwords do not match"],
      },
    };
  }
  if (!token) {
    return {
      errors: {
        _form: ["Token is required"],
      },
    };
  }
  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken) {
    return {
      errors: {
        _form: ["Invalid token"],
      },
    };
  }
  if (new Date(existingToken.expires) < new Date()) {
    return {
      errors: {
        _form: ["Token has expired"],
      },
    };
  }
  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) {
    return {
      errors: {
        _form: ["Email does not exist"],
      },
    };
  }
  const hashedPassword = await bcrypt.hash(validationResult.data.password, 10);
  await db.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  await db.passwordResetToken.delete({
    where: {
      id: existingToken.id,
    },
  });

  // Sign the user in with a new password
  try {
    await signIn("credentials", {
      email: existingUser.email,
      password: validationResult.data.password,
      redirectTo: DEFAULT_LOGGED_IN_REDIRECT,
    });
    return {
      errors: {},
    };
  } catch (error: unknown) {
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
