import { NextResponse } from "next/server";
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
/** `accountSelect` plus the owner's subscription, which decides who sees what. */
const accountWithSubscriptionSelect = {
  ...accountSelect,
  userAccess: {
    ...accountSelect.userAccess,
    select: {
      ...accountSelect.userAccess.select,
      user: {
        select: {
          ...accountSelect.userAccess.select.user.select,
          appleSubscriptionStatus: true,
          appleSubscriptionExpiresAt: true,
        },
      },
    },
  },
};

type AccountWithSubscription = {
  id: string;
  name: string;
  institutionName: string | null;
  currency: { id: string; name: string; symbol: string; exchangeRate: Account["currency"]["exchangeRate"] };
  userAccess: {
    role: string;
    userId: string;
    user: {
      name: string | null;
      image: string | null;
      email: string | null;
      appleSubscriptionStatus: string | null;
      appleSubscriptionExpiresAt?: Date | null;
    };
  }[];
};

export type AccountVisibilityOptions = {
  /**
   * Return a member's account whose owner has lapsed, marked `paused`,
   * instead of hiding it. Opt-in, so app builds that don't know `paused`
   * keep the old behaviour and never offer it as writable.
   */
  includePaused?: boolean;
};

/**
 * Whether `userId` may add to, edit or delete rows on every one of
 * `accountIds`:
 * - `"forbidden"` if any of them doesn't exist or they aren't on it;
 * - `"paused"` if on any of them they are a member and the owner's
 *   subscription has lapsed — sharing is the owner's plan, so the account is
 *   read-only for its members until the owner renews (canvas 9a);
 * - `"ok"` otherwise. The owner can always write to their own account.
 */
export async function getAccountWriteAccess(
  userId: string,
  accountIds: string[],
): Promise<"ok" | "paused" | "forbidden"> {
  const ids = [...new Set(accountIds.filter(Boolean))];
  if (!ids.length) return "forbidden";
  const accounts = await db.userAccount.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      userAccess: {
        select: {
          role: true,
          userId: true,
          user: { select: { appleSubscriptionStatus: true } },
        },
      },
    },
  });
  if (accounts.length !== ids.length) return "forbidden";
  let paused = false;
  for (const account of accounts) {
    const viewer = account.userAccess.find((access) => access.userId === userId);
    if (!viewer) return "forbidden";
    if (viewer.role === "owner") continue;
    const owner = account.userAccess.find((access) => access.role === "owner");
    if (
      !owner ||
      !hasActiveAppleSubscription(owner.user.appleSubscriptionStatus || "inactive")
    ) {
      paused = true;
    }
  }
  return paused ? "paused" : "ok";
}

/** The response for a write `getAccountWriteAccess` refused. */
export function accountWriteRefusal(access: "paused" | "forbidden") {
  // 423 Locked, not 403: the member still has access, and it comes back
  // untouched once the owner renews. The app tells the two apart by status.
  return access === "paused"
    ? NextResponse.json("Account paused", { status: 423 })
    : NextResponse.json("Forbidden", { status: 403 });
}

/**
 * An account as `viewerId` sees it, or null when they can't see it. The one
 * rule for the account list and for account events, so an event can never
 * show someone an account their list wouldn't:
 * 1. The owner always sees it — but only themselves on it while their
 *    subscription is inactive.
 * 2. Anyone else sees it while the owner's subscription is active. Once it
 *    lapses they see it only with `includePaused`, marked `paused`.
 */
function accountAsSeenBy(
  account: AccountWithSubscription,
  viewerId: string,
  { includePaused = false }: AccountVisibilityOptions = {},
): Account | null {
  const viewer = account.userAccess.find((access) => access.userId === viewerId);
  if (!viewer) return null;
  const owner = account.userAccess.find((access) => access.role === "owner");
  // A viewer who is the owner is found here, so no owner means nobody sees it.
  if (!owner) return null;
  const ownerActive = hasActiveAppleSubscription(
    owner.user.appleSubscriptionStatus || "inactive",
  );
  const paused = viewer.role !== "owner" && !ownerActive;
  if (paused && !includePaused) return null;
  const visibleAccess =
    viewer.role === "owner" && !ownerActive ? [viewer] : account.userAccess;

  return {
    id: account.id,
    name: account.name,
    currency: {
      id: account.currency.id,
      name: account.currency.name,
      symbol: account.currency.symbol,
      exchangeRate: account.currency.exchangeRate,
    },
    users: visibleAccess.map((access) => ({
      id: access.userId,
      role: access.role as "owner" | "member", // ✅ Type cast
      name: access.user.name,
      image: access.user.image,
      email: access.user.email,
    })),
    institution: {
      name: account.institutionName || "",
    },
    ...(paused
      ? { paused: true, pausedAt: owner.user.appleSubscriptionExpiresAt ?? null }
      : {}),
  } as Account;
}

export async function getUserAccounts(
  userId: string,
  options: AccountVisibilityOptions = {},
): Promise<Account[]> {
  const accounts = await db.userAccount.findMany({
    select: accountWithSubscriptionSelect,
    where: {
      userAccess: {
        some: { userId },
      },
    },
  });
  return accounts
    .map((account) =>
      accountAsSeenBy(account as AccountWithSubscription, userId, options),
    )
    .filter((account): account is Account => account !== null);
}

/**
 * One account as each person on it sees it — `account` is null for anyone
 * who can't (see `accountAsSeenBy`). For sending an account in an event.
 */
export async function getAccountAsSeenByMembers(
  accountId: string,
): Promise<{ viewerId: string; account: Account | null }[]> {
  const account = await db.userAccount.findUnique({
    where: { id: accountId },
    select: accountWithSubscriptionSelect,
  });
  if (!account) return [];
  return account.userAccess.map(({ userId }) => ({
    viewerId: userId,
    // Paused views included: the event type tells the app which it is.
    account: accountAsSeenBy(account as AccountWithSubscription, userId, {
      includePaused: true,
    }),
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
