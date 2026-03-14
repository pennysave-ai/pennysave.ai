import { db } from "@/db";
import { Prisma } from "@prisma/client";

export type TopStoreRow = {
  userId: string;
  storeId: string;
  storeName: string | null;
  spendMilliunits: number;
  receiptCount: number;
};

type StoreLocation = {
  storeId: string;
  lat: number;
  lon: number;
  receipts: number;
};

export type ShoppingRegion = {
  centerLat: number;
  centerLon: number;
  radiusMeters: number;
  modeStoreId?: string;
};

export type CheaperNearbySuggestion = {
  canonicalItemId: string;
  itemName: string;
  storeId: string;
  storeName: string | null;
  distanceMeters: number;
  userMedianUnitPriceMilliunits: number;
  storeMedianUnitPriceMilliunits: number;
  storeMinUnitPriceMilliunits: number;
  savingsPerUnitMedianMilliunits: number;
  savingsPerUnitBestMilliunits: number;
  samples: number;
  lastSeenAt: Date | null;
};

/**
 * NOOP - is not used so far
 * Returns each user's top stores (by spend) within a date range.
 *
 * Join ReceiptItem -> Receipt -> UserAccountAccess -> Store to attribute
 * receipt spend to the correct user and store.
 * Aggregate per (userId, storeId) to get:
 *    - total spend in that store
 *    - number of distinct receipts for that store
 * Rank stores per user and keep only the top N.
 * @param {Object} params
 * @param {Prisma.Sql} params.price - SQL expression for the price to sum
 * @param {Array<string>} params.userIds - list of user IDs to include
 * @param {Date} params.start - start date for receipts to include
 * @param {Date} params.end - end date for receipts to include
 * @returns {Promise<Array<TopStoreRow>>} list of top stores per user with spend and receipt count
 */
export async function getTopStores({
  price,
  userIds,
  start,
  end,
}: {
  price: Prisma.Sql;
  userIds: string[];
  start: Date;
  end: Date;
}) {
  const TOP_STORES_LIMIT = 10;
  try {
    return await db.$queryRaw<TopStoreRow[]>(Prisma.sql`
        WITH store_spend AS (
          SELECT
            uaa."userId" AS "userId",
            s."id" AS "storeId",
            s."name" AS "storeName",
            SUM(${price})::bigint AS "spendMilliunits",
            COUNT(DISTINCT r."id")::int AS "receiptCount"
          FROM "ReceiptItem" ri
          JOIN "Receipt" r ON r."id" = ri."receiptId"
          JOIN "UserAccountAccess" uaa ON uaa."userAccountId" = r."accountId"
          JOIN "Store" s ON s."id" = r."storeId"
          WHERE uaa."userId" IN (${Prisma.join(userIds)})
            AND COALESCE(r."purchasedAt", r."createdAt") >= ${start}
            AND COALESCE(r."purchasedAt", r."createdAt") <= ${end}
            AND ${price} IS NOT NULL
          GROUP BY uaa."userId", s."id", s."name"
        ),
        ranked AS (
          SELECT
            *,
            ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "spendMilliunits" DESC) AS rn
          FROM store_spend
        )
        SELECT
          "userId",
          "storeId",
          "storeName",
          "spendMilliunits",
          "receiptCount"
        FROM ranked
        WHERE rn <= ${TOP_STORES_LIMIT}
        ORDER BY "userId", "spendMilliunits" DESC
      `);
  } catch (e) {
    console.error("Error getting top stores:", e);
    throw new Error("Failed to get top stores");
  }
}

/**
 * Get visited store locations for a user's receipts in a date range.
 * Join Receipt -> UserAccountAccess -> Store to attribute receipts to the correct user and store.
 * Return the store's location (lat/lon) and number of receipts (weight) for each store visited by the user.
 * @param {string} userId - user ID to get store locations for
 * @param {Date} start - start date for receipts to include
 * @param {Date} end - end date for receipts to include
 * @returns {Promise<Array<StoreLocation>>} list of store locations with receipt counts
 */
