import { db } from "@/db";
import type { SubscriptionStatusValue } from "@/types/Subscription";

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
