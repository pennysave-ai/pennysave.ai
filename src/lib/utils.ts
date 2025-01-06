import {
  CalendarDateTime,
  ZonedDateTime,
  toZoned,
  getLocalTimeZone,
} from "@internationalized/date";
import { format, parseISO } from "date-fns";

export function convertAmountToMilliunits(amount: number) {
  return Math.round(amount * 1000);
}

export function convertAmountFromMilliunits(amount: number) {
  return amount / 1000;
}

export function formatCurrency(value: number, currency: string) {
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
