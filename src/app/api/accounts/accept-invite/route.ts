import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  getAccountInviteByToken,
  markAccountInviteAsUsed,
} from "@/data/accountInvites";
import {
  userHasAccessToAccount,
  createUserAccountAccess,
} from "@/data/userAccounts";
import { client } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { token } = await req.json();
    console.log("Accepting invite with token:", token);
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    const invite = await getAccountInviteByToken(token);

    if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    // Check if user already has access
    const existingAccess = await userHasAccessToAccount(
      user.id,
      invite.accountId
    );

    if (existingAccess) {
      return NextResponse.json(
        { error: "Already have access" },
        { status: 400 }
      );
    }

    // Grant access as collaborator
    await createUserAccountAccess(user.id, invite.accountId, "collaborator");

    // Mark invite as used
    await markAccountInviteAsUsed(invite.token);
    // Clear cached invite
    await client.del(`invite:active:${invite.accountId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
