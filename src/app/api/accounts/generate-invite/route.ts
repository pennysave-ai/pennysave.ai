import crypto from "crypto";
import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { getUserAccounts } from "@/data/accounts";
import { createAccountInvite } from "@/data/accountInvites";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { accountId } = await req.json();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the account
    const accounts = await getUserAccounts(user.id);
    const account = accounts.find((a) => a.id === accountId);
    const isOwner = account?.userAccess.find(
      (access) => access.userId === user.id && access.role === "owner"
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Only account owners can create invites" },
        { status: 403 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Create invite
    await createAccountInvite({
      accountId,
      createdById: user.id,
      token,
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_URL}/invite/${token}`;

    return NextResponse.json({
      inviteLink,
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
