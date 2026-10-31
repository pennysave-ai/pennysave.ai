import { db } from "@/db";
import { getAccountAsSeenByMembers } from "@/data/accounts";
import { sendWebSocketMessage } from "@/lib/websocket";
import { BroadcastType } from "@/wstypes";

// Every sender here is sent from `after()`, so a serverless host doesn't stop
// it once the response is out, and none throws: a missed event is caught up
// by the app's refresh on wake.

/**
 * Sends each person on the account the account as their own list shows it,
 * so the app puts it in place with no refetch — the author's device included,
 * whose echo simply matches what it already applied.
 *
 * Per person because what they see differs: while the owner's subscription is
 * inactive the owner sees only themselves on it and everyone else sees it
 * paused, and an event must not show more than the list would. A paused view
 * goes as ACCOUNT_PAUSED, which only apps that list paused accounts handle.
 */
export async function notifyAccountUpdated(accountId: string, actorId: string) {
  try {
    const views = await getAccountAsSeenByMembers(accountId);
    await Promise.allSettled(
      views
        .filter(({ account }) => account !== null)
        .map(({ viewerId, account }) =>
          sendWebSocketMessage(
            {
              type: account!.paused
                ? BroadcastType.ACCOUNT_PAUSED
                : BroadcastType.ACCOUNT_UPDATED,
              recipients: [viewerId],
              data: { ...account },
            },
            actorId,
          ),
        ),
    );
  } catch (error) {
    console.error("Error sending ACCOUNT_UPDATED:", error);
  }
}

/**
 * The owner's subscription went from active to lapsed or back: every account
 * they own changes for everyone on it — members see it pause or resume, the
 * owner sees the members drop off or come back.
 */
export async function notifyOwnedAccountsUpdated(ownerId: string) {
  try {
    const owned = await db.userAccountAccess.findMany({
      where: { userId: ownerId, role: "owner" },
      select: { userAccountId: true },
    });
    await Promise.allSettled(
      owned.map(({ userAccountId }) => notifyAccountUpdated(userAccountId, ownerId)),
    );
  } catch (error) {
    console.error("Error sending owned account updates:", error);
  }
}
