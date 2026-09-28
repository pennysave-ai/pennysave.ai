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
  db: { transaction: { findMany: jest.fn() } },
}));

jest.mock("@/data/categoryMappings", () => ({
  getCategoryResolver: jest.fn(),
  getCategoryResolvers: jest.fn(),
}));

import { db } from "@/db";
import { getCategoryResolvers } from "@/data/categoryMappings";
import { getTransactions } from "@/data/transactions";

const access = (userId: string) => ({
  userId,
  user: { name: userId, email: null, image: null },
});

function row(id: string, createdAt: string) {
  return {
    id,
    amount: -1000,
    payee: "shop",
    notes: null,
    createdAt: new Date(createdAt),
    category: null,
    createdByUser: { id: "madrid", name: "madrid", image: null },
    account: {
      id: "shared",
      name: "Shared",
      institutionName: null,
      currency: { id: "usd", exchangeRate: 1 },
      // One account both users can see.
      userAccess: [access("madrid"), access("newyork")],
    },
  };
}

describe("getTransactions report windows", () => {
  beforeEach(() => {
    (getCategoryResolvers as jest.Mock).mockResolvedValue(
      new Map([
        ["madrid", { resolve: () => null }],
        ["newyork", { resolve: () => null }],
      ]),
    );
  });

  it("puts one row in each viewer's own month", async () => {
    // 23:30 on 31 August in Madrid is 21:30Z — and 17:30 in New York.
    // 23:30 on 31 August in New York is 03:30Z on 1 September.
    (db.transaction.findMany as jest.Mock).mockResolvedValue([
      row("madrid-late", "2026-08-31T21:30:00Z"),
      row("ny-late", "2026-09-01T03:30:00Z"),
      row("madrid-early", "2026-07-31T22:30:00Z"),
    ]);

    const { currentByUser, prevByUser } = await getTransactions({
      userIds: ["madrid", "newyork"],
      reportMonth: new Date("2026-08-01T00:00:00Z"),
      timeZones: new Map([
        ["madrid", "Europe/Madrid"],
        ["newyork", "America/New_York"],
      ]),
    });

    const ids = (m: Map<string, { id: string }[]>, user: string) =>
      (m.get(user) ?? []).map((t) => t.id).sort();

    // Madrid: 00:30 on 1 August is August; 04:30 on 1 September is not.
    expect(ids(currentByUser, "madrid")).toEqual([
      "madrid-early",
      "madrid-late",
    ]);
    // New York: 18:30 on 31 July is July; both late rows are still August.
    expect(ids(currentByUser, "newyork")).toEqual(["madrid-late", "ny-late"]);
    expect(ids(prevByUser, "newyork")).toEqual(["madrid-early"]);

    // One query, wide enough for both timezones.
    const { createdAt } = (db.transaction.findMany as jest.Mock).mock
      .calls[0][0].where;
    expect(createdAt.gte.toISOString()).toBe("2026-04-30T22:00:00.000Z");
    expect(createdAt.lt.toISOString()).toBe("2026-09-01T04:00:00.000Z");
  });
});
