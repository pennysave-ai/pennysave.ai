import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import {
  APIConnectionError,
  APIError,
  APIUserAbortError,
  type ChoiceResponse,
  type NoulResponse,
} from "@typesafe-ai/sdk";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { convertAmountToMilliunits, isValidIanaTimeZone } from "@/lib/utils";

const client = new TypeSafeClient();

/**
 * Below this, the text is not a receipt.
 *
 * The gate is deliberately high. A false positive hands the user a draft built
 * from a photo of their cat; a false negative hands them the empty form they
 * would have got anyway, so the two mistakes do not cost the same.
 */
export const RECEIPT_CONFIDENCE = 0.9;

/** The six fields a read can resolve. Each may be sent at most once. */
export type ReceiptField =
  | "amount"
  | "createdAt"
  | "payee"
  | "notes"
  | "categoryId"
  | "suggestedCategory";

/**
 * One line of the NDJSON response. A client that meets an unknown `type`
 * ignores that line, so new types may be added without a client release.
 */
export type ReceiptStreamEvent =
  | { type: "field"; field: ReceiptField; value: number | string }
  | { type: "done"; success: boolean; reason?: string }
  | { type: "error"; code: string; retryable: boolean };

/** A category as the client sends it, so `categoryId` can only ever be one of these. */
export type ReceiptCategory = {
  id: string;
  name: string;
};

export type ReadReceiptInput = {
  /** What the device read off the photo, in reading order. */
  recognizedText: string;
  /** The user's own categories. The read may not return an id outside this set. */
  categories: ReceiptCategory[];
  /**
   * The user's stored IANA timezone. A receipt prints wall-clock time with no
   * offset, so this is what turns "18:49:55" into an instant. Invalid or
   * missing falls back to UTC.
   */
  timeZone?: string | null;
  /**
   * The user's preferred language code, e.g. "ES". A suggested category is a
   * display name that lands in their category list, so it is written in the
   * language they read.
   */
  language?: string | null;
  /** Cancels both upstream calls when the client hangs up. */
  signal?: AbortSignal;
};

const RECEIPT_QUESTION = "Is this a receipt or invoice-related text?";

const RECEIPT_CRITERIA = {
  true: "The text has receipt or invoice info",
  false: "The text has nothing to do with a receipt or invoice",
};

const CATEGORY_QUESTION =
  "Select the most appropriate category for this receipt, or none when no category in the list fits it.";

/**
 * The label the model picks when nothing in the user's list fits.
 *
 * Without an escape the question is forced, and a hardware-store receipt lands
 * in whichever category fits least badly — a wrong value the user has to notice
 * and undo. This label is not a category id and never enters `categoriesById`,
 * so choosing it resolves to no event at all: the stream says "not found" the
 * only way it can, by staying silent.
 */
const NO_CATEGORY = "none";

/**
 * What the extraction model is asked for. `strict` requires every property to
 * be listed in `required`, so absence is carried by `null` rather than by a
 * missing key — the generator below turns those nulls back into silence.
 */
const receiptSchema = {
  type: "object",
  properties: {
    total: {
      type: ["number", "null"],
      description:
        "The final amount actually paid, as a positive number. Never a subtotal, tax, discount, tip, change or card authorization amount. Null when no reliable final total exists.",
    },
    direction: {
      type: "string",
      enum: ["outgoing", "incoming"],
      description:
        "outgoing for a purchase, incoming for a refund or money received.",
    },
    payee: {
      type: ["string", "null"],
      description:
        "The merchant exactly as printed on the receipt, and nothing else. Null when not legible.",
    },
    notes: {
      type: ["string", "null"],
      description:
        "A short human label for the transaction if the receipt suggests one beyond the merchant name. Null otherwise.",
    },
    datetime: {
      type: ["string", "null"],
      description:
        "The purchase date and time printed on the receipt, as YYYY-MM-DD HH:MM:SS, with no timezone or offset. Null when absent.",
    },
    suggestedCategory: {
      type: ["string", "null"],
      description:
        "A short category name to offer creating, when nothing in the user's own list fits this receipt. Null when their list already covers it, or when the receipt gives nothing to go on.",
    },
    confidence: {
      type: "number",
      description: "Confidence from 0 to 1 that the total is correct.",
    },
  },
  required: [
    "total",
    "direction",
    "payee",
    "notes",
    "datetime",
    "suggestedCategory",
    "confidence",
  ],
  additionalProperties: false,
} as const;

