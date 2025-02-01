import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  getCreateLinkToken,
  createPlaidUser,
  getUpdateLinkToken,
} from "@/lib/plaid";
import { getUserById } from "@/data/user";
import { decrypt, encrypt } from "@/utils/crypto";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const userData = await getUserById(user.id);
  if (!userData) {
    return NextResponse.json("User not found", { status: 404 });
  }

  let userToken = null;

  // If there is no plaidUserToken, create a user in plaid
  if (!userData?.plaidUserToken) {
    // Create user in plaid
    const plaidUser = await createPlaidUser(user.id);
    if (!plaidUser) {
      return NextResponse.json("Failed to create plaid user", { status: 500 });
    }
    // encrypt user token
    const encryptedToken = encrypt(plaidUser.user_token);
    // Save plaid user data in Users DB
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        plaidUserToken: encryptedToken,
        plaidUserId: plaidUser.user_id,
      },
    });
    userToken = plaidUser.user_token;
  } else {
    userToken = decrypt(userData.plaidUserToken);
  }
  const createToken = await getCreateLinkToken(user.id, userToken);
  // Check if user has linked items and create a link tokens with edit mode for this items
  const userItems = await db.plaidItem.findMany({
    where: {
      userId: user.id,
    },
  });
  const update: {
    id: string;
    token: string;
  }[] = [];
  if (userItems.length) {
    for (const item of userItems) {
      console.log("Decrypted Access Token ->", decrypt(item.accessToken));
      const token = await getUpdateLinkToken(
        user.id,
        userToken,
        decrypt(item.accessToken)
      );
      update.push({
        id: item.id,
        token,
      });
    }
  }

  return NextResponse.json({ createToken, update });
}
