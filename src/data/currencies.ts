import { db } from "@/db";
import { type Currency } from "@prisma/client";
import { BASE_CURRENCY } from "@/constants";

/**
 * Gets the list of currencies by Name
 * @param {String} currencyName - Currency Name
 * @param {String} currencySymbol - Currency Symbol
 * @returns {Array<{symbol: string, name: string, exchangeRate: number}>} - Array of currencies
 */
export async function getCurrencyByNameOrSymbol(
  currencyName: string,
  currencySymbol: string
) {
  const currencies = await db.currency.findMany({
    select: {
      id: true,
      symbol: true,
      name: true,
      exchangeRate: true,
    },
    where: {
      OR: [
        {
          name: {
            contains: currencyName,
            mode: "insensitive",
          },
        },
        {
          symbol: {
            contains: currencySymbol,
            mode: "insensitive",
          },
        },
      ],
    },
  });
  return currencies;
}

/**
 * Get All Currencies
 * @returns {Array<{symbol: string, name: string, id: string}>} - Array of currencies
 */
export async function getAllCurrencies() {
  const currencies = await db.currency.findMany({
    select: {
      id: true,
      symbol: true,
      name: true,
    },
  });
  return currencies;
}

/**
 * Get currency by id
 * @param {string} currencyId - Currency Id
 * @returns {Array<{symbol: string, name: string, id: string}>} - Array of currencies
 */
export async function getCurrencyById(currencyId: string) {
  const currency = await db.currency.findUnique({
    where: {
      id: currencyId,
    },
  });
  // if currency not found, return the base currency
  if (!currency) {
    const baseCurrency = await getCurrencyByName(BASE_CURRENCY.toUpperCase());
    if (!baseCurrency) {
      throw new Error("Base currency not found");
    }
    return baseCurrency;
  }
  return currency;
}

/**
 * Get currency by name
 * @param {string} currencyName - Currency Name
 * @returns {Array<{symbol: string, name: string, id: string}>} - Array of currencies
 */
export async function getCurrencyByName(currencyName: string) {
  return await db.currency.findFirst({
    where: {
      name: currencyName,
    },
  });
}

/**
 * Get the target currency for the summary endpoint.
 * If the currencyId is provided, it will return the currency with that ID.
 * If the accountId is provided, it will return the currency of the account with that ID.
 * If neither is provided, it will return the base currency.
 * @param {string | null} accountId
 * @param {string | null} currencyId
 * @returns {Promise<Currency>} - The target currency.
 */
export async function getTargetCurrency(
  accountId: string | null,
  currencyId: string | null
): Promise<Currency> {
  if (currencyId) {
    const currency = await getCurrencyById(currencyId);
    if (!currency) {
      throw new Error("Currency not found");
    }
    return currency;
  }
  if (accountId) {
    const account = await db.userAccount.findUnique({
      where: {
        id: accountId,
      },
      include: {
        currency: true,
      },
    });
    if (!account) {
      throw new Error("Account not found");
    }
    return account.currency;
  }
  const baseCurrency = await getCurrencyByName(BASE_CURRENCY.toUpperCase());
  if (!baseCurrency) {
    throw new Error("Currency not found");
  }
  return baseCurrency;
}