type ExtractedReceipt = {
  total: number | null;
  direction: "outgoing" | "incoming";
  payee: string | null;
  notes: string | null;
  datetime: string | null;
  suggestedCategory: string | null;
  confidence: number;
};

const EXTRACTION_MODEL = "gpt-4o-mini";

/**
 * OCR text arrives unordered and full of stray numbers, so the date rules carry
 * their weight: a receipt reading `21.09.26` is 21 September 2026, and reading
 * the day as a year yields a date five years off that looks perfectly plausible.
 * @param {String} today - The current date where the user is, as YYYY-MM-DD
 * @param {String} language - The language a suggested category is written in
 * @param {Boolean} needsSuggestion - Whether the user's own categories already cover this receipt
 * @returns {String} - The system prompt
 */
const buildExtractionPrompt = (
  today: string,
  language: string,
  needsSuggestion: boolean,
) =>
  `
You extract structured fields from receipt OCR text.

Amount rules:
- Return the final amount actually paid, as a positive number.
- Do not return a subtotal, tax amount, discount, tip, change, or card authorization amount.
- Support decimal commas and decimal points.
- Set direction to incoming only for a refund or money received, otherwise outgoing.
- Never calculate a total unless the receipt clearly supports it.

Date rules:
- Receipts print the day first. Read 21.09.26 and 21/09/2026 as 21 September 2026.
- A two digit year is 20YY. 26 means 2026, never 1926 and never 2021.
- The date and the time are often printed far apart in the text. Combine them.
- Today is ${today}. A receipt is never dated in the future, and is usually recent.
- Return the purchase date and time exactly as printed, as YYYY-MM-DD HH:MM:SS, with no timezone or offset applied.

Category rules:
${
  needsSuggestion
    ? `- Nothing in the user's own category list fits this receipt. Suggest a name they could create for it, written in ${language}.
- It is a display name that will appear in their category list: capitalised, no emoji, worded as a category rather than a sentence.
- Prefer a name that would still suit a second, unrelated receipt. "Pharmacy", not "Boots Nottingham".
- Return null rather than guessing. A category the user has to undo is worse than none, because it stays in their list.`
    : `- The user's own category list already covers this receipt. Return null for suggestedCategory.`
}

