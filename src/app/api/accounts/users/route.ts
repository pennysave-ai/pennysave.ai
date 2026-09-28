import { NextRequest, NextResponse, after } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { getUserAccounts, removeUserFromAccount } from "@/data/accounts";
import {
  notifyAccountRemoved,
  notifyAccountUpdated,
} from "@/lib/accountEvents";

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  try {
    const { accountId, userId } = await req.json();
    // Paused accounts too: leaving is the one thing a member can still do
    // once the owner's subscription has lapsed.
    const userAccounts = await getUserAccounts(user.id, { includePaused: true });
    const accountIds = userAccounts.map((account) => account.id);
    if (!accountIds.includes(accountId)) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { users } = userAccounts.find((account) => account.id === accountId)!;
    // The owner can remove anyone; a member can only remove themselves (leave)
    const owner = users.find(({ role }) => role === "owner");
    if (owner?.id !== user.id && userId !== user.id) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    // Check if the user to be removed exists in the account
    const userIds = users.map(({ id }) => id);
    if (!userIds.includes(userId)) {
      return NextResponse.json("User not found in account", { status: 404 });
    }
    // Prevent removing the owner
    if (owner?.id === userId) {
      return NextResponse.json("Cannot remove account owner", { status: 400 });
    }
    // Proceed to remove the user from the account
    await removeUserFromAccount(accountId, userId);
    // For the person taken off, the account is gone; for everyone still on
    // it, its member list changed.
    const actorId = user.id;
    after(() =>
      Promise.all([
        notifyAccountRemoved(accountId, [userId], actorId),
        notifyAccountUpdated(accountId, actorId),
      ]),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error while removing user from account:", error);
    return NextResponse.json("Error while removing user from account", {
      status: 500,
    });
  }
}
