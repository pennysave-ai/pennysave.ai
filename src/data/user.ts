import { db } from "@/db";
import { getCategoryResolvers } from "@/data/categoryMappings";
import bcrypt from "bcryptjs";
import type { SubscriptionStatusValue } from "@/types/Subscription";

/**
 * Get user by Stripe customer ID
 * @param stripeCustomerId - Stripe customer ID
 * @returns Promise<User>
 */
export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return db.user.findFirst({
    where: {
      stripeCustomerId,
    },
  });
}

/**
 * Get user data by email
 * @param email
 * @returns
 */
export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: {
      email,
    },
  });
}

/**
 * Get user data by Id
 * @param id
 * @returns
 */
export async function getUserById(id: string) {
  return db.user.findUnique({
    where: {
      id,
    },
  });
}

/**
 * Get the user's stored IANA timezone
 * @param {string} id - User ID
 * @returns {Promise<string | null>} - The stored timezone, or null when the user does not exist
 */
export async function getUserTimezone(id: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: { timezone: true },
  });
  return user?.timezone ?? null;
}

/**
 * Get what a read needs to speak to the user: where they are and what language
 * they read in. One lookup, since both are wanted on the same request.
 * @param {string} id - User ID
 * @returns {Promise<{timezone: string | null, preferredLanguage: string | null}>} - Both, null where unset
 */
export async function getUserLocale(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: { timezone: true, preferredLanguage: true },
  });
  return {
    timezone: user?.timezone ?? null,
    preferredLanguage: user?.preferredLanguage ?? null,
  };
}

/**
 * Set user notification preferences
 * @param {string} userId - user ID
 * @param {boolean} monthlyReports - monthly reports
 */
export async function setNotificationPreferences({
  userId,
  monthlyReports,
}: {
  monthlyReports: boolean;
  userId: string;
}) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      sendMonthlyReport: monthlyReports,
    },
  });
}

/**
 * Create a new user with password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} name - User's name
 * @returns {Promise<User>} - Returns the created user
 */
export async function createUserWithPassword({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      gdprConsent: new Date(),
    },
  });
}

/**
 * Create user with OAuth account
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email
 * @param {string} userData.name - User's name
 * @param {string} userData.image - User's profile picture
 * @returns {Promise<User>} - Returns the created user
 */
export async function createUserWithOauth({
  email,
  name,
  image,
}: {
  email: string;
  name: string;
  image: string;
}) {
  return db.user.create({
    data: {
      email,
      name,
      image,
      gdprConsent: new Date(),
      emailVerified: new Date(),
    },
  });
}

/**
 * Get user profile preferences
 * @param {string} userId - User ID
 * @returns {Promise<{baseCurrency: string | null, preferredLanguage: string | null, monthlyReportsEnabled: boolean | null} | null>} - Returns the user's preferences or null if the user does not exist
 */
export async function getUserPreferences(userId: string) {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      preferredCurrencyId: true,
      preferredLanguage: true,
      sendMonthlyReport: true,
    },
  });

  if (!user) return null;

  return {
    baseCurrency: user.preferredCurrencyId,
    preferredLanguage: user.preferredLanguage,
    monthlyReportsEnabled: user.sendMonthlyReport,
  };
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} data - User's profile data
 * @returns {Promise<User>} - Returns the updated user
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    name: string;
    timezone: string;
    preferredLanguage: string;
    image: string;
    sendMonthlyReport: boolean;
    preferredCurrencyId: string;
  }>,
) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: updates,
  });
}

/**
 * Delete user profile
 * @param userId - User ID
 * @returns Promise<void>
 */
