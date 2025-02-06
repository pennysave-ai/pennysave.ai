import { db } from "@/db";
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
