import { db } from "@/db";

/**
 * Get user ids with access to a specific account
 * @param {String} accountId - Account ID
 * @returns {Promise<String[]>} - Array of user IDs
 */
export async function getUsersWithAccessToAccount(
  accountId: string
): Promise<string[]> {
  const userAccesses = await db.userAccountAccess.findMany({
    where: { userAccountId: accountId },
    select: { userId: true },
  });
  return userAccesses.map((access: { userId: string }) => access.userId);
}

/**
 * Check if user has access to a specific account
 * @param {String} userId - User ID
 * @param {String} accountId - Account ID
 * @returns {Promise<Boolean>} - True if user has access, false otherwise
 */
export async function userHasAccessToAccount(
  userId: string,
  accountId: string
): Promise<boolean> {
  const access = await db.userAccountAccess.findFirst({
    where: { userId, userAccountId: accountId },
  });
  return !!access;
}

/**
 * Create a new user AccountAccess entry
 * @param {String} userId - User ID
 * @param {String} accountId - Account ID
 * @param {String} role - Role (e.g., 'owner', 'collaborator', 'editor')
 * @returns {Promise<void>}
 */
export async function createUserAccountAccess(
  userId: string,
  accountId: string,
  role: string
): Promise<void> {
  await db.userAccountAccess.create({
    data: {
      userId,
      userAccountId: accountId,
      role,
    },
  });
}
