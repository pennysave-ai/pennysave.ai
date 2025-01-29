"use server";
import { db } from "@/db";
import { getUserByEmail } from "@/data";
import { getVerificationTokenByToken } from "@/data";

export async function verifyEmail(token: string) {
  const verificationToken = await getVerificationTokenByToken(token);
  if (!verificationToken) {
    return {
      errors: {
        _form: ["Token does not exist"],
      },
    };
  }
  if (new Date(verificationToken.expires) < new Date()) {
    return {
      errors: {
        _form: ["Verification token has expired"],
      },
    };
  }
  const user = await getUserByEmail(verificationToken.email);
  if (!user) {
    return {
      errors: {
        _form: ["Email does not exist"],
      },
    };
  }
  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      email: verificationToken.email,
    },
  });
  await db.verificationToken.delete({
    where: { id: verificationToken.id },
  });
  return {
    success: {
      _form: ["Your email has been verified"],
    },
  };
}
