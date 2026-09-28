import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@/schemas";
import {
  MAX_TRANSACTION_AMOUNT_MILLIUNITS,
  MIN_TRANSACTION_AMOUNT_MILLIUNITS,
} from "@/constants";

const baseTransaction = {
  id: "0a5b1c3d-2e4f-4a6b-8c9d-0e1f2a3b4c5d",
  accountId: "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
  categoryId: null,
  createdAt: "2026-09-20T00:00:00.000Z",
  payee: "Payee",
  notes: "",
};

describe("transaction amount limits", () => {
  it("accepts the largest amount allowed (999,999.99)", () => {
    const result = createTransactionSchema.safeParse({
      ...baseTransaction,
      amount: MAX_TRANSACTION_AMOUNT_MILLIUNITS,
    });
    expect(result.success).toBe(true);
  });

  it("accepts the smallest amount allowed (-999,999.99)", () => {
    const result = createTransactionSchema.safeParse({
      ...baseTransaction,
      amount: MIN_TRANSACTION_AMOUNT_MILLIUNITS,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an amount above the maximum, with a message in currency units", () => {
    const result = createTransactionSchema.safeParse({
      ...baseTransaction,
      amount: MAX_TRANSACTION_AMOUNT_MILLIUNITS + 10,
    });
    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.flatten().fieldErrors.amount
    ).toContain("Amount cannot be greater than 999,999.99");
  });

  it("rejects an amount that fits the int4 column but exceeds our cap", () => {
    // 2,000,000.00 -- storable in Postgres, above the product limit.
    const result = createTransactionSchema.safeParse({
      ...baseTransaction,
      amount: 2_000_000_000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an amount below the minimum", () => {
    const result = createTransactionSchema.safeParse({
      ...baseTransaction,
      amount: MIN_TRANSACTION_AMOUNT_MILLIUNITS - 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer amount", () => {
    const result = createTransactionSchema.safeParse({
      ...baseTransaction,
      amount: 1000.5,
    });
    expect(result.success).toBe(false);
  });

  it("applies the same limits on update", () => {
    expect(
      updateTransactionSchema.safeParse({
        ...baseTransaction,
        amount: MAX_TRANSACTION_AMOUNT_MILLIUNITS + 10,
      }).success
    ).toBe(false);
    expect(
      updateTransactionSchema.safeParse({
        ...baseTransaction,
        amount: MAX_TRANSACTION_AMOUNT_MILLIUNITS,
      }).success
    ).toBe(true);
  });
});
