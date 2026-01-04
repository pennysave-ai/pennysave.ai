import { db } from "@/db";
import { v4 as uuid } from "uuid";
import { accountSchema } from "@/schemas";
import { stripe } from "@/data/stripe";
import { hasActiveAppleSubscription } from "@/data/user";
import { Account } from "@/types";

// TODO : Move to types
export type CreateAccount = {
  name: string;
  currencyId: string;
  institutionName: string;
};

export const accountSelect = {
  id: true,
  name: true,
  institutionName: true,
  currency: {
    select: { id: true, name: true, symbol: true, exchangeRate: true },
  },
  userAccess: {
    select: {
      role: true,
      userId: true,
      user: {
        select: {
          name: true,
          image: true,
          email: true,
        },
      },
    },
  },
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
 * @returns {Promise<Account>} - Promise object represents the account data
 * @throws {Error} - If the account creation fails
 */
export async function createAccount(
  name: string,
  userId: string,
  currencyId: string,
  institutionName?: string
): Promise<Account> {
  const validationResult = accountSchema.safeParse({
    name,
    currencyId,
  });
  if (!validationResult.success) {
    throw new Error("Bad Request");
  }

  // Create account and userAccess in one operation with nested create
  const account = await db.userAccount.create({
    data: {
      id: uuid(),
      name,
      currencyId,
      institutionName,
      userAccess: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
    select: accountSelect,
  });
  return {
    id: account.id,
    name: account.name,
    currency: account.currency,
    users: account.userAccess.map((access) => ({
      id: access.userId,
      role: access.role as "owner" | "member",
      name: access.user.name,
      image: access.user.image,
      email: access.user.email,
    })),
    institution: {
      name: account.institutionName || "",
    },
  };
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
 * @returns {Promise<Account>} - Promise object represents the updated account
 * @throws {Error} - If the account update fails
 */
export async function updateAccount(
  id: string,
  name: string,
  currencyId: string,
  userId: string,
  institutionName?: string
): Promise<Account> {
  const account = await db.userAccount.update({
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
    select: accountSelect,
  });
  return {
    id: account.id,
    name: account.name,
    currency: account.currency,
    users: account.userAccess.map((access) => ({
      id: access.userId,
      role: access.role as "owner" | "member",
      name: access.user.name,
      image: access.user.image,
      email: access.user.email,
    })),
    institution: {
      name: account.institutionName || "",
    },
  };
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
 * @returns {Promise<Account[]>} - Promise object represents the user accounts
 * @throws {Error} - If the account retrieval fails
 */
// TODO add pagination here
export async function getUserAccounts(userId: string): Promise<Account[]> {
  const accounts = await db.userAccount.findMany({
    select: {
      ...accountSelect,
      userAccess: {
        ...accountSelect.userAccess,
        select: {
          ...accountSelect.userAccess.select,
          user: {
            select: {
              ...accountSelect.userAccess.select.user.select,
              appleSubscriptionStatus: true,
            },
          },
        },
      },
    },
    where: {
      userAccess: {
        some: { userId },
      },
    },
  });

  // Filter accounts where:
  // 1. User is the owner (always include, regardless of subscription)
  // 2. User is NOT the owner, but the owner has an active subscription
  const filteredAccounts = accounts.filter((account) => {
    const userAccess = account.userAccess.find(
      (access) => access.userId === userId
    );

    // If user is the owner, always include
    if (userAccess?.role === "owner") return true;

    // If user is not the owner, check if owner has active subscription
    const ownerAccess = account.userAccess.find(
      (access) => access.role === "owner"
    );

    if (!ownerAccess) return false;

    const ownerSubscriptionStatus =
      ownerAccess.user.appleSubscriptionStatus || "inactive";
    return hasActiveAppleSubscription(ownerSubscriptionStatus);
  });
  // If owner does not have subscription, filter userAccess to only include self in userAccess array
  filteredAccounts.forEach((account: { userAccess: any[] }) => {
    const userAccess = account.userAccess.find(
      (access) => access.userId === userId
    );
    const ownerAccess = account.userAccess.find(
      (access) => access.role === "owner"
    );
    const ownerSubscriptionStatus =
      ownerAccess?.user.appleSubscriptionStatus || "inactive";
    if (
      userAccess?.role === "owner" &&
      !hasActiveAppleSubscription(ownerSubscriptionStatus)
    ) {
      account.userAccess = [userAccess!];
    }
  });

  return filteredAccounts.map((account) => ({
    id: account.id,
    name: account.name,
    currency: {
      id: account.currency.id,
      name: account.currency.name,
      symbol: account.currency.symbol,
      exchangeRate: account.currency.exchangeRate,
    },
    users: account.userAccess.map((access) => ({
      id: access.userId,
      role: access.role as "owner" | "member", // ✅ Type cast
      name: access.user.name,
      image: access.user.image,
      email: access.user.email,
    })),
    institution: {
      name: account.institutionName || "",
    },
  }));
}

/**
 * Get user accounts number
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the user accounts number
 */
export async function getUserAccountsCount(userId: string) {
  // Get all accounts with access details
  const accounts = await db.userAccount.findMany({
    where: {
      userAccess: {
        some: { userId },
      },
    },
    select: {
      id: true,
      userAccess: {
        select: {
          role: true,
          userId: true,
          user: {
            select: { appleSubscriptionStatus: true },
          },
        },
      },
    },
  });

  // Filter accounts where user is owner OR owner has active subscription
  const filteredAccounts = accounts.filter((account) => {
    const userAccess = account.userAccess.find(
      (access) => access.userId === userId
    );

    // If user is the owner, always include
    if (userAccess?.role === "owner") return true;

    // If user is not owner, check if owner has active subscription
    const ownerAccess = account.userAccess.find(
      (access) => access.role === "owner"
    );

    if (!ownerAccess) return false;

    const ownerSubscriptionStatus =
      ownerAccess.user.appleSubscriptionStatus || "inactive";

    return hasActiveAppleSubscription(ownerSubscriptionStatus);
  });

  return filteredAccounts.length;
}

/** Get UserIDs with whom the current user shared his accounts
 * @param {String} userId - User ID
 * @returns {Promise<String[]>} - List of User IDs
 */
export async function getSharedAccountUserIds(
  userId: string
): Promise<string[]> {
  const result = await db.userAccountAccess.findMany({
    where: {
      userAccount: {
        userAccess: {
          some: {
            userId,
            role: "owner",
          },
        },
      },
      userId: {
        not: userId,
      },
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  });
  return result.map((item) => item.userId);
}

/**
 * Remove user from account
 * @param {String} accountId - Account ID
 * @param {String} userId - User ID
 * @returns {Promise} - Promise object represents the removal operation
 */
export async function removeUserFromAccount(accountId: string, userId: string) {
  return await db.userAccountAccess.deleteMany({
    where: {
      userAccountId: accountId,
      userId,
    },
  });
}
