import { db } from "@/db";
import { v4 as uuid } from "uuid";
import { accountSchema } from "@/schemas";
import { stripe } from "@/data/stripe";

export type CreateAccount = {
  name: string;
  currencyId: string;
  institutionName: string;
};

/**
 * Get Stripe Account by ID
 * @param {String} stripeAccountId - Stripe Account ID
 * @returns {Promise} - Promise object represents the Stripe Account
 */
export async function getStripeAccountById(stripeAccountId: string) {
  return await db.userAccount.findFirst({
    where: { stripeAccountId },
    select: {
      id: true,
      stripeAccountId: true,
      stripeLastTransactionsRefreshId: true,
      userAccess: {
        where: { role: "owner" },
        select: { userId: true },
        take: 1, // Get only the first owner
      },
    },
  });
}

/**
 * Upsert Stripe Accounts
 * @param {Array} accountsData - Stripe Accounts data
 * @returns {Promise} - Promise object represents the upserted accounts
 */
export async function upsertStripeAccounts(
  accountsData: {
    name: string;
    institutionName?: string;
    stripeAccountId: string;
    last4?: string;
    balance?: number;
    stripeAccountType?: string;
    currencyId: string;
    userId: string;
  }[]
) {
  for (const account of accountsData) {
    const {
      name,
      institutionName,
      stripeAccountId,
      last4,
      balance,
      stripeAccountType,
      currencyId,
      userId,
    } = account;

    // Check if a record with the given stripeAccountId exists
    const existingAccount = await db.userAccount.findFirst({
      where: { stripeAccountId },
    });

    if (existingAccount) {
      // Update the existing record
      await db.userAccount.update({
        where: { id: existingAccount.id },
        data: {
          name,
          institutionName,
          last4,
          balance,
          stripeAccountType,
          currencyId,
        },
      });
    } else {
      // Create a new record
      const accountId = uuid();
      const createAccountTransaction = db.userAccount.create({
        data: {
          id: accountId,
          name,
          institutionName,
          stripeAccountId,
          last4,
          balance,
          stripeAccountType,
          currencyId,
        },
      });
      const createUserAccountAccessTransaction = db.userAccountAccess.create({
        data: {
          userId,
          userAccountId: accountId,
          role: "owner",
        },
      });

      await db.$transaction([
        createAccountTransaction,
        createUserAccountAccessTransaction,
      ]);
    }
  }
}

/**
 * Delete and disconnect Stripe Accounts by institution name
 * @param {String} institutionName - Institution Name
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the deleted accounts
 * @throws {Error} - If the account deletion fails
 */
export async function deleteStripeAccountsByInstitutionName(
  institutionName: string,
  userId: string
) {
  // Delete all accounts by institution name
  const stripeAccounts = await db.userAccount.findMany({
    where: {
      institutionName,
      userAccess: {
        some: { userId, role: "owner" },
      },
      stripeAccountId: {
        not: null,
      },
    },
    select: {
      id: true,
      stripeAccountId: true,
    },
  });
  // Unlink stripe accounts
  stripeAccounts.forEach(async (account) => {
    await stripe.financialConnections.accounts.disconnect(
      account.stripeAccountId!
    );
  });
  await db.userAccount.deleteMany({
    where: {
      id: {
        in: stripeAccounts.map((account) => account.id),
      },
      institutionName,
      userAccess: {
        some: { userId, role: "owner" },
      },
    },
  });
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
  const newAccountId = uuid();
  const newAccountQuery = db.userAccount.create({
    data: {
      id: newAccountId,
      name,
      currencyId,
      institutionName,
    },
  });
  const newAccountAccessQuery = db.userAccountAccess.create({
    data: {
      userId,
      userAccountId: newAccountId,
      role: "owner",
    },
  });
  await db.$transaction([newAccountQuery, newAccountAccessQuery]);
  return { id: newAccountId };
}

/**
 * Delete user accounts
 * @param {String[]} accountIds - Account Ids
 * @param {String} userId - user Id
 * @returns {Promise} - Promise object represents the deleted accounts
 * @throws {Error} - If the account deletion fails
 */
export async function deleteAccounts(accountIds: string[], userId: string) {
  const stripeAccounts = await db.userAccount.findMany({
    where: {
      id: {
        in: accountIds,
      },
      userAccess: {
        some: { userId, role: "owner" },
      },
    },
    select: {
      id: true,
      stripeAccountId: true,
    },
  });
  // Unlink stripe accounts
  stripeAccounts
    ?.filter((a) => a.stripeAccountId)
    .forEach(async (account) => {
      await stripe.financialConnections.accounts.disconnect(
        account.stripeAccountId!
      );
    });
  const accounts = await db.userAccount.deleteMany({
    where: {
      id: {
        in: accountIds,
      },
      userAccess: {
        some: { userId, role: "owner" },
      },
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
    where: {
      id,
      userAccess: {
        some: { userId, role: "owner" },
      },
    },
    data: {
      name,
      currencyId,
      institutionName,
    },
  });
  return accounts;
}

/**
 * Update last transaction refreshID
 * @param {String} id - Account ID
 * @param {String} refreshID - Refresh ID
 * @returns {Promise} - Promise object represents the updated account
 */

export async function updateLastTransactionRefreshId(
  id: string,
  refreshID: string
) {
  return await db.userAccount.update({
    where: { id },
    data: {
      stripeLastTransactionsRefreshId: refreshID,
    },
  });
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
        select: { id: true, name: true, symbol: true, exchangeRate: true },
      },
      userAccess: {
        select: {
          role: true,
          userId: true,
          user: { select: { name: true, image: true } },
        },
      },
      institutionName: true,
      last4: true,
    },
    where: {
      userAccess: {
        some: { userId },
      },
    },
  });
  return accounts;
}

/**
 * Get user accounts number
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the user accounts number
 */
export async function getUserAccountsCount(userId: string) {
  return await db.userAccount.count({
    where: {
      userAccess: { some: { userId } },
    },
  });
}
