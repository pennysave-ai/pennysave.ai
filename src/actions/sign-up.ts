"use server";

import { signUpSchema } from "@/schemas";
import { generateVerificationToken } from "@/data/verification-token";
import { sendVerificationEmail } from "@/lib/mail";
import { getUserByEmail, createUserWithPassword } from "@/data/user";

interface SignUserUpErrors {
  errors: {
    username?: string[];
    email?: string[];
    password?: string[];
    password2?: string[];
    _form?: string[];
  };
  success?: {
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
  if (!formData.has("gdprConsent")) {
    return {
      errors: {
        _form: ["Please agree to the privacy policy"],
      },
    };
  }

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
  const user = await getUserByEmail(email as string);
  if (user) {
    return {
      errors: {
        _form: ["User already exists"],
      },
    };
  }

  try {
    // Create a new user
    await createUserWithPassword({
      email: email as string,
      password: password as string,
      name: username as string,
    });
    const verificationToken = await generateVerificationToken(email as string);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return {
      errors: {},
      success: {
        _form: [
          "User created successfully, please check your email for verification",
        ],
      },
    };

    // eslint-disable-next-line
  } catch (error: unknown) {
    return {
      errors: {
        _form: ["Failed to create a new user"],
      },
    };
  }
}
