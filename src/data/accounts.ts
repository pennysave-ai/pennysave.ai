import { db } from "@/db";
import { hasActiveAppleSubscription } from "@/data/user";
import { Account } from "@/types";

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
