import { User } from "./User";

/**
 * Net total for one currency inside one category-month. `amount` is a signed
 * integer in 1000ths of the currency unit — the same convention as
 * `Transaction.amount` — so negative is money out and positive is money in.
 */
export type CategoryMonthTotal = {
  currencyId: string;
  amount: number;
};

/**
 * One calendar month of a category's activity. `totals` holds one entry per
 * currency that saw activity that month and is an empty array when there was
 * none — the month itself is never omitted, so the time axis stays even.
 */
export type CategoryHistoryEntry = {
  /** "YYYY-MM" */
  month: string;
  totals: CategoryMonthTotal[];
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  owner: User;
  /** Set once its owner deleted it. Only a partner's row can still carry it. */
  archivedAt?: Date | null;
  /** Only present when the request asked for `?include=history`. */
  history?: CategoryHistoryEntry[];
};

/**
 * A partner category that counts under one of the viewer's categories.
 * `explicit` rows were saved by the viewer and can be removed; `name` rows come
 * from a normalized-name match and cannot.
 */
export type CategoryMappingItem = {
  source: Category;
  targetCategoryId: string;
  kind: "explicit" | "name";
};

export type CategoryMappingSuggestionReason =
  | { kind: "payees"; payees: string[] }
  | { kind: "name" }
  | { kind: "meaning" };

/** One of the viewer's categories a partner category probably corresponds to. */
export type CategoryMappingSuggestion = {
  categoryId: string;
  /** 0–1, informational only; clients rely on the order. */
  confidence: number;
  reason: CategoryMappingSuggestionReason;
};
