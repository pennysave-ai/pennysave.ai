/**
 * @jest-environment node
 */

jest.mock("@/data/stripe", () => ({
  STRIPE: { getInstance: jest.fn(() => ({})) },
}));

process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
process.env.RESEND_API_KEY = "test-api-key";

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@/db", () => ({
  db: {
    currency: { findMany: jest.fn() },
    report: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

jest.mock("@/data/transactions", () => ({
  ...jest.requireActual("@/data/transactions"),
  getTransactions: jest.fn(),
}));

import { db } from "@/db";
import { getTransactions } from "@/data/transactions";
import {
  reportExistsForMonth,
  reportMonthName,
  withLiveFacts,
} from "@/data/reports";

const USD = { id: "cur-usd", name: "USD", exchangeRate: 1 };

// Amounts are milliunits, as stored.
function tx(amount: number, category: string | null, payee = "shop") {
  return {
    id: `${category}-${amount}-${payee}`,
    amount,
    payee,
    notes: null,
    createdAt: new Date("2026-08-10T12:00:00Z"),
    account: {
      id: "acc-1",
      name: "Main",
      currency: { id: USD.id, exchangeRate: 1 },
    },
    category: category ? { id: category, name: category } : null,
    sourceCategory: category ? { id: category, name: category } : null,
  };
}

function stored(overrides: Record<string, unknown> = {}) {
  return {
    id: "rep-1",
    periodStart: new Date("2026-08-01T00:00:00Z"),
    health: "green",
    data: {
      insights: "You saved $1,000.",
      income_analysis: "",
      expense_analysis: "",
      health_analysis: "",
    },
    snapshot: {
      currencyCode: "USD",
      incomeReceived: 3_000_000,
      expenseSpend: 2_000_000,
      netFlow: 1_000_000,
    },
    comparisons: { id: "cmp-1", prevMonthAvailable: false },
    categoryBreakdowns: [],
    ...overrides,
  };
}

function month(
  current: ReturnType<typeof tx>[],
  prev: ReturnType<typeof tx>[] = [],
) {
  (getTransactions as jest.Mock).mockResolvedValue({
    currentByUser: new Map([["user-1", current]]),
    prevByUser: new Map([["user-1", prev]]),
    historyByUser: new Map([["user-1", [...prev, ...current]]]),
  });
}

describe("withLiveFacts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.currency.findMany as jest.Mock).mockResolvedValue([USD]);
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      timezone: "Europe/Madrid",
    });
  });

  it("replaces stored totals with the month as it is now", async () => {
    // Stored: 3,000 in / 2,000 out. Since then a 500 expense was added.
    month([
      tx(3_000_000, "Salary", "employer"),
      tx(-1_500_000, "Housing", "landlord"),
      tx(-500_000, "Groceries"),
      tx(-500_000, "Groceries", "market"),
    ]);

    const [report] = await withLiveFacts("user-1", [stored()]);

    expect(report!.snapshot).toMatchObject({
      currencyCode: "USD",
      incomeReceived: 3_000_000,
      expenseSpend: 2_500_000,
      netFlow: 500_000,
    });
    expect(report!.categoryBreakdowns).toEqual([
      { id: "Housing", category: "Housing", spend: 1_500_000, pct: 0.6 },
      { id: "Groceries", category: "Groceries", spend: 1_000_000, pct: 0.4 },
    ]);
    // Asks for the report's own month, not whatever "last month" is today,
    // cut in the viewer's timezone.
    const { reportMonth, timeZones } = (getTransactions as jest.Mock).mock
      .calls[0][0];
    expect(reportMonth).toEqual(new Date("2026-08-01T00:00:00Z"));
    expect(timeZones.get("user-1")).toBe("Europe/Madrid");
  });

  it("works health out again from the month as it is now", async () => {
    // Stored green; since then spending passed income.
    month([
      tx(3_000_000, "Salary", "employer"),
      tx(-3_500_000, "Housing", "landlord"),
    ]);
    const [report] = await withLiveFacts("user-1", [stored()]);
    expect(report!.health).toBe("red");
    expect(report!.findings!.map((f) => f.kind)).toContain("net_deficit");
    expect(report!.findings![0]).not.toHaveProperty("score");
  });

  it("gives every report findings, whatever it stored", async () => {
    month([
      tx(3_000_000, "Salary", "employer"),
      tx(-1_500_000, "Housing", "landlord"),
      tx(-500_000, "Groceries"),
    ]);
    const [old, current] = await withLiveFacts("user-1", [
      stored(),
      stored({ id: "rep-2", data: { version: 3, currencyId: USD.id } }),
    ]);
    expect(old!.findings).toEqual(current!.findings);
    expect(current!.findings!.map((f) => f.kind)).toEqual(
      expect.arrayContaining(["net_surplus", "category_top"]),
    );
  });

  it("returns a month it cannot recompute as stored", async () => {
    (getTransactions as jest.Mock).mockRejectedValue(new Error("db down"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const input = stored();
    const [report] = await withLiveFacts("user-1", [input]);
    expect(report).toEqual({ ...input, findings: null });
  });

  it("leaves a report in an unknown currency alone", async () => {
    const input = stored({
      snapshot: { ...stored().snapshot, currencyCode: "XXX" },
    });
    const [report] = await withLiveFacts("user-1", [input]);
    expect(getTransactions).not.toHaveBeenCalled();
    expect(report!.findings).toBeNull();
  });
});

describe("reportExistsForMonth", () => {
  it("looks the report up by the month it covers", async () => {
    (db.report.findFirst as jest.Mock).mockResolvedValue({ id: "rep-1" });
    await expect(reportExistsForMonth("user-1", "August 2026")).resolves.toBe(
      true,
    );
    expect(db.report.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        userId: "user-1",
        periodStart: new Date("2026-08-01T00:00:00.000Z"),
      },
    });
  });
});

describe("reportMonthName", () => {
  it("names the report month in the user's language", () => {
    const aug = new Date("2026-08-01T00:00:00Z");
    expect(reportMonthName(aug, "en")).toBe("August 2026");
    expect(reportMonthName(aug, "es")).toBe("agosto de 2026");
    // A stored ISO string, as it comes back through the queue.
    expect(reportMonthName("2026-08-01T00:00:00.000Z", "fr")).toBe("août 2026");
  });
});
