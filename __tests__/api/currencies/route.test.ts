/**
 * @jest-environment node
 */
import { getCurrencyByNameOrSymbol, getAllCurrencies } from "@/data/currencies";
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

  describe("getCurrencyByNameOrSymbol", () => {
    it("should return currencies matching the name or symbol", async () => {
      const mockCurrencies = [
        {
          id: "1",
          symbol: "USD",
          name: "United States Dollar",
          exchangeRate: 1,
        },
        { id: "2", symbol: "EUR", name: "Euro", exchangeRate: 0.85 },
      ];
      (db.currency.findMany as jest.Mock).mockResolvedValue(mockCurrencies);

      const result = await getCurrencyByNameOrSymbol("Dollar", "USD");

      expect(result).toEqual(mockCurrencies);
      expect(db.currency.findMany).toHaveBeenCalledWith({
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
                contains: "Dollar",
                mode: "insensitive",
              },
            },
            {
              symbol: {
                contains: "USD",
                mode: "insensitive",
              },
            },
          ],
        },
      });
    });

    it("should return an empty array if no currencies match", async () => {
      (db.currency.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getCurrencyByNameOrSymbol("NonExistent", "XYZ");

      expect(result).toEqual([]);
      expect(db.currency.findMany).toHaveBeenCalledWith({
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
                contains: "NonExistent",
                mode: "insensitive",
              },
            },
            {
              symbol: {
                contains: "XYZ",
                mode: "insensitive",
              },
            },
          ],
        },
      });
    });
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
        },
      });
    });
  });
});
