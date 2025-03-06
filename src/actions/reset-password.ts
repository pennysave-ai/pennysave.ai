"use server";

import { getUserByEmail } from "@/data";
import { forgotPasswordSchema } from "@/schemas";
import { sendResetPasswordEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/data/verification-token";

interface ResetPasswordErrors {
  errors: {
    email?: string[];
    _form?: string[];
  };
  success?: {
    _form?: string[];
  };
}

export async function resetPassword(
  _: ResetPasswordErrors,
  formData: FormData
): Promise<ResetPasswordErrors> {
  const email = formData.get("email");
  // Validate the form data
  const validationResult = forgotPasswordSchema.safeParse({
    email,
  });
  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
    };
  }
  const existingUser = await getUserByEmail(validationResult.data.email);
  if (!existingUser) {
    return {
      errors: {
        _form: ["Email not found"],
      },
    };
  }
  const passwordResetToken = await generatePasswordResetToken(
    validationResult.data.email
  );
  await sendResetPasswordEmail(
    passwordResetToken.email,
    passwordResetToken.token
  );
  return {
    errors: {},
    success: {
      _form: ["Reset password email sent, please check your inbox"],
    },
  };
}
