/**
 * @jest-environment node
 */
import {
  formatCurrency,
  parseDateTime,
  calculatePercentageChange,
  fillMissingDatesForExpenceCategories,
  fillMissingDates,
  convertCurrency,
  convertDateStringToCalendarDate,
  convertHexToRgba,
} from "@/lib/utils";
import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  toZoned,
  getLocalTimeZone,
} from "@internationalized/date";
import {
  parseISO,
  format,
  eachDayOfInterval,
  isSameDay,
  startOfDay,
  endOfDay,
} from "date-fns";

jest.mock("date-fns", () => ({
  parseISO: jest.fn(),
  format: jest.fn(),
  eachDayOfInterval: jest.fn(),
  isSameDay: jest.fn(),
  startOfDay: jest.fn(),
  endOfDay: jest.fn(),
}));

describe("Utils Library", () => {
  describe("formatCurrency", () => {
    it("should format a number to a currency string", () => {
      const result = formatCurrency(1234.56, "USD");
      expect(result).toBe("$1,234.56");
    });
  });

  describe("parseDateTime", () => {
    it("should parse an ISO 8601 string to a ZonedDateTime", () => {
      const dateString = "2023-01-01T12:00:00.000Z";
      (parseISO as jest.Mock).mockReturnValue(new Date(dateString));
      (format as jest.Mock).mockReturnValue(dateString);

      const result = parseDateTime(dateString);
      expect(result).toBeInstanceOf(ZonedDateTime);
    });
  });

  describe("calculatePercentageChange", () => {
    it("should calculate the percentage change between two numbers", () => {
      const result = calculatePercentageChange(200, 100);
      expect(result).toBe(100);
    });

    it("should return 0 if the previous value is 0 and both values are equal", () => {
      const result = calculatePercentageChange(0, 0);
      expect(result).toBe(0);
    });

    it("should return 100 if the previous value is 0 and the current value is greater than 0", () => {
      const result = calculatePercentageChange(100, 0);
      expect(result).toBe(100);
    });

    it("should return -100 if the previous value is 0 and the current value is less than 0", () => {
      const result = calculatePercentageChange(-100, 0);
      expect(result).toBe(-100);
    });
  });

  describe("fillMissingDatesForExpenceCategories", () => {
    it("should fill missing dates for expense categories", () => {
      const data = new Map([["2023-01-01T00:00:00.000Z", { Food: 50 }]]);
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-01-03");
      (eachDayOfInterval as jest.Mock).mockReturnValue([
        startDate,
        new Date("2023-01-02"),
        endDate,
      ]);
      (startOfDay as jest.Mock).mockImplementation((date) => date);
      (endOfDay as jest.Mock).mockImplementation((date) => date);

      const result = fillMissingDatesForExpenceCategories(
        data,
        startDate,
        endDate
      );
      expect(result).toEqual([
        { date: "2023-01-01T00:00:00.000Z", Food: 50 },
        { date: "2023-01-02T00:00:00.000Z", Food: 0 },
        { date: "2023-01-03T00:00:00.000Z", Food: 0 },
      ]);
    });
  });

  describe("fillMissingDates", () => {
    it("should fill missing dates for transactions", () => {
      const data = [
        { date: "2023-01-01T00:00:00.000Z", income: 100, expences: 50 },
      ];
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-01-03");
      (eachDayOfInterval as jest.Mock).mockReturnValue([
        startDate,
        new Date("2023-01-02"),
        endDate,
      ]);
      (startOfDay as jest.Mock).mockImplementation((date) => date);
      (isSameDay as jest.Mock).mockImplementation((date1, date2) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getTime() === d2.getTime();
      });

      const result = fillMissingDates(data, startDate, endDate);
      expect(result).toEqual([
        {
          date: new Date("2023-01-01").toISOString(),
          income: 100,
          expences: 50,
        },
        { date: new Date("2023-01-02"), income: 0, expences: 0 },
        { date: new Date("2023-01-03"), income: 0, expences: 0 },
      ]);
    });
  });

  describe("convertCurrency", () => {
    it("should convert an amount from one currency to another", () => {
      const result = convertCurrency(100, 1, 0.85);
      expect(result).toBe(85);
    });
  });

  describe("convertDateStringToCalendarDate", () => {
    it("should convert a date string to a CalendarDate object", () => {
      const dateString = "2023-01-01";
      (parseISO as jest.Mock).mockReturnValue(new Date(dateString));
      (format as jest.Mock).mockReturnValue(dateString);

      const result = convertDateStringToCalendarDate(dateString);
      expect(result).toBeInstanceOf(CalendarDate);
    });

    it("should return null for an invalid date string", () => {
      const dateString = "invalid-date";
      (parseISO as jest.Mock).mockReturnValue(new Date(NaN));

      const result = convertDateStringToCalendarDate(dateString);
      expect(result).toBeNull();
    });
  });

  describe("convertHexToRgba", () => {
    it("should convert a hex color to an RGBA color", () => {
      const result = convertHexToRgba("#ff0000", 0.5);
      expect(result).toBe("rgba(255, 0, 0, 0.5)");
    });

    it("should throw an error for an invalid hex color format", () => {
      expect(() => convertHexToRgba("invalid-hex", 0.5)).toThrow(
        "Invalid hex color format"
      );
    });
  });
});
