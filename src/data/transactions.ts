import { db } from "@/db";
import { convertAmountToMilliunits } from "@/lib/utils";
import { getAllTransactions } from "../lib/plaid";
import { getCategoiresMappings } from "./categories";
/**
 * Fetch all transactions by acess token and write them to the database
 * @param accessToken {String} - Plaid access token
 * @param plaidItemId {String} - Plaid item ID
 * @param userId {String} - User ID
 * @param cursor {String} - Cursor to fetch transactions from a specific point
 * @returns {Promise} - Promise object represents the transactions data
 */
export async function syncTransactions(
  accessToken: string,
  plaidItemId: string,
  userId: string,
  cursor: string | null = null
) {
  // Get all transactions from the new Plaid Item
  const {
    added,
    modified,
    removed,
    cursor: lastCursor,
  } = await getAllTransactions(accessToken, cursor);
  const transactions = added.concat(modified);

  // Get all user accounts to populate transaction accountId relation field
  const userAccounts = await db.userAccount.findMany({
    where: { userId },
    select: {
      id: true,
      plaidAccountId: true,
    },
  });
  const userAccountsMap = new Map(
    userAccounts.map(({ plaidAccountId, id }) => [plaidAccountId, id])
  );

  // Get all user categories to populate transaction categoryId relation field
  const currentCategories = await db.category.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      plaidId: true,
      plaidPrimary: true,
    },
  });

  const currentCategoriesMap = new Map(
    currentCategories.map((category) => {
      const { plaidPrimary, ...rest } = category;
      return [plaidPrimary || "", { ...rest }];
    })
  );

  // Get all Plaid categories to populate transaction categoryId relation field
  const plaidCategories = await db.plaidCategory.findMany({
    select: {
      id: true,
      description: true,
      detailed: true,
      primary: true,
    },
  });

  // Convert transactions to Map a map of personal finance categories
  const transactionsMap = new Map(
    transactions.map(({ transaction_id, personal_finance_category }) => [
      transaction_id,
      {
        id: transaction_id,
        ...personal_finance_category,
      },
    ])
  );

  const mappedCategories = await getCategoiresMappings(
    transactionsMap,
    currentCategoriesMap,
    plaidCategories,
    userId
  );

  // personal_finance_category: {
  //   confidence_level: 'VERY_HIGH',
  //   detailed: 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES',
  //   primary: 'TRANSPORTATION'
  // },

  // Payload to upsert transactions
  const upsertPayload = transactions.map((transaction) => ({
    id: transaction.transaction_id,
    createdAt: transaction.datetime
      ? new Date(transaction.datetime).toISOString()
      : new Date(transaction.date).toISOString(),
    amount: convertAmountToMilliunits(transaction.amount),
    payee: transaction.merchant_name || transaction.name,
    accountId: userAccountsMap.get(transaction.account_id) as string,
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
    categoryId: mappedCategories.get(transaction.transaction_id),
  }));
  // Upsert transactions Promises
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

  // Delete removed transactions
  const deletePromises = removed.map((transaction) =>
    db.transaction.delete({ where: { id: transaction.transaction_id } })
  );

  // Combine upsert transactions and update cursor operations in a single transaction
  // to make sure all operations are made or none
  await db.$transaction([
    ...deletePromises,
    ...upsertTransactionsPromises,
    updateCursorPromise,
  ]);
}
