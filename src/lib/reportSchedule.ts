import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/**
 * Month and hour arithmetic in a user's own timezone, for the monthly report
 * jobs.
 *
 * A report month is named by a `Date` at UTC midnight on the 1st (what
 * `Report.periodStart` stores), and only its UTC year and month are read. The
 * instants a month covers depend on whose month it is: August in Madrid starts
 * two hours before August in UTC.
 */

/** `tz` when the runtime knows it, UTC otherwise. */
export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `year`/`monthIndex` may run past 0–11; they are normalised first. */
function monthStart(year: number, monthIndex: number, tz: string): Date {
  const d = new Date(Date.UTC(year, monthIndex, 1));
  return fromZonedTime(
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01T00:00:00`,
    tz,
  );
}

/**
 * The instants of one month in `tz`, as `start <= t < end`, plus the months
 * before it that the report compares against or looks back over.
 */
export function reportWindows(
  reportMonth: Date,
  tz: string,
  historyMonths = 3,
) {
  const y = reportMonth.getUTCFullYear();
  const m = reportMonth.getUTCMonth();
  return {
    start: monthStart(y, m, tz),
    end: monthStart(y, m + 1, tz),
    prevStart: monthStart(y, m - 1, tz),
    historyStart: monthStart(y, m - historyMonths, tz),
  };
}

/** The previous calendar month in UTC, as a report month. */
export function previousUtcMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
}

/** Parses the `YYYY-MM-DD` report month the jobs pass around. */
export function parseReportMonth(value: string): Date {
  const m = /^(\d{4})-(\d{2})-01$/.exec(value);
  if (!m) throw new Error(`Invalid report month: "${value}"`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
}

/** "August 2026" — English on purpose, `parseMonthYearToUtcDate` reads it. */
export function reportMonthLabel(reportMonth: Date): string {
  return formatInTimeZone(reportMonth, "UTC", "MMMM yyyy");
}

/**
 * The next moment at or after `now` when the wall clock in `tz` reads
 * `hour`:00. Worked out on the local date rather than by adding 24 hours, so a
 * daylight-saving change in between doesn't shift it by an hour.
 */
export function nextLocalHour(now: Date, tz: string, hour: number): Date {
  const today = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const at = (day: string) => fromZonedTime(`${day}T${pad(hour)}:00:00`, tz);
  const candidate = at(today);
  if (candidate.getTime() >= now.getTime()) return candidate;
  const [y, mo, d] = today.split("-").map(Number);
  const tomorrow = new Date(Date.UTC(y!, mo! - 1, d! + 1));
  return at(
    `${tomorrow.getUTCFullYear()}-${pad(tomorrow.getUTCMonth() + 1)}-${pad(tomorrow.getUTCDate())}`,
  );
}
