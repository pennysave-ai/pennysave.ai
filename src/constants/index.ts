export const THIRD_PARTY_ERROR = "3rd-party";

// Default currency for currency exchange rates
// and exchange rates seed script
export const BASE_CURRENCY = "usd";

// Default data period for data analitics
export const DEFAULT_DATA_PERIOD = 30;

// User input characters limit
export const USER_INPUT_LIMIT = 2000;

// Chart Colors
export const COLORS = [
  "#9333ea",
  "#fb00b5",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#00FFFF", // Cyan
  "#FF00FF", // Magenta
  "#FFFF00", // Yellow
  "#FFA500", // Orange
  "#800080", // Purple
  "#BFFF00", // Lime
  "#000000", // Black
  "#FFFFFF", // White
  "#808080", // Gray
  "#FFB6C1", // Light Pink
  "#ADD8E6", // Light Blue
  "#90EE90", // Light Green
  "#FF1493", // Deep Pink
  "#FF8C00", // Dark Orange
  "#9400D3", // Dark Violet
];

// Transaction amount limits.
//
// Transaction.amount is a Postgres 4-byte `integer` holding MILLIUNITS
// (the UI multiplies by 1000 via convertAmountToMilliunits), so the column
// itself tops out at 2_147_483_647 milliunits -- i.e. 2,147,483.647 in
// currency units. We deliberately cap lower than the column allows, so the
// limit is a product decision rather than a storage accident and stays valid
// if the column type ever changes.
//
// The biggest amount a single transaction can take is 999,999.99 and the
// smallest is -999,999.99 (negative amounts are expenses).
export const MAX_TRANSACTION_AMOUNT = 999_999.99;
export const MIN_TRANSACTION_AMOUNT = -999_999.99;

// The same limits in milliunits, which is how amounts are validated and stored.
export const MAX_TRANSACTION_AMOUNT_MILLIUNITS = 999_999_990;
export const MIN_TRANSACTION_AMOUNT_MILLIUNITS = -999_999_990;
