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
  db: { $queryRaw: jest.fn(), $disconnect: jest.fn() },
}));

import { GET, KEEP_TOMBSTONES } from "@/app/api/webhooks/cron/prune-sync-tombstones/route";
import { db } from "@/db";

function call(secret = "s3cret") {
  return GET(
    new Request("http://localhost/api/webhooks/cron/prune-sync-tombstones", {
      headers: { Authorization: `Bearer ${secret}` },
    }),
  );
}

describe("GET /api/webhooks/cron/prune-sync-tombstones", () => {
  const env = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...env, CRON_SECRET: "s3cret" };
  });

  afterAll(() => {
    process.env = env;
  });

  it("refuses a call without the cron secret, and prunes nothing", async () => {
    const response = await call("wrong");

    expect(response.status).toBe(401);
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it("prunes what is older than the retention, and says how many", async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValue([{ dropped: 12 }]);

    const response = await call();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, dropped: 12 });
    const [, retention] = (db.$queryRaw as jest.Mock).mock.calls[0];
    expect(retention).toBe(KEEP_TOMBSTONES);
  });

  it("reports a failure as one, so the cron run shows red", async () => {
    (db.$queryRaw as jest.Mock).mockRejectedValue(new Error("db down"));

    const response = await call();

    expect(response.status).toBe(500);
    expect(db.$disconnect).toHaveBeenCalled();
  });
});
