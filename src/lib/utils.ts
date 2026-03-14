import {
  CalendarDateTime,
  ZonedDateTime,
  toZoned,
  getLocalTimeZone,
  CalendarDate,
} from "@internationalized/date";

import {
  format,
  parseISO,
  eachDayOfInterval,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  startOfQuarter,
} from "date-fns";

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

/** Function to convert data to UTC format
 * @param dateStr - The date string to convert.
 * @returns {Date} - The date in UTC format.
 */
export function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Function to conver data to UTC End of the Day */
export function parseUTCEndOfDay(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}
/**
 * Function to parse ISO 8601 string to CalendarDate
 * @param dateString - The date string to convert.
 * @returns {ZonedDateTime}
 * @throws {Error} - If the date string is invalid.
 * @example
 **/
export const parseDateTime = (dateString: string): ZonedDateTime => {
  const localTime = format(
    parseISO(dateString),
    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  );
  const date = new Date(localTime);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 date time string: ${dateString}`);
  }
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // Months are zero-based in JS Date
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  const millisecond = date.getUTCMilliseconds();

  const dateTime = new CalendarDateTime(
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  return toZoned(dateTime, getLocalTimeZone());
};

/**
 * Calculates the percentage change between two numbers.
 * @param {number} current - The current value.
 * @param {number} previous - The previous value.
 * @returns {number} - The percentage change.
 */
export const calculatePercentageChange = (
  current: number,
  previous: number,
) => {
  if (previous === 0) {
    return previous === current ? 0 : current > 0 ? 100 : -100;
  }
  return ((current - previous) / previous) * 100;
};

/**
 * Fills missing dates for expence categories date range
 * @param {Map<string, {[x:string]: string | number}>} data - The data to fill missing dates for.
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array<{date: string, [x:string]: string | number}>}
 */
export const fillMissingDatesForExpenceCategories = (
  data: Map<string, { [x: string]: string | number }>,
  startDate: Date,
  endDate: Date,
) => {
  if (data.size === 0) {
    return [];
  }
  const [firstValue] = data.values();
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const emptyData = Object.keys(firstValue).reduce(
    (acc: { [key: string]: number }, key) => {
      acc[key] = 0;
      return acc;
    },
    {},
  );
  const transactionByDate = allDays.map((day) => {
    const found = data.get(endOfDay(day).toISOString());
    if (found) {
      return {
        ...found,
        date: startOfDay(day).toISOString(),
      };
    } else {
      return {
        date: startOfDay(day).toISOString(),
        ...emptyData,
      };
    }
  });
  return transactionByDate;
};

/**
 * Fills missing dates for transactions
 * @param {Array<{date: string, income: number, expences: number}>} data - The data to fill missing dates for.
 * @param {Date} startDate - The start date of the range.
 * @returns {Array<{date: string, income: number, expences: number}>}
 */
export const fillMissingDates = (
  data: { date: string; income: number; expences: number }[],
  startDate: Date,
  endDate: Date,
) => {
  if (data.length === 0) {
    return [];
  }
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const transactionByDate = allDays.map((day) => {
    const found = data.find((d) => {
      return isSameDay(startOfDay(d.date), day);
    });
    if (found) {
      // Normalize the date to the start of the day
      return {
        ...found,
        date: startOfDay(found.date),
      };
    } else {
      return { date: day, income: 0, expences: 0 };
    }
  });
  return transactionByDate;
};

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
 * Converts a date string to a CalendarDate object.
 *
 * @param dateString - The date string to convert.
 * @returns {CalendarDate | null}
 */
export const convertDateStringToCalendarDate = (
  dateString: string | null,
): CalendarDate | null => {
  try {
    if (!dateString) {
      return null;
    }
    const date = parseISO(format(dateString, "yyyy-MM-dd"));
    if (isNaN(date.getTime())) {
      return null;
    }
    return new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    );
  } catch {
    return null;
  }
};

/**
 * Converts a CalendarDate object to a date string.
 * @param {CalendarDate} date - The CalendarDate object to convert.
 * @returns {string | null}
 */
export const convertCalendarDateToDateString = (
  date: CalendarDate | null,
): string | null => {
  if (!date) {
    return null;
  }
  try {
    const jsDate = new Date(date.year, date.month - 1, date.day);
    return format(jsDate, "yyyy-MM-dd");
  } catch {
    return null;
  }
};
/**
 * Function to convert hex to RGBA
 * @param hex
 * @param alpha
 * @returns {string}
 */
export const convertHexToRgba = (hex: string, alpha: number) => {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, "");
  // Parse the r, g, b values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    throw new Error("Invalid hex color format");
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Converts Unix timestamp to ISO string
 * @param timestamp
 * @returns {String}
 */
export const convertUnixTimestampToISO = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString();
};

/**
 * Get the start date for budget frequency period
 * @param {string} frequency - The frequency of the budget
 * @param {Date} startDate - The start date of the budget
 * @returns {Date}
 * @throws {Error} - If the frequency is not valid
 */
export const getStartDateForFrequency = (
  frequency: string,
  startDate: Date = new Date(),
): Date => {
  switch (frequency) {
    case "WEEKLY":
      return startOfWeek(startDate, { weekStartsOn: 1 }); // Start of the week (Monday)
    case "MONTHLY":
      return startOfMonth(startDate); // Start of the month
    case "YEARLY":
      return startOfYear(startDate); // Start of the year
    case "QUARTERLY":
      return startOfQuarter(startDate); // Start of the quarter
    default:
      throw new Error("Invalid budget frequency");
  }
};

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
 * Checks if a date is within a specified range (inclusive).
 * @param {Date} d - The date to check.
 * @param {Date} start - The start of the range.
 * @param {Date} end - The end of the range.
 * @returns {boolean} - True if the date is within the range, false otherwise.
 */
export function isWithin(d: Date, start: Date, end: Date) {
  return d >= start && d <= end;
}

/**
 * Return normalized payee name by trimming and replacing multiple spaces with a single space
 */
export function normalizePayee(payee: string | null | undefined) {
  return (payee ?? "").trim().replace(/\s+/g, " ");
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