async function getVisitedStoreLocations(
  userId: string,
  start: Date,
  end: Date,
) {
  try {
    return await db.$queryRaw<StoreLocation[]>(Prisma.sql`
        SELECT
          s."id" AS "storeId",
          ST_Y(s."geom"::geometry)::double precision AS "lat",
          ST_X(s."geom"::geometry)::double precision AS "lon",
          COUNT(DISTINCT r."id")::int AS "receipts"
        FROM "Receipt" r
        JOIN "UserAccountAccess" uaa ON uaa."userAccountId" = r."accountId"
        JOIN "Store" s ON s."id" = r."storeId"
        WHERE uaa."userId" = ${userId}
          AND s."geom" IS NOT NULL
          AND COALESCE(r."purchasedAt", r."createdAt") >= ${start}
          AND COALESCE(r."purchasedAt", r."createdAt") <= ${end}
        GROUP BY s."id", s."geom"
        ORDER BY "receipts" DESC
      `);
  } catch (e) {
    console.error("Error getting visited store locations:", e);
    throw new Error("Failed to get visited store locations");
  }
}

/**
 * Get a user's shopping region based on the locations of stores they've visited in a date range.
 * Get the user's visited store locations and receipt counts (weights).
 * Calculate the weighted centroid of the store locations to find the center of the shopping region.
 * Calculate the distance from each visited store to the centroid and determine a radius that covers the majority of visits, with outlier handling.
 * Return the shopping region as a circle (center lat/lon and radius in meters) and the most visited store ID.
 * @param {Object} params
 * @param {string} params.userId - user ID to get shopping region for
 * @param {Date} params.start - start date for receipts to include
 * @param {Date} params.end - end date for receipts to include
 * @param {number} [params.minRadiusMeters=3000] - minimum radius of the shopping region in meters
 * @param {number} [params.maxRadiusMeters=20000] - maximum radius of the shopping region in meters
 * @param {number} [params.bufferMeters=500] - additional buffer to add to the radius in meters
 * @returns {Promise<ShoppingRegion|null>} the user's shopping region or null if no store visits found
 */
export async function getUserShoppingRegion(params: {
  userId: string;
  start: Date;
  end: Date;
  minRadiusMeters?: number; // default 3000
  maxRadiusMeters?: number; // default 20000
  bufferMeters?: number; // default 500
}): Promise<ShoppingRegion | null> {
  const {
    userId,
    start,
    end,
    minRadiusMeters = 3000,
    maxRadiusMeters = 20000,
    bufferMeters = 500,
  } = params;

  const points = await getVisitedStoreLocations(userId, start, end);
  if (!points.length) return null;

  const mode = points[0]!;
  const center =
    points.length < 3
      ? { lat: mode.lat, lon: mode.lon }
      : weightedCentroid(points);

  const distances = points.map((p) =>
    distanceMeters(center, { lat: p.lat, lon: p.lon }),
  );
  const p90 = percentile(distances, 0.9);
  const maxD = Math.max(...distances);

  // Outlier handling: if a single far trip exists, don't let it blow up the radius
  const base = maxD > 3 * p90 ? p90 : Math.max(p90, minRadiusMeters);

  const radiusMeters = clamp(
    base + bufferMeters,
    minRadiusMeters,
    maxRadiusMeters,
  );

  return {
    centerLat: center.lat,
    centerLon: center.lon,
    radiusMeters,
    modeStoreId: mode.storeId,
  };
}

/**
 * Computes a weighted geographic “center point” (centroid) from a set of store locations.
 * Each store location has a latitude, longitude, and a weight (number of receipts).
 * The centroid is calculated as the weighted average of the latitudes and longitudes.
 * This gives more influence to stores with more receipts, reflecting the user's shopping habits.
 * @param {Array<StoreLocation>} points - list of store locations with lat, lon, and receipts (weight)
 * @returns {Object} the weighted centroid with lat and lon
 */
function weightedCentroid(points: StoreLocation[]) {
  let wSum = 0;
  let latSum = 0;
  let lonSum = 0;

  for (const p of points) {
    const w = Math.max(1, p.receipts);
    wSum += w;
    latSum += p.lat * w;
    lonSum += p.lon * w;
  }

  return { lat: latSum / wSum, lon: lonSum / wSum };
}

/**
 * Calculate the distance in meters between two lat/lon points using the Haversine formula.
 * This is used to determine how far each visited store is from the shopping region centroid.
 * @param {Object} a - first point with lat and lon
 * @param {Object} b - second point with lat and lon
 * @returns {number} distance in meters between the two points
 */
function distanceMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Calculate the p-th percentile of an array of numbers.
 * Used to compute distances from the centroid to each visited store,
 * So one far-out trip doesn’t blow up the radius.
 * @param {Array<number>} values - array of numbers to calculate the percentile from
 * @param {number} p - percentile to calculate (between 0 and 1)
 * @returns {number} the p-th percentile value
 */
