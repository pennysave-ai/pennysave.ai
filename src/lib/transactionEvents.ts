import { getCategoryResolvers } from "@/data/categoryMappings";
import { sendWebSocketMessage } from "@/lib/websocket";
import { Transaction } from "@/types";
import { BroadcastType } from "@/wstypes";

/**
 * Tells everyone on the row's account that it was created or edited, each
 * with the row as *they* see it.
 *
 * `row` is the author's copy, whose `category` is the author's own. Sent
 * as-is, it filed a partner's row under a category the recipient doesn't
 * have, and the app put it in To sort even when a mapping or a pick of theirs
 * said otherwise. So the category is resolved per recipient here, the same
 * rule `GET /api/transactions` applies, and each gets a message of their own.
 *
 * Never throws: a missed event is caught up by the app's refetch on wake.
 * Send it from `after()`: the socket server can take long enough to wake that
 * awaiting it would time the request out, and a bare unawaited promise may be
 * stopped by a serverless host once the response is out.
 */
export async function notifyTransactionChanged(
  type: BroadcastType.TRANSACTION_CREATED | BroadcastType.TRANSACTION_UPDATED,
  row: Transaction,
  recipients: string[],
  senderId: string,
) {
  try {
    const resolvers = await getCategoryResolvers(recipients);
    const source = row.sourceCategory ?? row.category;
    await Promise.allSettled(
      recipients.map((viewerId) =>
        sendWebSocketMessage(
          {
            type,
            recipients: [viewerId],
            data: {
              ...row,
              category:
                resolvers.get(viewerId)?.resolve(source, row.id) ?? null,
              sourceCategory: source,
            },
          },
          senderId,
        ),
      ),
    );
  } catch (error) {
    console.error(`Error sending ${type}:`, error);
  }
}

/** Tells everyone who could see these rows that they are gone. */
export async function notifyTransactionsDeleted(
  ids: string[],
  recipients: string[],
  senderId: string,
) {
  if (!ids.length || !recipients.length) return;
  try {
    await sendWebSocketMessage(
      { type: BroadcastType.TRANSACTION_DELETED, recipients, data: { ids } },
      senderId,
    );
  } catch (error) {
    console.error("Error sending TRANSACTION_DELETED:", error);
  }
}
