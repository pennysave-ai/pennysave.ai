import { NextResponse } from "next/server";
import { db } from "@/db";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

type NormalizedUnit = "kg" | "l" | "unit";
type ParsedUnit =
  | "kg"
  | "g"
  | "lb"
  | "oz"
  | "l"
  | "ml"
  | "cl"
  | "fl_oz"
  | "pt"
  | "qt"
  | "gal"
  | "unit";

function sanitizeUnit(raw: unknown): ParsedUnit | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim().toLowerCase();
  if (!s) return null;

  // Remove spaces and punctuation except underscore (fl_oz)
  s = s.replace(/\s+/g, "");
  s = s.replace(/[().,;:]/g, "");

  // Reject currency / junk
  const currencyLike = ["€", "eur", "euro", "$", "usd", "£", "gbp"];
  if (currencyLike.includes(s)) return null;

  // Common OCR variants / Spanish
  if (
    [
      "ud",
      "uds",
      "u",
      "un",
      "uni",
      "unidad",
      "unidades",
      "each",
      "ea",
      "pc",
      "pcs",
      "piece",
      "unit",
    ].includes(s)
  ) {
    return "unit";
  }

  if (["kg", "kilo", "kilos"].includes(s)) return "kg";
  if (["g", "gr", "grs", "gramo", "gramos"].includes(s)) return "g";

  if (["l", "lt", "lts", "litro", "litros"].includes(s)) return "l";
  if (["ml", "mililitro", "mililitros"].includes(s)) return "ml";
  if (["cl", "centilitro", "centilitros"].includes(s)) return "cl";

  // US/Imperial weight
  if (["lb", "lbs", "libra", "libras"].includes(s)) return "lb";
  if (["oz", "onza", "onzas"].includes(s)) return "oz";

  // US volume
  if (["floz", "fl_oz", "fl-oz", "fl.oz", "flounce", "fluidounce"].includes(s))
    return "fl_oz";
  if (["pt", "pint", "pinta", "pintas"].includes(s)) return "pt";
  if (["qt", "quart", "cuarto", "cuartos"].includes(s)) return "qt";
  if (["gal", "gallon", "galon", "galones"].includes(s)) return "gal";

  // Sometimes OCR returns "€/kg" or "eur/l" — detect embedded unit
  if (s.includes("kg")) return "kg";
  if (s.includes("ml")) return "ml";
  if (s.includes("cl")) return "cl";
  if (s.includes("fl_oz") || s.includes("floz")) return "fl_oz";
  if (s.includes("gal")) return "gal";
  if (s.includes("qt")) return "qt";
  if (s.includes("pt")) return "pt";
  if (s.includes("lb")) return "lb";
  if (s.includes("oz")) return "oz";
  if (s === "l") return "l";

  return null;
}

function sanitizeQuantity(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  if (raw <= 0) return null;
  return raw;
}

function isIntegerish(n: number) {
  return Math.abs(n - Math.round(n)) < 0.01;
}

function normalizeToBaseUnit(
  qty: number,
  unit: ParsedUnit,
): { baseUnit: NormalizedUnit; baseQty: number } | null {
  // Weight -> kg
  const LB_TO_KG = 0.45359237;
  const OZ_TO_KG = 0.028349523125;

  // Volume -> L (US)
  const FLOZ_US_TO_L = 0.0295735295625;
  const PT_US_TO_L = 0.473176473;
  const QT_US_TO_L = 0.946352946;
  const GAL_US_TO_L = 3.785411784;

  if (unit === "kg") return { baseUnit: "kg", baseQty: qty };
  if (unit === "g") return { baseUnit: "kg", baseQty: qty / 1000 };
  if (unit === "lb") return { baseUnit: "kg", baseQty: qty * LB_TO_KG };
  if (unit === "oz") return { baseUnit: "kg", baseQty: qty * OZ_TO_KG };

  if (unit === "l") return { baseUnit: "l", baseQty: qty };
  if (unit === "ml") return { baseUnit: "l", baseQty: qty / 1000 };
  if (unit === "cl") return { baseUnit: "l", baseQty: qty / 100 };
  if (unit === "fl_oz") return { baseUnit: "l", baseQty: qty * FLOZ_US_TO_L };
  if (unit === "pt") return { baseUnit: "l", baseQty: qty * PT_US_TO_L };
  if (unit === "qt") return { baseUnit: "l", baseQty: qty * QT_US_TO_L };
  if (unit === "gal") return { baseUnit: "l", baseQty: qty * GAL_US_TO_L };

  if (unit === "unit") return { baseUnit: "unit", baseQty: qty };

  return null;
}

