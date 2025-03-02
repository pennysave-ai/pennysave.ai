import { db } from "@/db";
import { v4 as uuid } from "uuid";
import { accountSchema } from "@/schemas";
import { ExtendedAccountResponseType } from "@/lib/plaid";

export type CreateAccount = {
  name: string;
  currencyId: string;
  institutionName: string;
};

/**
 * Deletes accounts by plaidItemId
 * @param {String} plaidItemId - Plaid Item ID
 * @returns {void}
 */
export async function deleteAccountsByPlaidItemId(plaidItemId: string) {
  await db.userAccount.deleteMany({
    where: {
      plaidItemId,
    },
  });
}

/**
 * Creates a new Plaid accounts
 * @param {Array} accountsData - Plaid Accounts data
 * @param {String} userId - User ID
 * @param {Array} currencies - Currencies data
 * @returns {void}
 */
export async function createPlaidAccounts(
  accountsData: ExtendedAccountResponseType,
  userId: string,
  currencies: { name: string; id: string }[]
) {
  await db.userAccount.createMany({
    data: accountsData?.accounts.map((account) => ({
      plaidAccountId: account.account_id,
      userId,
      name: account.name,
      plaidItemId: accountsData.item.item_id,
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
}

/**
 * Get user account Name
 * @param {String} userId - User ID
 * @param {String} name - Account Name
 * @returns {Array<{id: string, name: id}>} - Array of account Id's
 */
export async function getUserAccountIdsByName(userId: string, name: string) {
  const accounts = await db.userAccount.findMany({
    where: {
      userId,
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      institutionName: true,
    },
  });
  return accounts;
}

/**
 * Creates a new user account
 * @param {String} name - Account name
 * @param {String} userId - User ID
 * @param {String} currencyId - Currency ID
 * @param {String} institutionName - Institution Name
 * @returns {Promise} - Promise object represents the account data
 * @throws {Error} - If the account creation fails
 */
export async function createAccount(
  name: string,
  userId: string,
  currencyId: string,
  institutionName?: string
) {
  const validationResult = accountSchema.safeParse({
    name,
    currencyId,
  });
  if (!validationResult.success) {
    throw new Error("Bad Request");
  }
  const account = await db.userAccount.create({
    data: {
      id: uuid(),
      name,
      userId,
      currencyId,
      institutionName,
    },
  });
  return { id: account.id };
}

/**
 * Delete user accounts
 * @param {String[]} accountIds - Account Ids
 * @param {String} userId - user Id
 * @returns {Promise} - Promise object represents the deleted accounts
 * @throws {Error} - If the account deletion fails
 */
export async function deleteAccounts(accountIds: string[], userId: string) {
  const accounts = await db.userAccount.deleteMany({
    where: {
      id: {
        in: accountIds,
      },
      userId,
    },
  });
  return accounts;
}

/**
 * Update user account
 * @param {String} id - Account ID
 * @param {String} name - Account Name
 * @param {String} currencyId - Currency ID
 * @param {String} userId - User ID
 * @param {String} institutionName - Institution Name
 * @returns {Promise} - Promise object represents the updated account
 * @throws {Error} - If the account update fails
 */
export async function updateAccount(
  id: string,
  name: string,
  currencyId: string,
  userId: string,
  institutionName?: string
) {
  const accounts = await db.userAccount.update({
    where: { id, userId },
    data: {
      name,
      currencyId,
      institutionName,
    },
  });
  return accounts;
}

/**
 * Get user accounts
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the user accounts
 * @throws {Error} - If the account retrieval fails
 */
// TODO add pagination here
export async function getUserAccounts(userId: string) {
  const accounts = await db.userAccount.findMany({
    select: {
      id: true,
      name: true,
      currency: {
        select: { id: true, name: true, symbol: true },
      },
      institutionName: true,
      plaidMask: true,
      plaidItem: {
        select: {
          institutionName: true,
          institutionPrimaryColor: true,
        },
      },
    },
    where: {
      userId,
    },
  });
  return accounts;
}

/**
 * Get user accounts number
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the user accounts number
 */
export async function getUserAccountsCount(userId?: string) {
  return await db.userAccount.count({ where: { userId } });
}
