import { getPremiumPrices } from "@/lib/appStorePrice";

// The cache is Next's; here every call goes straight to the fetcher.
jest.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));
jest.mock("jsonwebtoken", () => ({ sign: jest.fn(() => "signed-token") }));

const ENV = {
  ASC_ISSUER_ID: "issuer",
  ASC_KEY_ID: "key",
  ASC_PRIVATE_KEY:
    "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----",
};

const app = { data: [{ type: "apps", id: "app-1" }] };
const groups = {
  data: [{ type: "subscriptionGroups", id: "group-1" }],
  included: [
    {
      type: "subscriptions",
      id: "sub-other",
      attributes: { productId: "ai.pennysave.app.other" },
    },
    {
      type: "subscriptions",
      id: "sub-premium",
      attributes: {
        productId: "ai.pennysave.app.pennysavePremium",
        subscriptionPeriod: "ONE_MONTH",
      },
    },
  ],
};

const day = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

/** A price row for `territory` at price point `point`, starting `start`. */
const row = (
  id: string,
  territory: string,
  point: string,
  start: string | null,
) => ({
  type: "subscriptionPrices",
  id,
  attributes: { startDate: start },
  relationships: {
    territory: { data: { type: "territories", id: territory } },
    subscriptionPricePoint: {
      data: { type: "subscriptionPricePoints", id: point },
    },
  },
});

const pricesResponse = {
  data: [
    row("p1", "USA", "usa-old", null),
    row("p2", "USA", "usa-now", day(-30)),
    row("p3", "USA", "usa-future", day(+30)),
    row("p4", "DEU", "deu-now", null),
  ],
  included: [
    { type: "territories", id: "USA", attributes: { currency: "USD" } },
    { type: "territories", id: "DEU", attributes: { currency: "EUR" } },
    {
      type: "subscriptionPricePoints",
      id: "usa-old",
      attributes: { customerPrice: "3.99" },
    },
    {
      type: "subscriptionPricePoints",
      id: "usa-now",
      attributes: { customerPrice: "4.99" },
    },
    {
      type: "subscriptionPricePoints",
      id: "usa-future",
      attributes: { customerPrice: "5.99" },
    },
    {
      type: "subscriptionPricePoints",
      id: "deu-now",
      attributes: { customerPrice: "5.99" },
    },
  ],
};

function mockAppStoreConnect(responses: Record<string, unknown>) {
  global.fetch = jest.fn(
    async (url: string | URL | Request): Promise<unknown> => {
      const path = String(url);
      const match = Object.keys(responses).find((key) => path.includes(key));
      // jsdom has no fetch Response; the code only reads ok/json/text.
      if (!match)
        return { ok: false, status: 404, text: async () => "not found" };
      return { ok: true, status: 200, json: async () => responses[match] };
    },
  ) as unknown as typeof fetch;
}

describe("getPremiumPrices", () => {
  const savedEnv = { ...process.env };
  const savedFetch = global.fetch;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    Object.assign(process.env, ENV);
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    process.env = { ...savedEnv };
    global.fetch = savedFetch;
    consoleError.mockRestore();
  });

  it("returns each territory's current price, ignoring past and scheduled rows", async () => {
    mockAppStoreConnect({
      "/apps?": app,
      "/subscriptionGroups": groups,
      "/subscriptions/sub-premium/prices": pricesResponse,
    });

    await expect(getPremiumPrices(["USA", "DEU"])).resolves.toEqual({
      USA: { amount: "4.99", currency: "USD", period: "ONE_MONTH" },
      DEU: { amount: "5.99", currency: "EUR", period: "ONE_MONTH" },
    });
  });

  it("asks only for the requested territories, with a bearer token", async () => {
    mockAppStoreConnect({
      "/apps?": app,
      "/subscriptionGroups": groups,
      "/subscriptions/sub-premium/prices": pricesResponse,
    });
    await getPremiumPrices(["USA", "DEU"]);

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(String(calls[2][0])).toContain("filter[territory]=USA,DEU");
    for (const [, init] of calls) {
      expect(init.headers.Authorization).toBe("Bearer signed-token");
    }
  });

  it("returns no prices when the credentials are missing", async () => {
    delete process.env.ASC_ISSUER_ID;
    global.fetch = jest.fn() as typeof fetch;

    await expect(getPremiumPrices(["USA"])).resolves.toEqual({});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns no prices when App Store Connect fails", async () => {
    mockAppStoreConnect({ "/apps?": app }); // groups request 404s

    await expect(getPremiumPrices(["USA"])).resolves.toEqual({});
    expect(consoleError).toHaveBeenCalled();
  });

  it("returns no prices when the Premium subscription isn't found", async () => {
    mockAppStoreConnect({
      "/apps?": app,
      "/subscriptionGroups": { ...groups, included: [groups.included[0]] },
    });

    await expect(getPremiumPrices(["USA"])).resolves.toEqual({});
  });
});
