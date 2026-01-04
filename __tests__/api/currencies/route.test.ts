/**
 * @jest-environment node
 */
import { getAllCurrencies } from "@/data/currencies";
import { db } from "@/db";

jest.mock("@/db", () => ({
  db: {
    currency: {
      findMany: jest.fn(),
    },
  },
}));

describe("Currencies Data Access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllCurrencies", () => {
    it("should return all currencies", async () => {
      const mockCurrencies = [
        { id: "1", symbol: "USD", name: "United States Dollar" },
        { id: "2", symbol: "EUR", name: "Euro" },
      ];
      (db.currency.findMany as jest.Mock).mockResolvedValue(mockCurrencies);

      const result = await getAllCurrencies();

      expect(result).toEqual(mockCurrencies);
      expect(db.currency.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          symbol: true,
          name: true,
          exchangeRate: true,
        },
      });
    });

    it("should return an empty array if no currencies are found", async () => {
      (db.currency.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getAllCurrencies();

      expect(result).toEqual([]);
      expect(db.currency.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          symbol: true,
          name: true,
          exchangeRate: true,
        },
      });
    });
  });
});