Other rules:
- Use the merchant name exactly as printed for payee.
- If no reliable value exists for a field, return null for it.
- Confidence must be between 0 and 1.
`.trim();

/** A suggestion longer than this is a sentence, not a category name. */
const MAX_SUGGESTED_CATEGORY = 40;

/**
 * Turn a stored language code into a name the model reads, e.g. "ES" -> Spanish.
 * @param {String} code - The user's preferred language code
 * @returns {String} - The language's English name, or the code when unknown
 */
function languageName(code: string): string {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "language" }).of(
        code.toLowerCase(),
      ) ?? code
    );
  } catch {
    return code;
  }
}

/** A printed date and time carrying no offset — the shape the model is asked for. */
const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/;

/** A receipt dated further ahead than this is a misread, not a purchase. */
const FUTURE_TOLERANCE_MS = 24 * 60 * 60 * 1000;

/**
 * Turn what the receipt printed into the instant it happened.
 * @param {String} datetime - What the model read off the receipt
 * @param {String} timeZone - The timezone that wall-clock time was printed in
 * @returns {Date | null} - The instant, or null when it is unusable
 */
function toInstant(datetime: string, timeZone: string): Date | null {
  const trimmed = datetime.trim();
  // A printed time is wall clock where the user is. `new Date` would instead
  // read it in whatever timezone the server happens to run in — correct on a
  // laptop in Madrid, two hours out on a UTC host. Only a string that already
  // carries an offset is left alone, since re-interpreting one double-shifts it.
  const parsed = NAIVE_DATETIME.test(trimmed)
    ? fromZonedTime(trimmed, timeZone)
    : new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  // A purchase that has not happened yet is a misread year or a mangled format,
  // and silence beats a confident wrong date the user has to notice and fix.
  if (parsed.getTime() > Date.now() + FUTURE_TOLERANCE_MS) return null;
  return parsed;
}

/**
 * Ask the extraction model for the four fields the on-device pass cannot infer.
 * @param {String} recognizedText - What the device read off the photo
 * @param {String} timeZone - Where the user is, so "today" anchors the year
 * @param {String} language - The language a suggested category is written in
 * @param {Boolean} needsSuggestion - Whether to ask for a category to offer creating
 * @param {AbortSignal} signal - Cancels the request when the client hangs up
 * @returns {Promise<ExtractedReceipt>} - Fields, with absence carried as null
 * @throws {Error} - If the model call fails or returns nothing parseable
 */
async function extractReceiptFields(
  recognizedText: string,
  timeZone: string,
  language: string,
  needsSuggestion: boolean,
  signal?: AbortSignal,
): Promise<ExtractedReceipt> {
  const started = performance.now();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      messages: [
        {
          role: "system",
          content: buildExtractionPrompt(
            formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd"),
            language,
            needsSuggestion,
          ),
        },
        { role: "user", content: recognizedText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "receipt_fields",
          strict: true,
          schema: receiptSchema,
        },
      },
      max_tokens: 1024,
      temperature: 0,
    }),
  });
  console.log(
    `[OCR] ${EXTRACTION_MODEL} duration: ${(performance.now() - started).toFixed(0)}ms`,
  );

  if (!response.ok) {
    throw new Error(`Extraction model returned ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    console.error("No content in extraction response:", data);
    throw new Error("No content in extraction response");
  }
  return JSON.parse(content);
}

