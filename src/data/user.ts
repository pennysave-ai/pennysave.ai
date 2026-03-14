import { db } from "@/db";
import bcrypt from "bcryptjs";

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
  return db.user.delete({
    where: {
      id: userId,
    },
  });
}

/** Update apple subscription
 * @param {Object} data - User subscription details
 * @param {string} data.userId - User ID
 * @param {boolean} data.isActive - Subscription status
 * @param {Date | null} data.expiresAt - Expiration date
 * @param {Date | null} data.gracePeriodExpiresAt - Grace period expiration date
 * @param {string} data.status - Subscription status ("active", "past_due", "grace_period", "canceled")
 * @param {String} data.country - Country code
 * @returns Promise<User>
 */
export async function updateAppleSubscription({
  userId,
  expiresAt,
  gracePeriodExpiresAt,
  status,
  country,
}: {
  userId: string;
  expiresAt: Date | null;
  gracePeriodExpiresAt?: Date | null;
  status?: string;
  country: string;
}) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      appleSubscriptionExpiresAt: expiresAt,
      appleSubscriptionGracePeriodExpiresAt: gracePeriodExpiresAt,
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
