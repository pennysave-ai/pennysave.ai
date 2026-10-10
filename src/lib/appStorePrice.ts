import jwt from "jsonwebtoken";
import { unstable_cache } from "next/cache";

const ASC_API = "https://api.appstoreconnect.apple.com/v1";
const BUNDLE_ID = "ai.pennysave.app";
const PREMIUM_PRODUCT_ID = "ai.pennysave.app.pennysavePremium";

export type SubscriptionPeriod =
  | "ONE_WEEK"
  | "ONE_MONTH"
  | "TWO_MONTHS"
  | "THREE_MONTHS"
  | "SIX_MONTHS"
  | "ONE_YEAR";

export interface StorePrice {
  /** Customer-facing price as Apple returns it, e.g. "4.99". */
  amount: string;
  /** ISO 4217 code, e.g. "EUR". */
  currency: string;
  period: SubscriptionPeriod;
}

/** App Store territory (ISO 3166-1 alpha-3) -> current Premium price there. */
export type StorePrices = Partial<Record<string, StorePrice>>;

interface JsonApiResource {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: { type: string; id: string } }>;
}

interface JsonApiResponse {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
}

function ascToken() {
  const issuer = process.env.ASC_ISSUER_ID;
  const keyId = process.env.ASC_KEY_ID;
  const key = (process.env.ASC_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!issuer || !keyId || !key) {
    throw new Error("App Store Connect API credentials are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iss: issuer, iat: now, exp: now + 10 * 60, aud: "appstoreconnect-v1" },
    key,
    { algorithm: "ES256", header: { alg: "ES256", kid: keyId, typ: "JWT" } },
  );
}

async function ascGet(path: string, token: string): Promise<JsonApiResponse> {
  const res = await fetch(`${ASC_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`App Store Connect ${path} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

const asArray = (data: JsonApiResponse["data"]) =>
  Array.isArray(data) ? data : [data];

async function fetchPremiumPrices(territories: string[]): Promise<StorePrices> {
  const token = ascToken();

  const apps = await ascGet(
    `/apps?filter[bundleId]=${BUNDLE_ID}&fields[apps]=bundleId`,
    token,
  );
  const app = asArray(apps.data)[0];
  if (!app) throw new Error(`App ${BUNDLE_ID} not found in App Store Connect`);

  const groups = await ascGet(
    `/apps/${app.id}/subscriptionGroups?include=subscriptions&limit[subscriptions]=50`,
    token,
  );
  const subscription = groups.included?.find(
    (r) =>
      r.type === "subscriptions" &&
      r.attributes?.productId === PREMIUM_PRODUCT_ID,
  );
  if (!subscription) {
    throw new Error(`Subscription ${PREMIUM_PRODUCT_ID} not found`);
  }
  const period = subscription.attributes?.subscriptionPeriod as SubscriptionPeriod;

  const prices = await ascGet(
    `/subscriptions/${subscription.id}/prices` +
      `?filter[territory]=${territories.join(",")}` +
      `&include=subscriptionPricePoint,territory&limit=200`,
    token,
  );
  const included = new Map(
    (prices.included ?? []).map((r) => [`${r.type}/${r.id}`, r]),
  );

  // A territory can have several price rows: the current one plus any
  // scheduled changes. Keep the latest one that has already started.
  const today = new Date().toISOString().slice(0, 10);
  const current = new Map<string, { startDate: string; price: StorePrice }>();

  for (const row of asArray(prices.data)) {
    const startDate = (row.attributes?.startDate as string | null) ?? "";
    if (startDate > today) continue;

    const territoryId = row.relationships?.territory?.data?.id;
    const pointId = row.relationships?.subscriptionPricePoint?.data?.id;
    if (!territoryId || !pointId) continue;

    const point = included.get(`subscriptionPricePoints/${pointId}`);
    const territory = included.get(`territories/${territoryId}`);
    const amount = point?.attributes?.customerPrice as string | undefined;
    const currency = territory?.attributes?.currency as string | undefined;
    if (!amount || !currency) continue;

    const prev = current.get(territoryId);
    if (!prev || startDate > prev.startDate) {
      current.set(territoryId, { startDate, price: { amount, currency, period } });
    }
  }

  return Object.fromEntries(
    [...current].map(([territory, { price }]) => [territory, price]),
  );
}

const cachedPremiumPrices = unstable_cache(fetchPremiumPrices, ["asc-premium-prices"], {
  revalidate: 60 * 60 * 24,
});

/**
 * Current Premium subscription prices from App Store Connect, cached for a
 * day. Returns an empty object if Apple can't be reached, so callers can
 * simply omit the price.
 */
export async function getPremiumPrices(territories: string[]): Promise<StorePrices> {
  try {
    return await cachedPremiumPrices(territories);
  } catch (error) {
    console.error("Failed to load Premium prices from App Store Connect:", error);
    return {};
  }
}