/** Trimmed text, or null when there was nothing but whitespace. */
function cleaned(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * The read, as the sequence of events it resolves.
 *
 * Yields `field` events as values land and exactly one `done`. It never yields
 * `error`: a read that breaks throws, which leaves the fields already yielded
 * standing and lets the caller close the stream — scenario N3.
 * @param {ReadReceiptInput} input - The device's text and the user's categories
 * @returns {AsyncGenerator<ReceiptStreamEvent>} - Events in resolution order
 */
export async function* readReceipt({
  recognizedText,
  categories,
  timeZone: storedTimeZone,
  language,
  signal,
}: ReadReceiptInput): AsyncGenerator<ReceiptStreamEvent> {
  const timeZone =
    storedTimeZone && isValidIanaTimeZone(storedTimeZone)
      ? storedTimeZone
      : "UTC";
  // The model picks between labels, and the label is the category id: two
  // categories may share a name, but never an id, so a name as the label would
  // silently drop one of a colliding pair. The name rides along as the
  // description, which is what the model actually reasons over.
  const categoriesById = new Map<string, ReceiptCategory>();
  for (const category of categories) {
    const name = category?.name?.trim();
    if (category?.id && name) categoriesById.set(category.id, category);
  }
  // The sentinel goes in first so that a real category whose id somehow spells
  // it still wins: shadowing one of the user's own categories would be worse
  // than losing the escape hatch.
  const criteria: Record<string, string> = {
    [NO_CATEGORY]: "No category in this list fits this receipt.",
  };
  for (const [id, category] of categoriesById) {
    criteria[id] = category.name.trim();
  }

  const state = { ocrText: recognizedText };
  // Asking for a choice between no alternatives is not a question.
  const result = await (categoriesById.size > 0
    ? client.systemOne(
        {
          state,
          questions: {
            is_receipt: noul(RECEIPT_QUESTION, RECEIPT_CRITERIA),
            category: choice(CATEGORY_QUESTION, criteria),
          },
        },
        { signal },
      )
    : client.systemOne(
        {
          state,
          questions: { is_receipt: noul(RECEIPT_QUESTION, RECEIPT_CRITERIA) },
        },
        { signal },
      ));
  // The two calls ask different question sets, so their inferred answer types
  // are a union the compiler cannot narrow by key. The shape is the same either
  // way: the gate always, the category only when there was something to choose.
  const answers = result.answers as {
    is_receipt: NoulResponse;
    category?: ChoiceResponse;
  };

  if (answers.is_receipt.noul < RECEIPT_CONFIDENCE) {
    // Not a failure — the read ran and its answer is "this is not a receipt".
    yield { type: "done", success: false, reason: "not_a_receipt" };
    return;
  }

  // The category is already in hand a round trip before the amount is, which is
  // the whole point of streaming: it goes out now rather than waiting for it.
  // Looked up rather than trusted: `none`, and any label the request did not
  // carry, resolves to nothing — an id the user does not own would select
  // nothing in the picker anyway.
  const matchedCategory = Boolean(
    answers.category && categoriesById.has(answers.category.choice),
  );
  if (matchedCategory && answers.category) {
    yield {
      type: "field",
      field: "categoryId",
      value: answers.category.choice,
    };
  }

  const receipt = await extractReceiptFields(
    recognizedText,
    timeZone,
    languageName(language?.trim() || "EN"),
    // Only worth asking for when the user's own categories came up empty.
    !matchedCategory,
    signal,
  );

  // A total of zero is not a reading, and `value` is never a zero standing in
  // for absence — silence is how the stream says a field was not found.
  if (typeof receipt.total === "number" && Number.isFinite(receipt.total)) {
    const milliunits = convertAmountToMilliunits(Math.abs(receipt.total));
    if (milliunits !== 0) {
      yield {
        type: "field",
        field: "amount",
        // The client switches the draft to income off the sign alone.
        value: receipt.direction === "incoming" ? milliunits : -milliunits,
      };
    }
  }

  if (receipt.datetime) {
    const instant = toInstant(receipt.datetime, timeZone);
    if (instant) {
      // The client parses with `withFractionalSeconds` and silently drops
      // anything else, so send the milliseconds.
      yield { type: "field", field: "createdAt", value: instant.toISOString() };
    }
  }

  const payee = cleaned(receipt.payee);
  if (payee) {
    yield { type: "field", field: "payee", value: payee };
  }

  // The client derives a note from `payee` on its own, so a `notes` that only
  // repeats the merchant is noise — and, arriving second, would be dropped.
  const notes = cleaned(receipt.notes);
  if (notes && notes.toLowerCase() !== payee?.toLowerCase()) {
    yield { type: "field", field: "notes", value: notes };
  }

  // Mutually exclusive with `categoryId`: a suggestion is the answer to "none
  // of these fit", so one that arrives alongside a match is not an offer at all.
  const suggested = cleaned(receipt.suggestedCategory);
  if (
    !matchedCategory &&
    suggested &&
    suggested.length <= MAX_SUGGESTED_CATEGORY &&
    // Offering to create a category the user already has would give them two of
    // it. That the model reached for a name they own means the match was missed
    // rather than absent, and staying quiet lets them pick the one that exists.
    ![...categoriesById.values()].some(
      (category) =>
        category.name.trim().toLowerCase() === suggested.toLowerCase(),
    )
  ) {
    yield { type: "field", field: "suggestedCategory", value: suggested };
  }

  yield { type: "done", success: true };
}

/**
 * Turn a thrown read into its terminal `error` event.
 * @param {unknown} error - What the read threw
 * @returns {{code: string, retryable: boolean}} - Machine-readable cause
 */
export function classifyReadError(error: unknown): {
  code: string;
  retryable: boolean;
} {
  if (error instanceof APIUserAbortError) {
    return { code: "read_failed", retryable: true };
  }
  if (error instanceof APIConnectionError) {
    return { code: "upstream_unavailable", retryable: true };
  }
  if (error instanceof APIError) {
    // 4xx other than rate limiting is our request being wrong; resending the
    // same image would only get the same answer.
    const retryable = error.status === 429 || error.status >= 500;
    return {
      code: retryable ? "upstream_unavailable" : "read_failed",
      retryable,
    };
  }
  if (error instanceof Error && error.name === "AbortError") {
    return { code: "read_failed", retryable: true };
  }
  return { code: "read_failed", retryable: true };
}
