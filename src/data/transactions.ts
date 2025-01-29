import { WebSocket } from "ws";

import { db } from "@/db";
import { BroadcastType } from "@/wstypes";
import { getAllTransactions } from "../lib/plaid";
import { convertAmountToMilliunits } from "@/lib/utils";

const PROTOCOL = process.env.NODE_ENV === "production" ? "wss" : "ws";
const HOST = process.env.NEXT_PUBLIC_WEBSOCKET_HOST;
const PORT = process.env.NEXT_PUBLIC_WEBSOCKET_PORT;
const ws = new WebSocket(`${PROTOCOL}://${HOST}:${PORT}?id=PLAID_WEBHOOK`);

/**
 * Updates Transactions in the database
 * @param {String} accessToken
 * @param {String | null} cursor
 * @param {String} userId
 * @param {String} plaidItemId
 * @returns {void}
 */
export async function updateTransactionsAndCategories(
  accessToken: string,
  cursor: string | null = null,
  userId: string,
  plaidItemId: string
) {
  try {
    // getting all transactions from Plaid
    const {
      added,
      modified,
      removed,
      cursor: lastCursor,
    } = await getAllTransactions(accessToken, cursor);
    const transactions = added.concat(modified);

    console.log("@transactions", transactions.length);
    // TODO Upsert categories

    // Get user accounts
    const userAccounts = await db.userAccount.findMany({
      where: { userId },
      select: {
        id: true,
        plaidAccountId: true,
      },
    });

    const upsertPayload = transactions.map((transaction) => ({
      id: transaction.transaction_id,
      createdAt: transaction.datetime
        ? new Date(transaction.datetime).toISOString()
        : new Date(transaction.date).toISOString(),
      amount: convertAmountToMilliunits(transaction.amount),
      payee: transaction.merchant_name || transaction.name,
      accountId: userAccounts.find(
        ({ plaidAccountId }) => plaidAccountId === transaction.account_id
      )?.id as string,
      logo: transaction.logo_url,
      plaidCategoryConfidenceLeveL:
        transaction.personal_finance_category?.confidence_level,
      plaidCategoryPrimary: transaction.personal_finance_category?.primary,
      plaidCategoryDetailed: transaction.personal_finance_category?.detailed,
      plaidPaymentChannel: transaction.payment_channel,
      plaidAdress: transaction.location?.address,
      plaidCity: transaction.location?.city,
      plaidCountry: transaction.location?.country,
      plaidLatitude: transaction.location?.lat,
      plaidLongitude: transaction.location?.lon,
      plaidPostalCode: transaction.location?.postal_code,
      plaidRegion: transaction.location?.region,
      plaidStoreNumber: transaction.location?.store_number,
      //   categoryId: transaction.personal_finance_category?.primary,
    }));

    const upsertTransactions = upsertPayload.map((transaction) =>
      db.transaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction,
      })
    );

    // Delete removed transactions
    const deletePromises = removed.map((transaction) =>
      db.transaction.delete({ where: { id: transaction.transaction_id } })
    );

    await db.$transaction(deletePromises);
    await db.$transaction(upsertTransactions);

    // Update the cursor
    await db.plaidItem.update({
      where: { plaidItemId },
      data: { transactionCursor: lastCursor },
    });

    // Notify the user about the changes
    ws.on("open", function open() {
      ws.send(
        JSON.stringify({
          type: BroadcastType.BANK_DATA_UPDATED,
          recipient: userId,
        })
      );
      ws.close();
    });
  } catch (error) {
    console.error(error);
    return error;
  }
}
