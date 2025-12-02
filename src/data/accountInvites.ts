import { db } from "@/db";

/**
 * Function to create an account invite for universal link
 * for a given account by a user
 * @param {Object}
 * @param {string} params.accountId - The ID of the account to invite to
 * @param {string} params.createdById - The ID of the user creating the invite
 * @param {String} params.token - The unique token for the invite
 * @returns Created account invite
 */
export async function createAccountInvite({
  accountId,
  createdById,
  token,
}: {
  accountId: string;
  createdById: string;
  token: string;
}) {
  return db.accountInvite.create({
    data: {
      token,
      accountId,
      createdById,
      expiresAt: new Date(
        Date.now() + Number(process.env.APPLE_UNIVERSAL_LINKS_EXPIRATION_PERIOD)
      ), // 7 days
    },
  });
}

/**
 * Function to get an account invite by its token
 * @param {string} token - The unique token for the invite
 * @returns Account invite or null if not found
 */
export async function getAccountInviteByToken(token: string) {
  return db.accountInvite.findUnique({
    where: { token },
  });
}

/**
 * Function to mark an account invite as used
 * @param {string} token - The unique token for the invite
 * @returns Updated account invite
 */
export async function markAccountInviteAsUsed(token: string) {
  return db.accountInvite.updateMany({
    where: { token, usedAt: null },
    data: { usedAt: new Date() },
  });
}