function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const idx = Math.min(v.length - 1, Math.max(0, Math.ceil(p * v.length) - 1));
  return v[idx]!;
}

/**
 * Clamp a number between a minimum and maximum value.
 * Used to ensure the shopping region radius stays within reasonable bounds.
 * @param {number} n - the number to clamp
 * @param {number} min - minimum allowed value
 * @param {number} max - maximum allowed value
 * @returns {number} the clamped value
 */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Get suggestions for cheaper nearby stores for items a user has purchased.
 * For each canonical item ID, find nearby stores where the user has purchased that item.
 * Calculate the user's median unit price for that item and the store's median and minimum unit price.
 * Suggest stores where the price is at least a certain amount cheaper than the user's median price, with enough samples for confidence.
 * Return the suggestions with potential savings and store information.
 * @param {Object} params
 * @param {string} params.userId - user ID to get suggestions for
 * @param {Array<string>} params.canonicalItemIds - list of canonical item IDs to find suggestions for
 * @param {string} params.currencyId - currency ID to filter receipts by
 * @param {number} params.lat - latitude of the user's location for finding nearby stores
 * @param {number} params.lon - longitude of the user's location for finding nearby stores
 * @param {number} params.radiusMeters - radius in meters to search for nearby stores
 * @param {Date} params.start - start date for receipts to include in price calculations
 * @param {Date} params.end - end date for receipts to include in price calculations
 * @param {number} [params.minSavingsPerUnitMilliunits=250] - minimum savings per unit in milliunits to consider a store as cheaper
 * @param {number} [params.minSamples=3] - minimum number of samples (receipts) required for a store's price to be considered reliable
 * @param {number} [params.maxStoresPerItem=3] - maximum number of store suggestions to return per item
 * @returns {Promise<Array<CheaperNearbySuggestion>>} list of cheaper nearby store suggestions for the user's purchased items
 */
