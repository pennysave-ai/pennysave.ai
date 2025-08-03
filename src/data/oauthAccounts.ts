"use server";

import { db } from "@/db";
import { type Account } from "@prisma/client";

/** Check if account already exists by provider and providerAccountId
 * @param {String} provider - OAuth provider name
 * @param {String} providerAccountId - Unique ID for the account from the provider
 * @returns {Promise<Account | null>} - Returns the account if found, otherwise null
 */
export async function getOauthAccountByProviderAndId(
  provider?: string,
  providerAccountId?: string
): Promise<Account | null> {
  return await db.account.findFirst({
    where: {
      provider,
      providerAccountId,
    },
  });
}

/**
 * Create a new OAuth account in the database
 * @param {Object} accountData - Data for the new account
 * @returns {Promise<Account>} - Returns the created account
 */
export async function createOauthAccount(accountData: {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}): Promise<Account> {
  return await db.account.create({
    data: accountData,
  });
}