function computeUnitEconomics(params: {
  quantity: number | null;
  unitRaw: string | null;
  unitPriceMilli: number | null; // per declared unit
  linePriceMilli: number; // line total
}) {
  const { quantity, unitRaw, unitPriceMilli, linePriceMilli } = params;

  const unitSanitized = sanitizeUnit(unitRaw);

  // Conservative fallback: if unit missing/invalid but quantity looks like a count, treat as "unit"
  const unitForNormalization: ParsedUnit | null =
    unitSanitized ??
    (quantity != null && isIntegerish(quantity) && quantity <= 50
      ? "unit"
      : null);

  // unitPrice fallback: if missing but we have quantity, derive price per declared unit
  const derivedUnitPrice =
    unitPriceMilli == null && quantity != null && quantity > 0
      ? Math.round(linePriceMilli / quantity)
      : unitPriceMilli;

  let normalizedUnit: NormalizedUnit | null = null;
  let normalizedQuantity: number | null = null;
  let normalizedUnitPrice: number | null = null;

  if (unitForNormalization && quantity != null && derivedUnitPrice != null) {
    const base = normalizeToBaseUnit(quantity, unitForNormalization);
    if (base && base.baseQty > 0) {
      normalizedUnit = base.baseUnit;
      normalizedQuantity = base.baseQty;

      // Convert price-per-original-unit to price-per-base-unit:
      // baseUnitPrice = (unitPrice / baseQtyOriginalUnitInBase)
      //
      // We can compute this by:
      // - baseQty = quantity expressed in base units
      // - derivedUnitPrice is per 1 original unit
      // - need scale factor between original unit and base unit:
      //   scale = baseQty / quantity
      //
      // Then: price per base unit = price per original unit / scale
      const scale = base.baseQty / quantity;
      if (scale > 0) {
        normalizedUnitPrice = Math.round(derivedUnitPrice / scale);
      }
    }
  }

  // Keep unitPrice even if normalization fails (still useful for item-level medians)
  return {
    unitPriceMilli: derivedUnitPrice,
    normalizedUnit,
    normalizedQuantity,
    normalizedUnitPrice,
  };
}

function roundTo7(n: number) {
  return Math.round(n * 1e7) / 1e7;
}

function sanitizeStreetName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;

  // Normalize whitespace
  s = s.replace(/\s+/g, " ");

  // Remove common Spanish/LatAm road-type prefixes at the START
  const prefixes: RegExp[] = [
    /^\s*(avda\.?|av\.?|avenida)\s+/i,
    /^\s*(c\/|calle|cl\.?)\s+/i,
    /^\s*(pza\.?|plaza)\s+/i,
    /^\s*(pso\.?|paseo)\s+/i,
    /^\s*(bda\.?|barriada)\s+/i,
    /^\s*(ctra\.?|carretera)\s+/i,
    /^\s*(camino|cmno\.?)\s+/i,
    /^\s*(ronda|rda\.?)\s+/i,
  ];

  let prev: string;
  do {
    prev = s;
    for (const re of prefixes) s = s.replace(re, "");
    s = s.trim();
  } while (s !== prev);

  // NEW: remove trailing numbers / house numbers / unit indicators
  // Examples:
  // "BEL-AIR, 2" -> "BEL-AIR"
  // "BEL-AIR 2"  -> "BEL-AIR"
  // "BEL-AIR Nº 2" -> "BEL-AIR"
  // "BEL-AIR 2B" -> "BEL-AIR" (optional; remove alphanumeric suffix too)
  const trailingNumberPatterns: RegExp[] = [
    /\s*[,;/-]?\s*(n[º°o.]?\s*)?\d+[a-z]?\s*$/i, // ", 2", "Nº 2", "2B"
    /\s*[,;/-]?\s*(piso|planta|pta\.?|puerta|portal|esc\.?|escalera)\s*\w*\s*$/i, // "PISO 2", "PTA A"
  ];

  prev = "";
  while (s !== prev) {
    prev = s;
    for (const re of trailingNumberPatterns) s = s.replace(re, "");
    s = s.replace(/\s*[,;/-]+\s*$/g, "").trim();
  }

  // If we stripped everything, fall back to original
  if (s.length < 2) return raw.trim() || null;

  return s;
}