export async function getCheaperNearbySuggestions({
  userId,
  canonicalItemIds,
  currencyId,
  lat,
  lon,
  radiusMeters,
  start,
  end,
  minSavingsPerUnitMilliunits = 250,
  minSamples = 3,
  maxStoresPerItem = 3,
}: {
  userId: string;
  canonicalItemIds: string[];
  currencyId: string;
  lat: number;
  lon: number;
  radiusMeters: number;
  start: Date;
  end: Date;
  minSavingsPerUnitMilliunits?: number;
  minSamples?: number;
  maxStoresPerItem?: number;
}) {
  if (!canonicalItemIds.length) return [];

  const effectiveUnitPrice = Prisma.sql`
    CASE
      WHEN ri."unitPrice" IS NOT NULL THEN ri."unitPrice"::bigint
      WHEN ri."price" IS NOT NULL AND ri."quantity" IS NOT NULL AND ri."quantity" > 0
        THEN ROUND(ri."price"::numeric / ri."quantity"::numeric)::bigint
      ELSE NULL
    END
  `;

  const rows = await db.$queryRaw<CheaperNearbySuggestion[]>(Prisma.sql`
    WITH user_items AS (
      -- Use text[] to avoid uuid/text operator mismatch across environments
      SELECT unnest(ARRAY[${Prisma.join(canonicalItemIds)}]::text[]) AS "canonicalItemIdText"
    ),

    user_baseline AS (
      SELECT
        ui."canonicalItemIdText" AS "canonicalItemId",
        COALESCE(ci."canonicalName", 'item') AS "itemName",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY ${effectiveUnitPrice})::bigint
          AS "userMedianUnitPriceMilliunits"
      FROM user_items ui
      JOIN "ReceiptItem" ri
        ON ri."canonicalItemId" IS NOT NULL
       AND ri."canonicalItemId"::text = ui."canonicalItemIdText"
      JOIN "Receipt" r ON r."id" = ri."receiptId"
      JOIN "UserAccountAccess" uaa ON uaa."userAccountId" = r."accountId"
      LEFT JOIN "CanonicalItem" ci
        ON ci."id"::text = ui."canonicalItemIdText"
      WHERE uaa."userId" = ${userId}
        AND r."currencyId"::text = ${currencyId}
        AND COALESCE(r."purchasedAt", r."createdAt") >= ${start}
        AND COALESCE(r."purchasedAt", r."createdAt") <= ${end}
        AND ${effectiveUnitPrice} IS NOT NULL
      GROUP BY ui."canonicalItemIdText", COALESCE(ci."canonicalName", 'item')
    ),

    nearby_stores AS (
      SELECT
        s."id" AS "storeId",
        s."name" AS "storeName",
        ST_Distance(
          s."geom",
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
        )::double precision AS "distanceMeters"
      FROM "Store" s
      WHERE s."geom" IS NOT NULL
        AND ST_DWithin(
          s."geom",
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
    ),

    store_prices AS (
      SELECT
        ub."canonicalItemId",
        ub."itemName",
        ns."storeId",
        ns."storeName",
        ns."distanceMeters",

        ub."userMedianUnitPriceMilliunits",

        percentile_cont(0.5) WITHIN GROUP (ORDER BY ${effectiveUnitPrice})::bigint
          AS "storeMedianUnitPriceMilliunits",
        MIN(${effectiveUnitPrice})::bigint
          AS "storeMinUnitPriceMilliunits",

        COUNT(*)::int AS "samples",
        MAX(COALESCE(r."purchasedAt", r."createdAt"))::timestamp AS "lastSeenAt"
      FROM user_baseline ub
      JOIN nearby_stores ns ON TRUE
      JOIN "Receipt" r ON r."storeId" = ns."storeId"
      JOIN "ReceiptItem" ri ON ri."receiptId" = r."id"
      WHERE r."currencyId"::text = ${currencyId}
        AND ri."canonicalItemId" IS NOT NULL
        AND ri."canonicalItemId"::text = ub."canonicalItemId"
        AND COALESCE(r."purchasedAt", r."createdAt") >= ${start}
        AND COALESCE(r."purchasedAt", r."createdAt") <= ${end}
        AND ${effectiveUnitPrice} IS NOT NULL
      GROUP BY
        ub."canonicalItemId",
        ub."itemName",
        ns."storeId",
        ns."storeName",
        ns."distanceMeters",
        ub."userMedianUnitPriceMilliunits"
    ),

    scored AS (
      SELECT
        sp.*,
        (sp."userMedianUnitPriceMilliunits" - sp."storeMedianUnitPriceMilliunits")::bigint
          AS "savingsPerUnitMedianMilliunits",
        (sp."userMedianUnitPriceMilliunits" - sp."storeMinUnitPriceMilliunits")::bigint
          AS "savingsPerUnitBestMilliunits",
        ROW_NUMBER() OVER (
          PARTITION BY sp."canonicalItemId"
          ORDER BY
            (sp."userMedianUnitPriceMilliunits" - sp."storeMedianUnitPriceMilliunits") DESC,
            sp."samples" DESC,
            sp."distanceMeters" ASC
        ) AS rn
      FROM store_prices sp
      WHERE (sp."userMedianUnitPriceMilliunits" - sp."storeMedianUnitPriceMilliunits") >= ${minSavingsPerUnitMilliunits}
        AND sp."samples" >= ${minSamples}
    )
    SELECT
      "canonicalItemId",
      "itemName",
      "storeId",
      "storeName",
      "distanceMeters",
      "userMedianUnitPriceMilliunits",
      "storeMedianUnitPriceMilliunits",
      "storeMinUnitPriceMilliunits",
      "savingsPerUnitMedianMilliunits",
      "savingsPerUnitBestMilliunits",
      "samples",
      "lastSeenAt"
    FROM scored
    WHERE rn <= ${maxStoresPerItem}
    ORDER BY "canonicalItemId", "savingsPerUnitMedianMilliunits" DESC, "samples" DESC, "distanceMeters" ASC
  `);

  return rows.map((r) => ({
    ...r,
    distanceMeters: Number(r.distanceMeters),
    userMedianUnitPriceMilliunits: Number(r.userMedianUnitPriceMilliunits),
    storeMedianUnitPriceMilliunits: Number(r.storeMedianUnitPriceMilliunits),
    storeMinUnitPriceMilliunits: Number(r.storeMinUnitPriceMilliunits),
    savingsPerUnitMedianMilliunits: Number(r.savingsPerUnitMedianMilliunits),
    savingsPerUnitBestMilliunits: Number(r.savingsPerUnitBestMilliunits),
    samples: Number(r.samples),
    lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt) : null,
  }));
}
