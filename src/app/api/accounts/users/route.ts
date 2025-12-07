import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { getUserAccounts, removeUserFromAccount } from "@/data/accounts";

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  try {
    const { accountId, userId } = await req.json();
    const userAccounts = await getUserAccounts(user.id);
    const accountIds = userAccounts.map((account) => account.id);
    if (!accountIds.includes(accountId)) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    const { userAccess } = userAccounts.find(
      (account) => account.id === accountId
    )!;
    // Check if the user is account owner
    const owner = userAccess.find(({ role }) => role === "owner");
    if (owner?.userId !== user.id) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    // Check if the user to be removed exists in the account
    const userIds = userAccess.map(({ userId }) => userId);
    if (!userIds.includes(userId)) {
      return NextResponse.json("User not found in account", { status: 404 });
    }
    // Prevent removing the owner
    if (owner?.userId === userId) {
      return NextResponse.json("Cannot remove account owner", { status: 400 });
    }
    // Proceed to remove the user from the account
    await removeUserFromAccount(accountId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error while removing user from account:", error);
    return NextResponse.json("Error while removing user from account", {
      status: 500,
    });
  }
}
