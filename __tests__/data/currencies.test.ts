/**
 * @jest-environment node
 */
import {
  getAllCurrencies,
  getCurrencyById,
  getCurrencyByName,
  getTargetCurrency,
} from "@/data/currencies";
import { db } from "@/db";
import { BASE_CURRENCY } from "@/constants";

jest.mock("@/db", () => ({
  db: {
    currency: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    userAccount: {
      findUnique: jest.fn(),
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
        {
          id: "1",
          symbol: "USD",
          name: "United States Dollar",
          exchangeRate: 1,
        },
        { id: "2", symbol: "EUR", name: "Euro", exchangeRate: 0.85 },
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

  describe("getCurrencyById", () => {
    it("should return a currency by ID", async () => {
      const mockCurrency = {
        id: "1",
        symbol: "USD",
        name: "United States Dollar",
      };
      (db.currency.findUnique as jest.Mock).mockResolvedValue(mockCurrency);

      const result = await getCurrencyById("1");

      expect(result).toEqual(mockCurrency);
      expect(db.currency.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should return default currency if currency is not found", async () => {
      (db.currency.findUnique as jest.Mock).mockResolvedValue({
        symbol: BASE_CURRENCY.toLocaleUpperCase(),
      });

      const result = await getCurrencyById("non-existent-id");

      expect(result).toHaveProperty(
        "symbol",
        BASE_CURRENCY.toLocaleUpperCase()
      );
      expect(db.currency.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-id" },
      });
    });
  });

  describe("getCurrencyByName", () => {
    it("should return a currency by name", async () => {
      const mockCurrency = {
        id: "1",
        symbol: "USD",
        name: "United States Dollar",
      };
      (db.currency.findFirst as jest.Mock).mockResolvedValue(mockCurrency);

      const result = await getCurrencyByName("United States Dollar");

      expect(result).toEqual(mockCurrency);
      expect(db.currency.findFirst).toHaveBeenCalledWith({
        where: { name: "United States Dollar" },
      });
    });

    it("should return null if currency is not found", async () => {
      (db.currency.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getCurrencyByName("NonExistent");

      expect(result).toBeNull();
      expect(db.currency.findFirst).toHaveBeenCalledWith({
        where: { name: "NonExistent" },
      });
    });
  });

  describe("getTargetCurrency", () => {
    it("should return the currency by ID if currencyId is provided", async () => {
      const mockCurrency = {
        id: "1",
        symbol: "USD",
        name: "United States Dollar",
      };
      (db.currency.findUnique as jest.Mock).mockResolvedValue(mockCurrency);

      const result = await getTargetCurrency(null, "1");

      expect(result).toEqual(mockCurrency);
      expect(db.currency.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should return the currency of the account if accountId is provided", async () => {
      const mockCurrency = {
        id: "1",
        symbol: "USD",
        name: "United States Dollar",
      };
      const mockAccount = { id: "account-1", currency: mockCurrency };
      (db.userAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const result = await getTargetCurrency("account-1", null);

      expect(result).toEqual(mockCurrency);
      expect(db.userAccount.findUnique).toHaveBeenCalledWith({
        where: { id: "account-1" },
        include: { currency: true },
      });
    });

    it("should return the base currency if neither currencyId nor accountId is provided", async () => {
      const mockCurrency = {
        id: "1",
        symbol: "USD",
        name: "United States Dollar",
      };
      (db.currency.findFirst as jest.Mock).mockResolvedValue(mockCurrency);

      const result = await getTargetCurrency(null, null);

      expect(result).toEqual(mockCurrency);
      expect(db.currency.findFirst).toHaveBeenCalledWith({
        where: { name: BASE_CURRENCY.toUpperCase() },
      });
    });

    it("should return default currency if id is wrong", async () => {
      (db.currency.findUnique as jest.Mock).mockResolvedValue({
        symbol: BASE_CURRENCY.toLocaleUpperCase(),
      });

      await expect(
        getTargetCurrency(null, "non-existent-id")
      ).resolves.toHaveProperty("symbol", BASE_CURRENCY.toLocaleUpperCase());
      expect(db.currency.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-id" },
      });
    });

    it("should throw an error if account is not found by ID", async () => {
      (db.userAccount.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        getTargetCurrency("non-existent-account", null)
      ).rejects.toThrow("Account not found");
      expect(db.userAccount.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-account" },
        include: { currency: true },
      });
    });

    it("should throw an error if base currency is not found", async () => {
      (db.currency.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getTargetCurrency(null, null)).rejects.toThrow(
        "Currency not found"
      );
      expect(db.currency.findFirst).toHaveBeenCalledWith({
        where: { name: BASE_CURRENCY.toUpperCase() },
      });
    });
  });
});
