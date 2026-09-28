/** @jest-environment node */
import {
  nextLocalHour,
  parseReportMonth,
  previousUtcMonth,
  reportMonthLabel,
  reportWindows,
  safeTimeZone,
} from "@/lib/reportSchedule";

const AUGUST = new Date("2026-08-01T00:00:00Z");

describe("reportWindows", () => {
  it("cuts the month on the user's wall clock", () => {
    const madrid = reportWindows(AUGUST, "Europe/Madrid");
    expect(madrid.start.toISOString()).toBe("2026-07-31T22:00:00.000Z");
    expect(madrid.end.toISOString()).toBe("2026-08-31T22:00:00.000Z");

    const ny = reportWindows(AUGUST, "America/New_York");
    expect(ny.start.toISOString()).toBe("2026-08-01T04:00:00.000Z");
  });

  it("gives the comparison and history months, across a year boundary", () => {
    const w = reportWindows(new Date("2026-01-01T00:00:00Z"), "UTC");
    expect(w.prevStart.toISOString()).toBe("2025-12-01T00:00:00.000Z");
    expect(w.historyStart.toISOString()).toBe("2025-10-01T00:00:00.000Z");
  });

  it("follows daylight saving inside the window", () => {
    // Madrid is UTC+1 in March before the change, UTC+2 in April.
    const w = reportWindows(new Date("2026-03-01T00:00:00Z"), "Europe/Madrid");
    expect(w.start.toISOString()).toBe("2026-02-28T23:00:00.000Z");
    expect(w.end.toISOString()).toBe("2026-03-31T22:00:00.000Z");
  });
});

describe("nextLocalHour", () => {
  it("is later today when the hour hasn't come yet", () => {
    const now = new Date("2026-09-01T05:00:00Z"); // 07:00 in Madrid
    expect(nextLocalHour(now, "Europe/Madrid", 9).toISOString()).toBe(
      "2026-09-01T07:00:00.000Z",
    );
  });

  it("is tomorrow once the hour has passed", () => {
    const now = new Date("2026-09-01T12:00:00Z"); // 14:00 in Madrid
    expect(nextLocalHour(now, "Europe/Madrid", 9).toISOString()).toBe(
      "2026-09-02T07:00:00.000Z",
    );
  });

  it("uses the user's date, not the UTC one", () => {
    // 12:00 UTC on the 1st is already 00:00 on the 2nd in Kiritimati (UTC+14).
    const now = new Date("2026-09-01T12:00:00Z");
    expect(nextLocalHour(now, "Pacific/Kiritimati", 9).toISOString()).toBe(
      "2026-09-01T19:00:00.000Z",
    );
  });

  it("keeps the wall-clock hour across a daylight-saving change", () => {
    // Madrid moves from UTC+2 to UTC+1 overnight on 25 October 2026.
    const now = new Date("2026-10-24T12:00:00Z");
    expect(nextLocalHour(now, "Europe/Madrid", 9).toISOString()).toBe(
      "2026-10-25T08:00:00.000Z",
    );
  });
});

describe("helpers", () => {
  it("falls back to UTC for a timezone the runtime doesn't know", () => {
    expect(safeTimeZone("Mars/Olympus")).toBe("UTC");
    expect(safeTimeZone(null)).toBe("UTC");
    expect(safeTimeZone("Asia/Tokyo")).toBe("Asia/Tokyo");
  });

  it("names months the way parseMonthYearToUtcDate reads them", () => {
    expect(reportMonthLabel(AUGUST)).toBe("August 2026");
    expect(parseReportMonth("2026-08-01")).toEqual(AUGUST);
    expect(() => parseReportMonth("2026-08-15")).toThrow();
    expect(previousUtcMonth(new Date("2026-01-01T00:30:00Z"))).toEqual(
      new Date("2025-12-01T00:00:00Z"),
    );
  });
});
