import { db } from "@/db";
import { ExtendedAccountResponseType } from "@/lib/plaid";

/**
 * Deletes accounts by plaidItemId
 * @param {String} plaidItemId - Plaid Item ID
 * @returns {void}
 */
export async function deleteAccountsByPlaidItemId(plaidItemId: string) {
  await db.userAccount.deleteMany({
    where: {
      plaidItemId,
    },
  });
}

/**
 * Creates a new Plaid accounts
 * @param {Array} accountsData - Plaid Accounts data
 * @param {String} userId - User ID
 * @param {Array} currencies - Currencies data
 * @returns {void}
 */
export async function createPlaidAccounts(
  accountsData: ExtendedAccountResponseType,
  userId: string,
  currencies: { name: string; id: string }[]
) {
  await db.userAccount.createMany({
    data: accountsData?.accounts.map((account) => ({
      plaidAccountId: account.account_id,
      userId,
      name: account.name,
      plaidItemId: accountsData.item.item_id,
      plaidMask: account.mask,
      plaidBalance: account.balances.current,
      plaidType: account.type,
      institutionName: accountsData.item.institution_name,
      currencyId:
        currencies?.find(
          (currency) => currency.name === account.balances?.iso_currency_code
        )?.id || "",
    })),
  });
}
