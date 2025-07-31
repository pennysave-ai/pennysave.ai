import { db } from "./src/db";

// Populate currencies table
const currencies = [
  { name: "USD", code: "840", symbol: "$", exchangeRate: 1 },
  { name: "EUR", code: "978", symbol: "€", exchangeRate: 0.99 },
];

const currenciesPromises = currencies.map((currency) =>
  db.currency.create({
    data: currency,
  })
);

const populate = async () => {
  try {
    await db.$transaction([...currenciesPromises]);
    console.log("Successfully populated currencies table");
  } catch (error) {
    console.error("Error populating currencies table", error);
  }
};

populate();
