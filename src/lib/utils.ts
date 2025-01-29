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
} from "date-fns";

/**
 * Converts an amount to milliunits.
 * @param amount
 * @returns {number}
 */
export function convertAmountToMilliunits(amount: number): number {
  return Math.round(amount * 1000);
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

// Function to parse ISO 8601 string to CalendarDate
export const parseDateTime = (dateString: string): ZonedDateTime => {
  const localTime = format(
    parseISO(dateString),
    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
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
    millisecond
  );
  return toZoned(dateTime, getLocalTimeZone());
};

export const calculatePercentageChange = (
  current: number,
  previous: number
) => {
  if (previous === 0) {
    return previous === current ? 0 : current > 0 ? 100 : -100;
  }
  return ((current - previous) / previous) * 100;
};

export const fillMissingDates = (
  data: { date: string; income: number; expences: number }[],
  startDate: Date,
  endDate: Date
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
  toRate: number
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
  dateString: string | null
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
      date.getDate()
    );
  } catch {
    return null;
  }
};
