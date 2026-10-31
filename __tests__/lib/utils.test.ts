/**
 * @jest-environment node
 */
import {
  formatCurrency,
  convertCurrency,
} from "@/lib/utils";

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

  describe("convertCurrency", () => {
    it("should convert an amount from one currency to another", () => {
      const result = convertCurrency(100, 1, 0.85);
      expect(result).toBe(85);
    });
  });
});
