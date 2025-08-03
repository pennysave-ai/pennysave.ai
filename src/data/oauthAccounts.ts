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
  refresh_token?: string | null;
  expires_at?: number;
  token_type?: string;
  scope?: string | null;
  id_token?: string;
}): Promise<Account> {
  try {
    return await db.account.create({
      data: accountData,
    });
  } catch (error) {
    console.error("Error creating OAuth account:", error);
    throw new Error("Failed to create OAuth account");
  }
}