function sanitizePayee(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  let s = raw.trim();
  if (!s) return null;

  // Normalize whitespace + some punctuation variants
  s = s.replace(/\s+/g, " ").replace(/[·•]/g, ".").trim();

  // Remove common legal entity suffixes at the END of the string (repeat until stable)
  // Covers: S.A. / SA / Sociedad Anónima, S.L. / SL, S.R.L. / SRL, LLC, Inc, Ltd, GmbH, etc.
  const suffixPatterns: RegExp[] = [
    /\s*[,.-]?\s*\(?\s*sociedad\s+an[oó]nima\s*\)?\s*$/i,
    /\s*[,.-]?\s*\(?\s*s\.?\s*a\.?\s*\)?\s*$/i, // S.A., SA
    /\s*[,.-]?\s*\(?\s*sociedad\s+limitada\s*\)?\s*$/i,
    /\s*[,.-]?\s*\(?\s*s\.?\s*l\.?\s*\)?\s*$/i, // S.L., SL
    /\s*[,.-]?\s*\(?\s*s\.?\s*r\.?\s*l\.?\s*\)?\s*$/i, // S.R.L., SRL
    /\s*[,.-]?\s*\(?\s*l\.?\s*l\.?\s*c\.?\s*\)?\s*$/i, // LLC
    /\s*[,.-]?\s*\(?\s*inc\.?\s*\)?\s*$/i,
    /\s*[,.-]?\s*\(?\s*ltd\.?\s*\)?\s*$/i,
    /\s*[,.-]?\s*\(?\s*limited\s*\)?\s*$/i,
    /\s*[,.-]?\s*\(?\s*corp\.?\s*\)?\s*$/i,
    /\s*[,.-]?\s*\(?\s*gmbh\s*\)?\s*$/i,
    /\s*[,.-]?\s*\(?\s*s\.?\s*p\.?\s*a\.?\s*\)?\s*$/i, // S.p.A.
    /\s*[,.-]?\s*\(?\s*a\.?\s*s\.?\s*\)?\s*$/i, // A/S, AS
  ];

  let prev: string;
  do {
    prev = s;
    for (const re of suffixPatterns) s = s.replace(re, "");
    s = s.replace(/\s*[,.-]+\s*$/g, "").trim(); // cleanup trailing punctuation
  } while (s !== prev);

  // Avoid returning something too short/meaningless after stripping
  if (s.length < 2) return raw.trim() || null;

  return s;
}

function decimalToMilliunits(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.round(n * 1000);
}

function normalizeItemName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s.-]/gu, "")
    .trim();
  return s.length ? s : null;
}

function toPgVectorLiteral(v: number[]): string {
  // pgvector input: '[0.1,0.2,...]'
  return `[${v.map((x) => (Number.isFinite(x) ? x.toFixed(8) : "0")).join(",")}]`;
}

async function embedTextHF(text: string): Promise<number[]> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN is not set");

  const model = "sentence-transformers/all-MiniLM-L6-v2";

  const url = `https://router.huggingface.co/hf-inference/models/${model}/pipeline/feature-extraction`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`HF embedding failed (${resp.status}): ${body}`);
  }

  const json = await resp.json();

  // Most common: number[]
  if (Array.isArray(json) && typeof json[0] === "number")
    return json as number[];

  // Sometimes: number[][] => mean-pool
  if (Array.isArray(json) && Array.isArray(json[0])) {
    const mat = json as number[][];
    const dim = mat[0]?.length ?? 0;
    const out = new Array(dim).fill(0);
    for (const row of mat) for (let i = 0; i < dim; i++) out[i] += row[i] ?? 0;
    for (let i = 0; i < dim; i++) out[i] /= mat.length || 1;
    return out;
  }

  throw new Error("HF embed returned unexpected shape");
}

async function geocodeWithNominatim({
  city,
  street,
  postalcode,
  amenity,
}: {
  city?: string;
  street?: string;
  postalcode?: string;
  amenity?: string;
}) {
  if (!city?.trim() && !street?.trim() && !postalcode?.trim()) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("street", street || "");
  url.searchParams.set("city", city || "");
  url.searchParams.set("postalcode", postalcode || "");
  if (amenity?.trim()) {
    url.searchParams.set("amenity", amenity);
  }
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim requires a User-Agent that identifies your application.
      "User-Agent": "pennysave.ai/receipt-ocr (server-side geocode)",
      Accept: "application/json",
    },
    // keep default cache semantics; adjust if you add your own caching later
  });

  if (!res.ok) return null;

  const results = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const top = results?.[0];
  const lat = top?.lat ? Number.parseFloat(top.lat) : NaN;
  const lon = top?.lon ? Number.parseFloat(top.lon) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { latitude: roundTo7(lat), longitude: roundTo7(lon) };
}

