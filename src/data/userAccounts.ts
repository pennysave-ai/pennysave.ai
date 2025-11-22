import { db } from "@/db";

/**
 * Get user ids with access to a specific account
 * @param {String} accountId - Account ID
 * @returns {Promise<String[]>} - Array of user IDs
 */
export async function getUsersWithAccessToAccount(accountId: string) {
  const userAccesses = await db.userAccountAccess.findMany({
    where: { userAccountId: accountId },
    select: { userId: true },
  });
  return userAccesses.map((access: { userId: string }) => access.userId);
}