export async function deleteProfile(userId: string) {
  // Everything the user added to an account they share is handed on before the
  // user row goes, because rows and receipts cascade with their author. The
  // other members keep their balances and history.
  const accesses = await db.userAccountAccess.findMany({
    where: { userId },
    select: {
      userAccountId: true,
      userAccount: {
        select: {
          userAccess: {
            where: { userId: { not: userId } },
            select: { userId: true, role: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  const handovers: { accountId: string; heirId: string }[] = [];
  const soleAccountIds: string[] = [];
  for (const access of accesses) {
    const others = access.userAccount.userAccess;
    // The owner inherits, else whoever joined first.
    const heir = others.find((other) => other.role === "owner") ?? others[0];
    if (heir) {
      handovers.push({ accountId: access.userAccountId, heirId: heir.userId });
    } else {
      soleAccountIds.push(access.userAccountId);
    }
  }

  // Each handed-on row keeps counting where it counted for its new author:
  // their pick, their mapping or their same-name match becomes the row's own
  // category. Worked out before the user's categories are deleted with them.
  const resolvers = await getCategoryResolvers(
    handovers.map((handover) => handover.heirId),
  );
  const rows = handovers.length
    ? await db.transaction.findMany({
        where: {
          createdBy: userId,
          accountId: { in: handovers.map((handover) => handover.accountId) },
        },
        select: {
          id: true,
          accountId: true,
          category: {
            select: {
              id: true,
              name: true,
              archivedAt: true,
              owner: { select: { id: true } },
            },
          },
        },
      })
    : [];
  const heirOf = new Map(
    handovers.map((handover) => [handover.accountId, handover.heirId]),
  );
  // One update per (heir, category) rather than one per row.
  const groups = new Map<
    string,
    { heirId: string; categoryId: string | null; ids: string[] }
  >();
  for (const row of rows) {
    const heirId = heirOf.get(row.accountId)!;
    const categoryId =
      resolvers.get(heirId)?.resolve(row.category, row.id)?.id ?? null;
    const key = `${heirId}:${categoryId}`;
    const group = groups.get(key) ?? { heirId, categoryId, ids: [] };
    group.ids.push(row.id);
    groups.set(key, group);
  }

  return db.$transaction([
    ...[...groups.values()].flatMap(({ heirId, categoryId, ids }) => [
      db.transaction.updateMany({
        where: { id: { in: ids } },
        data: { createdBy: heirId, categoryId },
      }),
      // Now the heir's own rows, so their pick is the row's category.
      db.transactionPlacement.deleteMany({
        where: { viewerId: heirId, transactionId: { in: ids } },
      }),
    ]),
    ...handovers.map(({ accountId, heirId }) =>
      db.receipt.updateMany({
        where: { accountId, createdBy: userId },
        data: { createdBy: heirId },
      }),
    ),
    // Nobody else can see these, so they go with the user.
    db.userAccount.deleteMany({ where: { id: { in: soleAccountIds } } }),
    db.user.delete({ where: { id: userId } }),
  ]);
}

/** Update apple subscription
 * Fields left undefined are not written, so a caller that has no opinion on a
 * column leaves the stored value untouched.
 * @param {Object} data - User subscription details
 * @param {string} data.userId - User ID
 * @param {Date | null} data.expiresAt - Expiration date
 * @param {Date | null} data.gracePeriodExpiresAt - Grace period expiration date
 * @param {Date | null} data.startedAt - Start of the current subscription period (Apple purchaseDate)
 * @param {Date | null} data.originalPurchaseDate - First ever purchase (Apple originalPurchaseDate)
 * @param {Date | null} data.trialStartedAt - When the free trial began
 * @param {string} data.status - Subscription status ("active", "past_due", "grace_period", "canceled")
 * @param {String} data.country - Country code
 * @returns Promise<User>
 */
export async function updateAppleSubscription({
  userId,
  expiresAt,
  gracePeriodExpiresAt,
  startedAt,
  originalPurchaseDate,
  trialStartedAt,
  status,
  country,
}: {
  userId: string;
  expiresAt: Date | null;
  gracePeriodExpiresAt?: Date | null;
  startedAt?: Date | null;
  originalPurchaseDate?: Date | null;
  trialStartedAt?: Date | null;
  status?: SubscriptionStatusValue;
  country: string;
}) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      appleSubscriptionExpiresAt: expiresAt,
      appleSubscriptionGracePeriodExpiresAt: gracePeriodExpiresAt,
      appleSubscriptionStartedAt: startedAt,
      appleSubscriptionOriginalPurchaseDate: originalPurchaseDate,
      appleTrialStartedAt: trialStartedAt,
      appleSubscriptionStatus: status || "active",
      appleSubscriptionCountry: country,
    },
  });
}

/** Update user device token
 * @param {string} userId - User ID
 * @param {string | null} deviceToken - Device token
 * @returns Promise<User>
 */
export async function updateUserDeviceToken(
  userId: string,
  deviceToken: string | null,
) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      deviceToken,
    },
  });
}

/**
 * Get device token by user ID
 * @param {string} userId - User ID
 * @returns {Promise<string | null>} - Device token or null
 */
export async function getDeviceTokenByUserId(userId: string) {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      deviceToken: true,
    },
  });
  return user?.deviceToken || null;
}

/** Determine if user has active Apple subscription
 * @param {String} status - Apple subscription status
 * @returns {Boolean} - True if user has active subscription, false otherwise
 */
export function hasActiveAppleSubscription(status: string): boolean {
  return [
    "active",
    "active_until_expiration",
    "trial",
    "grace_period",
    "past_due",
  ].includes(status);
}

/**
 * Set user timezone
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {string} params.timezone - IANA timezone ID (e.g. "Europe/Madrid", "America/New_York")
 * @returns Promise<User>
 */
export async function setUserTimezone(params: {
  userId: string;
  timezone: string;
}) {
  const { userId, timezone } = params;

  // very light sanity check (IANA ids are like "Area/City")
  const tz = String(timezone || "").trim();
  if (!tz || !tz.includes("/")) return;

  await db.user.update({
    where: { id: userId },
    data: { timezone: tz },
  });
}
