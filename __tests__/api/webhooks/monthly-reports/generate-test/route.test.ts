/**
 * @jest-environment node
 */
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

jest.mock("@/db", () => ({
  db: {
    user: { findFirst: jest.fn() },
    report: { findFirst: jest.fn(), delete: jest.fn(), updateMany: jest.fn() },
    currency: { findMany: jest.fn() },
  },
}));

jest.mock("@/data/reports", () => ({
  getPrevMonthSummaries: jest.fn(),
  reportSelect: {},
  upsertReport: jest.fn(),
  withLiveFacts: jest.fn(async (_u: string, reports: unknown[]) => reports),
}));

import { POST } from "@/app/api/webhooks/monthly-reports/generate-test/route";
import { db } from "@/db";
import { getPrevMonthSummaries, upsertReport } from "@/data/reports";

const facts = {
  income: 3_000_000,
  expense: 1_000_000,
  net: 2_000_000,
  prev: null,
  categories: [],
  prevCategories: [],
  payees: [],
  largestExpenses: [],
  uncategorizedSpend: 0,
  recurring: [],
};

function call(body: unknown, secret = "s3cret") {
  return POST(
    new Request("http://localhost/api/webhooks/monthly-reports/generate-test", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/webhooks/monthly-reports/generate-test", () => {
  const env = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...env, CRON_SECRET: "s3cret", NODE_ENV: "test" };
    (db.user.findFirst as jest.Mock).mockResolvedValue({
      id: "user-1",
      preferredCurrencyId: "usd",
      timezone: "Europe/Madrid",
    });
    (db.report.findFirst as jest.Mock).mockResolvedValue(null);
    (db.currency.findMany as jest.Mock).mockResolvedValue([]);
    (getPrevMonthSummaries as jest.Mock).mockResolvedValue([
      { userId: "user-1", reportMonth: "August 2026", facts },
    ]);
  });

  afterAll(() => {
    process.env = env;
  });

  it("is off in production unless enabled", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    expect((await call({ userId: "user-1" })).status).toBe(404);
    process.env.REPORTS_TEST_ENDPOINT = "true";
    expect((await call({ userId: "user-1" }, "wrong")).status).toBe(401);
  });

  it("needs the cron secret", async () => {
    expect((await call({ userId: "user-1" }, "wrong")).status).toBe(401);
  });

  it("rejects a bad month", async () => {
    expect((await call({ userId: "user-1", month: "Aug" })).status).toBe(400);
  });

  it("builds the report for the month in the user's timezone", async () => {
    const res = await call({ email: "me@x.com", month: "2026-08" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(getPrevMonthSummaries).toHaveBeenCalledWith(
      [{ id: "user-1", currencyId: "usd", timeZone: "Europe/Madrid" }],
      [],
      new Date("2026-08-01T00:00:00Z"),
    );
    expect(upsertReport).toHaveBeenCalledWith({
      userData: expect.objectContaining({ userId: "user-1" }),
    });
    expect(json.candidates.map((c: { key: string }) => c.key)).toContain(
      "net_surplus:",
    );
  });

  it("marks the report sent unless asked to notify", async () => {
    await call({ userId: "user-1", month: "2026-08" });
    expect(db.report.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        periodStart: new Date("2026-08-01T00:00:00Z"),
        sentAt: null,
      },
      data: { sentAt: expect.any(Date) },
    });

    jest.clearAllMocks();
    await call({
      userId: "user-1",
      month: "2026-08",
      llm: false,
      notify: true,
    });
    expect(db.report.updateMany).not.toHaveBeenCalled();
  });

  it("refuses to overwrite without force", async () => {
    (db.report.findFirst as jest.Mock).mockResolvedValueOnce({ id: "old" });
    const res = await call({ userId: "user-1", month: "2026-08" });
    expect(res.status).toBe(409);
    expect(upsertReport).not.toHaveBeenCalled();
  });

  it("replaces an existing report with force", async () => {
    (db.report.findFirst as jest.Mock).mockResolvedValueOnce({ id: "old" });
    const res = await call({ userId: "user-1", month: "2026-08", force: true });
    expect(res.status).toBe(200);
    expect(db.report.delete).toHaveBeenCalledWith({ where: { id: "old" } });
    expect((await res.json()).replaced).toBe("old");
  });

  it("says so when the month has no transactions", async () => {
    (getPrevMonthSummaries as jest.Mock).mockResolvedValue([]);
    const res = await call({ userId: "user-1", month: "2026-08" });
    expect(res.status).toBe(422);
  });
});
