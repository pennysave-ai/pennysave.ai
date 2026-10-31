/**
 * Converts an amount to milliunits.
 * @param amount
 * @returns {number}
 */
export function convertAmountToMilliunits(amount: number): number {
  return Math.round(amount * 1000);
}

export function convertPctToRatio(pct: number): number {
  return pct / 100;
}

/**
 * Converts an amount from milliunits.
 * @param amount
 * @returns {number}
 */
export function convertAmountFromMilliunits(amount: number): number {
  return amount / 1000;
}

/**
 * Formats a number to a certain currency.
 * @param value
 * @param currency
 * @returns {string}
 */
export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Converts an amount from one currency to another using exchange rates relative to a base currency.
 *
 * @param amount - The amount to convert.
 * @param fromRate - The exchange rate of the source currency relative to the base currency.
 * @param toRate - The exchange rate of the target currency relative to the base currency.
 * @returns The converted amount.
 */
export function convertCurrency(
  amount: number,
  fromRate: number,
  toRate: number,
): number {
  const baseAmount = Number(amount) / Number(fromRate);
  return baseAmount * Number(toRate);
}

/**
 * Get clientIp and ipPrefix from headers
 * @param headersList
 * @returns {{clientIp: string, ipPrefix: string}}
 */
export const getClientIpAndPrefix = (
  headersList: Headers,
): { clientIp: string; ipPrefix: string } => {
  const clientIp =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") || // Cloudflare
    "unknown";
  const ipPrefix = clientIp.split(".").slice(0, 3).join(".");
  return { clientIp, ipPrefix };
};

/**
 * Return normalized payee name by trimming and replacing multiple spaces with a single space
 */
export function normalizePayee(payee: string | null | undefined) {
  return (payee ?? "").trim().replace(/\s+/g, " ");
}

/**
 * Normalize a category name for matching across users: trim, lowercase and
 * strip diacritics, so "Grocéries", " groceries " and "Groceries" are equal.
 * The mobile app applies the same rule for its own fallback — keep them in sync.
 */
export function normalizeCategoryName(name: string | null | undefined) {
  return (name ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

/**
 * Parses a month-year string (e.g. "January 2026") and returns a Date object representing the first day of that month in UTC.
 * @param {string} monthYear - The month-year string to parse.
 * @returns {Date} - A Date object representing the first day of the specified month in UTC.
 */
export function parseMonthYearToUtcDate(monthYear: string): Date {
  const s = String(monthYear ?? "").trim();

  // Accept "January 2026" (English) and normalize multiple spaces
  const normalized = s.replace(/\s+/g, " ");
  const m = /^([A-Za-z]+)\s+(\d{4})$/.exec(normalized);
  if (!m) {
    throw new Error(
      `Invalid month-year string: "${s}" (expected "January 2026")`,
    );
  }

  const monthName = m[1].toLowerCase();
  const year = Number(m[2]);

  const monthIndexByName: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  const monthIndex = monthIndexByName[monthName];
  if (monthIndex === undefined || Number.isNaN(year)) {
    throw new Error(
      `Invalid month-year string: "${s}" (expected "January 2026")`,
    );
  }

  // Month bucket at midnight UTC on the first day
  return new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
}
