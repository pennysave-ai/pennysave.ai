import { db } from "@/db";
import { WebSocket } from "ws";
import { encrypt, decrypt } from "@/utils/crypto";
import { BroadcastType } from "@/wstypes";
import {
  getAllTransactions,
  deleteItem,
  getInstitution,
  getAccounts,
} from "../lib/plaid";
import { convertAmountToMilliunits } from "@/lib/utils";
import { deleteAccountsByPlaidItemId } from "./accounts";
import { syncTransactions } from "./transactions";

/**
 * Notify the user about the changes
 * @param {String} userId - User ID
 * @returns {void}
 */
function notifyUser(userId: string) {
  const PROTOCOL = process.env.NODE_ENV === "production" ? "wss" : "ws";
  const HOST = process.env.NEXT_PUBLIC_WEBSOCKET_HOST;
  const PORT = process.env.NEXT_PUBLIC_WEBSOCKET_PORT;
  const ws: WebSocket = new WebSocket(
    `${PROTOCOL}://${HOST}:${PORT}?id=PLAID_WEBHOOK`
  );
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
}

/**
 * Process new incoming transactions from Plaid
 * @param {String} itemId - Plaid Item ID
 * @return {void}
 */
export async function processNewTransactions(itemId: string) {
  console.log(
    `webhook:SYNC_UPDATES_AVAILABLE.TRANSACTIONS: Plaid_item_id ${itemId}: New transactions available`
  );
  try {
    // Get the access token based on incoming plaid item id
    const data = await db.plaidItem.findFirst({
      where: {
        plaidItemId: itemId,
      },
      select: {
        accessToken: true,
        transactionCursor: true,
        userId: true,
      },
    });
    if (!data) {
      throw new Error(`No data found for Plaid item id ${itemId}`);
    }
    // Extract access token
    const accessToken = decrypt(data.accessToken);
    await syncTransactions(
      accessToken,
      itemId,
      data.userId,
      data.transactionCursor
    );
    notifyUser(data.userId);
  } catch (err) {
    console.error(
      `Error processing incoming Plaid Transactions for Plaid item ${itemId} - ${err}`
    );
  }
}

/**
 * Process newly connected Plaid Item/Bank Institution
 * @param {String} accessToken - Plaid access Token
 * @param {String} userId - User ID
 * @param {Array<{id: string, name: string}>} currencies - Currencies data
 * @param {String} institutionId - Plaid Institution ID
 * @param {String} institutionName - Plaid Institution Name
 * @param {String} plaidItemId - Plaid Item ID
 * @returns {void}
 */

export async function processNewPlaidItem(
  accessToken: string,
  userId: string,
  currencies: { id: string; name: string }[],
  institutionId: string,
  institutionName: string,
  plaidItemId: string
) {
  console.log(
    `webhook:SESSION_FINISHED: Plaid_item_id ${plaidItemId}: New Plaid Item connected`
  );
  try {
    // Get the institution details
    const institutionDetails = await getInstitution(institutionId);
    // Get Accounts details
    const accountsData = await getAccounts(accessToken);
    // Get Transactions from Plaid
    const {
      added,
      modified,
      cursor: lastCursor,
    } = await getAllTransactions(accessToken);
    const transactions = added.concat(modified);

    // Payload to create a new Plaid Item
    const createPlaidItemPromise = db.plaidItem.create({
      data: {
        plaidItemId,
        userId,
        accessToken: encrypt(accessToken),
        institutionId,
        institutionName,
        institutionUrl: institutionDetails.institution.url,
        institutionPrimaryColor: institutionDetails.institution.primary_color,
      },
    });
    // Payload to create a new Plaid accounts
    const createPlaidAccountsPromise = db.userAccount.createMany({
      data: accountsData?.accounts.map((account) => ({
        plaidAccountId: account.account_id,
        userId,
        name: account.name,
        plaidItemId,
        plaidMask: account.mask,
        plaidBalance: account.balances.current,
        plaidType: account.type,
        institutionName,
        currencyId:
          currencies?.find(
            (currency) => currency.name === account.balances?.iso_currency_code
          )?.id || "",
      })),
    });

    // Create Plaid Item and Accounts first before processing transactions
    // as we need to have accounts created to populate transaction accountId relation field
    // combine both operations in a single transaction to make sure all operations are made or none
    await db.$transaction([createPlaidItemPromise, createPlaidAccountsPromise]);

    // Get all user accounts to populate transaction accountId relation field
    const userAccounts = await db.userAccount.findMany({
      where: { userId },
      select: {
        id: true,
        plaidAccountId: true,
      },
    });

    // Payload to upsert transactions
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

    const upsertTransactionsPromises = upsertPayload.map((transaction) =>
      db.transaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction,
      })
    );

    // Update the cursor Promise
    const updateCursorPromise = db.plaidItem.update({
      where: { plaidItemId },
      data: { transactionCursor: lastCursor },
    });

    // Combine upsert transactions and update cursor operations in a single transaction
    // to make sure all operations are made or none
    await db.$transaction([...upsertTransactionsPromises, updateCursorPromise]);
    notifyUser(userId);
  } catch (err) {
    console.error(`Error creating new Plaid Item ${plaidItemId} - ${err}`);
  }
}

/**
 * Process existing Plaid Item/Bank Institution
 * @param {String} prevPlaidId - Previous Plaid Item ID
 * @param {String} plaidItemId - Plaid Item ID
 * @param {String} accessToken - Plaid access Token
 * @param {String} previousAccessToken - Previous Plaid access Token
 * @param {String} plaidId - uuid of Plaid Item record from the database
 * @param {String} userId - User ID
 * @param {Array<{id: string, name: string}>} currencies - Currencies data
 * @returns {void}
 */
export async function processExistingPlaidItem(
  prevPlaidId: string,
  plaidItemId: string,
  accessToken: string,
  previousAccessToken: string,
  plaidId: string,
  userId: string,
  currencies: { id: string; name: string }[]
) {
  // Deleting all previous plaid accounts along with transactions
  await deleteAccountsByPlaidItemId(prevPlaidId);
  // Get new picked accounts details
  const accountsData = await getAccounts(accessToken);
  // Update the Plaid Item with the new access token promise
  // NOTE We cannot use db.$transactions to execute plaidItem update and userAccount createMany
  // because we need fresh plaidItem id to create userAccounts
  // since we are updating existing plaidItem not removing it
  await db.plaidItem.update({
    where: { id: plaidId, userId },
    data: {
      accessToken: encrypt(accessToken),
      transactionCursor: null,
      plaidItemId,
    },
  });
  // Create a new accounts
  await db.userAccount.createMany({
    data: accountsData?.accounts.map((account) => ({
      plaidAccountId: account.account_id,
      userId,
      name: account.name,
      plaidItemId,
      plaidMask: account.mask,
      plaidBalance: account.balances.current,
      plaidType: account.type,
      institutionName: accountsData.item.institution_name,
      currencyId:
        currencies?.find(
          (currency) => currency.name === account.balances?.iso_currency_code
        )?.id || "",
    })),
  });
  await syncTransactions(accessToken, plaidItemId, userId);
  // Remove the old item from the Plaid API
  await deleteItem(decrypt(previousAccessToken));
  // Notify the user about the changes
  notifyUser(userId);
}