/**
 * POST OCR recognition result and upsert related data (Store, Receipt) in db.
 * @param req
 * @returns {Promise<NextResponse>}
 */
async function handler(req: Request): Promise<NextResponse> {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const { receipt, user, account, transactionId } = await req.json();

  if (!transactionId) {
    console.error("transactionId is required in OCR payload");
    return NextResponse.json(
      { status: "error", message: "transactionId is required" },
      { status: 400 },
    );
  }

  if (!user?.id) {
    console.error("user.id is required in OCR payload");
    return NextResponse.json(
      { status: "error", message: "user.id is required" },
      { status: 400 },
    );
  }

  if (!account?.id) {
    console.error("account.id is required in OCR payload");
    return NextResponse.json(
      { status: "error", message: "account.id is required" },
      { status: 400 },
    );
  }

  // If Receipt.currencyId is required in schema, this must be present:
  if (!account?.currency?.id) {
    console.error("!account?.currency?.id is required in OCR payload");
    return NextResponse.json(
      { status: "error", message: "account.currencyId is required" },
      { status: 400 },
    );
  }

  // Refine address coordinates (more precise) if needed
  const receiptAdress = receipt?.adress;
  const rawOCRStreet = receiptAdress?.street || "";
  const sanitizedStreet = sanitizeStreetName(rawOCRStreet);
  const sanitizedPayee = sanitizePayee(receipt.payee);

  console.log("Sanitized street:", sanitizedStreet);
  console.log("Sanitized payee:", sanitizedPayee);

  const coordinates = await geocodeWithNominatim({
    city: receiptAdress?.city,
    street: sanitizedStreet || rawOCRStreet,
    postalcode: receiptAdress?.postalcode,
    amenity: sanitizedPayee || "",
  });

  const purchasedAt =
    receipt?.datetime && !Number.isNaN(new Date(receipt.datetime).getTime())
      ? new Date(receipt.datetime)
      : null;

  const ocrItems: Array<{
    name?: string;
    quantity?: number;
    unit_price?: number;
    unit?: string;
    price?: number;
  }> = Array.isArray(receipt?.items) ? receipt.items : [];

  // Precompute embeddings OUTSIDE the DB transaction (network calls)
  const uniqueCanonicalNames = Array.from(
    new Set(
      ocrItems
        .map((it) => normalizeItemName(it?.name))
        .filter((x): x is string => Boolean(x)),
    ),
  );

  const embeddingByName = new Map<
    string,
    { embedding: number[]; vec: string }
  >();
  for (const name of uniqueCanonicalNames) {
    const emb = await embedTextHF(name);

    if (emb.length !== 384) {
      throw new Error(
        `Embedding dim mismatch: got ${emb.length}, expected 384`,
      );
    }
    // If you ever switch models, ensure schema vector(N) matches returned length.
    embeddingByName.set(name, { embedding: emb, vec: toPgVectorLiteral(emb) });
  }
  // Solve the issue when nominatim could not find coordinates
  const result = await db.$transaction(async (tx) => {
    // 1) Resolve/upsert Store (global)
    let storeId: string | null = null;

    const storeName = sanitizedPayee || receipt?.payee || null;

    const storeStreet = sanitizedStreet || receiptAdress?.street || null;
    const storeCity = receiptAdress?.city || null;
    const storePostalCode = receiptAdress?.postalcode || null;
    const storeCountry = receiptAdress?.country || null;

    // If we have coordinates and a store name, try to find existing store within 75m
    if (storeName && coordinates?.latitude && coordinates?.longitude) {
      const lat = coordinates.latitude;
      const lon = coordinates.longitude;

      // Do not a create stores with the same name within 75 meters
      const radiusMeters = 75;

      const existing = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Store"
        WHERE lower("name") = lower(${storeName})
          AND "geom" IS NOT NULL
          AND ST_DWithin(
            "geom",
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
        LIMIT 1
      `;

      if (existing.length) {
        storeId = existing[0]!.id;
      } else {
        const created = await tx.store.create({
          data: {
            name: storeName,
            street: storeStreet,
            city: storeCity,
            postalCode: storePostalCode,
            country: storeCountry,
          },
          select: { id: true },
        });

        storeId = created.id;
      }

      // Set/refresh geom via SQL (Unsupported geography type)
      await tx.$executeRaw`
        UPDATE "Store"
        SET "geom" = ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
            "updatedAt" = now()
        WHERE "id" = ${storeId}
      `;
    }

    // If we couuld not found coordinates/store, looking up by name only
    if (!storeId && storeName) {
      const existingByIdentity = await tx.store.findFirst({
        where: {
          name: { equals: storeName, mode: "insensitive" },
          // use whichever fields you trust from OCR; city+postal is usually safer than street
          city: storeCity,
          postalCode: storePostalCode,
          country: storeCountry,
        },
        select: { id: true },
      });

      if (existingByIdentity) {
        storeId = existingByIdentity.id;
      } else {
        const createdStub = await tx.store.create({
          data: {
            name: storeName,
            street: storeStreet,
            city: storeCity,
            postalCode: storePostalCode,
            country: storeCountry,
            // geom intentionally left null; backfill later
          },
          select: { id: true },
        });
        storeId = createdStub.id;
      }
    }

    // 3) Upsert Receipt by transactionId (idempotent)
    const savedReceipt = await tx.receipt.upsert({
      where: { transactionId },
      create: {
        accountId: account.id,
        createdBy: user.id,
        currencyId: account.currency?.id,
        storeId,
        transactionId,
        purchasedAt,
        rawOCRAddress: rawOCRStreet,
      },
      update: {
        storeId,
        purchasedAt,
      },
      select: { id: true, storeId: true },
    });

    // 3) Replace ReceiptItems (retry-safe)
    await tx.receiptItem.deleteMany({ where: { receiptId: savedReceipt.id } });

    // 4) Resolve CanonicalItem for each item + insert ReceiptItem
    const threshold = 0.25; // cosine distance; tune later

    const receiptItemRows: Array<{
      receiptId: string;
      rawName: string;
      canonicalItemId: string | null;
      quantity: number | null;
      unit: string | null;
      unitPrice: number | null;
      price: number;
      normalizedQuantity: number | null;
      normalizedUnit: string | null;
      normalizedUnitPrice: number | null;
    }> = [];

    for (const it of ocrItems) {
      const rawName = typeof it?.name === "string" ? it.name.trim() : "";
      if (!rawName) continue;

      const unitRaw = typeof it?.unit === "string" ? it.unit.trim() : null;
      const quantity = sanitizeQuantity(it?.quantity);

      const canonicalName = normalizeItemName(rawName);
      const unitPrice = decimalToMilliunits(it?.unit_price);
      const price = decimalToMilliunits(it?.price);

      // ReceiptItem.price is required (Int). Skip if missing.
      if (price == null) continue;

      let canonicalItemId: string | null = null;

      if (canonicalName) {
        const emb = embeddingByName.get(canonicalName);
        if (emb?.vec) {
          // Vector search best candidate
          const best = await tx.$queryRaw<
            Array<{ id: string; distance: number }>
          >`
            SELECT "id", ("embedding" <=> ${emb.vec}::vector) AS distance
            FROM "CanonicalItem"
            WHERE "embedding" IS NOT NULL
            ORDER BY distance ASC
            LIMIT 1
          `;

          if (best[0] && best[0].distance <= threshold) {
            canonicalItemId = best[0].id;
          } else {
            // Create new canonical item, then set embedding via raw SQL
            const created = await tx.canonicalItem.create({
              data: { canonicalName },
              select: { id: true },
            });

            await tx.$executeRaw`
              UPDATE "CanonicalItem"
              SET "embedding" = ${emb.vec}::vector
              WHERE "id" = ${created.id}
            `;

            canonicalItemId = created.id;
          }
        }
      }

      const econ = computeUnitEconomics({
        quantity,
        unitRaw,
        unitPriceMilli: unitPrice,
        linePriceMilli: price,
      });

      receiptItemRows.push({
        receiptId: savedReceipt.id,
        rawName,
        canonicalItemId,
        quantity: typeof it?.quantity === "number" ? it.quantity : null,
        unit: typeof it?.unit === "string" ? it.unit : null,
        unitPrice,
        price,
        normalizedQuantity: econ.normalizedQuantity,
        normalizedUnit: econ.normalizedUnit,
        normalizedUnitPrice: econ.normalizedUnitPrice,
      });
    }

    if (receiptItemRows.length) {
      await tx.receiptItem.createMany({ data: receiptItemRows });
    }

    return {
      receiptId: savedReceipt.id,
      storeId: savedReceipt.storeId,
      insertedItems: receiptItemRows.length,
    };
  });
  return NextResponse.json({
    status: "success",
    message: "Receipt processed",
    ...result,
  });
}
export const maxDuration = 60;

const isDev = process.env.NODE_ENV !== "production";

export const POST = isDev ? handler : verifySignatureAppRouter(handler);
