import { db } from "@/db";
import { v4 as uuid } from "uuid";

export async function generateVerificationToken(email: string) {
  const token = uuid();
  // Token is valid for 1 hour
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  // Check if the user already has a token
  const existingToken = await db.verificationToken.findFirst({
    where: { email },
  });
  if (existingToken) {
    await db.verificationToken.delete({
      where: { id: existingToken?.id },
    });
  }
  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });
  return verificationToken;
}

export async function getVerificationTokenByToken(token: string) {
  return db.verificationToken.findFirst({
    where: { token },
  });
}
