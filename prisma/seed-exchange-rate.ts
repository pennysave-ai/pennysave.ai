const { PrismaClient } = require("@prisma/client");
const { BASE_CURRENCY } = require("../src/constants");

const API_URL = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${BASE_CURRENCY}.json`;
const db = new PrismaClient();

// Seed exchange rates
const seed = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const apiData = await response.json();
    const neededCurrencies = await db.currency.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const updates = neededCurrencies.map(
      (currency: { id: string; name: string }) => ({
        where: { id: currency.id },
        data: {
          exchangeRate:
            currency.name.toLowerCase() === BASE_CURRENCY
              ? 1
              : apiData?.[BASE_CURRENCY]?.[currency.name.toLowerCase()] || 1.0,
        },
      })
    );

    const updateOperations = updates.map((update: any) =>
      db.currency.update({
        where: update.where,
        data: update.data,
      })
    );

    await db.$transaction(updateOperations);
    console.log(`Exchange rates updated successfully on ${new Date()}`);
  } catch (error) {
    console.error("error", error);
  } finally {
    await db.$disconnect();
  }
};

seed();
