/**
 * @jest-environment node
 */
import {
  readReceipt,
  classifyReadError,
  RECEIPT_CONFIDENCE,
  type ReceiptStreamEvent,
} from "@/lib/receiptRead";

const mockSystemOne = jest.fn();

jest.mock("@typesafe-ai/sdk", () => ({
  TypeSafeClient: jest.fn().mockImplementation(() => ({
    // Delegated rather than passed directly: the client is constructed when the
    // module under test is imported, before `mockSystemOne` is initialised.
    systemOne: (...args: unknown[]) => mockSystemOne(...args),
  })),
  noul: (instructions: unknown, criteria: unknown) => ({
    type: "noul",
    instructions,
    criteria,
  }),
  choice: (instructions: unknown, criteria: unknown) => ({
    type: "choice",
    instructions,
    criteria,
  }),
  APIError: class APIError extends Error {
    constructor(public status: number) {
      super("api error");
    }
  },
  APIConnectionError: class APIConnectionError extends Error {},
  APIUserAbortError: class APIUserAbortError extends Error {},
}));

const FOOD = { id: "4f2c8a11-9d3e-4b07-8c55-2e1a6f90b4d2", name: "Food" };
const RENT = { id: "8a1b2c3d-4e5f-4071-9a8b-7c6d5e4f3a2b", name: "Rent" };
const CATEGORIES = [FOOD, RENT];

/** The answer shape `systemOne` returns for a text that is a receipt. */
const answering = (noulValue: number, choiceLabel = FOOD.id) => ({
  model: "jev-latest",
  usage: { input_tokens: 1, output_tokens: 1 },
  answers: {
    is_receipt: { type: "noul", noul: noulValue },
    category: {
      type: "choice",
      choice: choiceLabel,
      confidence: 0.9,
      probabilities: {},
    },
  },
});

/** A fetch resolving to what the extraction model would have said. */
const extracting = (receipt: Record<string, unknown>) =>
  jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(receipt) } }],
    }),
  });

const FULL_RECEIPT = {
  total: 41.86,
  direction: "outgoing",
  payee: "Whole Foods",
  notes: null,
  datetime: "2026-09-21 14:03:11",
  suggestedCategory: null,
  confidence: 0.95,
};

const collect = async (
  events: AsyncGenerator<ReceiptStreamEvent>,
): Promise<ReceiptStreamEvent[]> => {
  const out: ReceiptStreamEvent[] = [];
  for await (const event of events) out.push(event);
  return out;
};

const read = (
  recognizedText = "WHOLE FOODS\nTOTAL 41.86",
  timeZone: string | null = "Europe/Madrid",
  language: string | null = "EN",
) =>
  collect(
    readReceipt({
      recognizedText,
      categories: CATEGORIES,
      timeZone,
      language,
    }),
  );

/** The system prompt the extraction model was sent. */
const promptSent = () =>
  JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).messages[0]
    .content;

describe("readReceipt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSystemOne.mockResolvedValue(answering(0.97));
    global.fetch = extracting(FULL_RECEIPT) as unknown as typeof fetch;
  });

  describe("P1 — complete read", () => {
    it("emits every field it read and one successful terminal event", async () => {
      expect(await read()).toEqual([
        { type: "field", field: "categoryId", value: FOOD.id },
        { type: "field", field: "amount", value: -41860 },
        // 14:03:11 in Madrid, which is CEST in September.
        {
          type: "field",
          field: "createdAt",
          value: "2026-09-21T12:03:11.000Z",
        },
        { type: "field", field: "payee", value: "Whole Foods" },
        { type: "done", success: true },
      ]);
    });

    it("sends the category before waiting on the extraction round trip", async () => {
      const events = await read();
      const categoryAt = events.findIndex(
        (e) => "field" in e && e.field === "categoryId",
      );
      const amountAt = events.findIndex(
        (e) => "field" in e && e.field === "amount",
      );

      expect(categoryAt).toBeLessThan(amountAt);
    });

    it("emits createdAt with the fractional seconds the client insists on", async () => {
      const events = await read();
      const createdAt = events.find(
        (e) => "field" in e && e.field === "createdAt",
      );

      expect(createdAt).toMatchObject({
        value: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      });
    });

    it("reads the printed time in the user's timezone, not the server's", async () => {
      const madrid = await read("TOTAL 41.86", "Europe/Madrid");
      const newYork = await read("TOTAL 41.86", "America/New_York");
      const value = (events: ReceiptStreamEvent[]) =>
        events.find((e) => "field" in e && e.field === "createdAt");

      expect(value(madrid)).toMatchObject({
        value: "2026-09-21T12:03:11.000Z",
      });
      expect(value(newYork)).toMatchObject({
        value: "2026-09-21T18:03:11.000Z",
      });
    });

    it.each([["Mars/Olympus"], [null]])(
      "falls back to UTC when the stored timezone is %p",
      async (timeZone) => {
        expect(await read("TOTAL 41.86", timeZone)).toContainEqual({
          type: "field",
          field: "createdAt",
          value: "2026-09-21T14:03:11.000Z",
        });
      },
    );

    it("does not re-shift a datetime that already carries an offset", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        datetime: "2026-09-21T14:03:11Z",
      }) as unknown as typeof fetch;

      expect(await read()).toContainEqual({
        type: "field",
        field: "createdAt",
        value: "2026-09-21T14:03:11.000Z",
      });
    });

    it("drops a date in the future rather than showing a misread year", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        datetime: "2099-01-01 10:00:00",
      }) as unknown as typeof fetch;

      expect(await read()).not.toContainEqual(
        expect.objectContaining({ field: "createdAt" }),
      );
    });

    it("tells the model what today is, so a two digit year has an anchor", async () => {
      await read();
      const body = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );

      expect(body.messages[0].content).toContain(
        `Today is ${new Date().toISOString().slice(0, 10)}`,
      );
    });
  });

  describe("N1 — not a receipt", () => {
    it("reports a refusal as a successful read with a reason", async () => {
      mockSystemOne.mockResolvedValue(answering(0.4));

      expect(await read("a photo of a cat")).toEqual([
        { type: "done", success: false, reason: "not_a_receipt" },
      ]);
    });

    it("does not pay for extraction on something that is not a receipt", async () => {
      mockSystemOne.mockResolvedValue(answering(0.4));
      await read("a photo of a cat");

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it.each([
      [RECEIPT_CONFIDENCE, true],
      [RECEIPT_CONFIDENCE - 0.001, false],
    ])("treats %p as a receipt: %p", async (noulValue, isReceipt) => {
      mockSystemOne.mockResolvedValue(answering(noulValue));
      const events = await read();

      expect(events.at(-1)).toEqual(
        isReceipt
          ? { type: "done", success: true }
          : { type: "done", success: false, reason: "not_a_receipt" },
      );
    });
  });

  describe("P2 — a read with no total", () => {
    it("is a success that simply carries no amount", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        total: null,
      }) as unknown as typeof fetch;
      const events = await read();

      expect(events).not.toContainEqual(
        expect.objectContaining({ field: "amount" }),
      );
      expect(events).toContainEqual({
        type: "field",
        field: "payee",
        value: "Whole Foods",
      });
      expect(events.at(-1)).toEqual({ type: "done", success: true });
    });
  });

  describe("P3 — sparse read", () => {
    it("emits only what was legible", async () => {
      mockSystemOne.mockResolvedValue({
        ...answering(0.95),
        answers: { is_receipt: { type: "noul", noul: 0.95 } },
      });
      global.fetch = extracting({
        total: 12.99,
        direction: "outgoing",
        payee: null,
        notes: null,
        datetime: null,
        confidence: 0.6,
      }) as unknown as typeof fetch;

      expect(await read()).toEqual([
        { type: "field", field: "amount", value: -12990 },
        { type: "done", success: true },
      ]);
    });
  });

  describe("P4 — income", () => {
    it("keeps a refund positive", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        total: 2.5,
        direction: "incoming",
      }) as unknown as typeof fetch;

      expect(await read()).toContainEqual({
        type: "field",
        field: "amount",
        value: 2500,
      });
    });

    it("signs an expense negative whatever sign the model used", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        total: -41.86,
      }) as unknown as typeof fetch;

      expect(await read()).toContainEqual({
        type: "field",
        field: "amount",
        value: -41860,
      });
    });
  });

  describe("silence rather than empty values", () => {
    it.each([
      ["a zero total", { total: 0 }, "amount"],
      ["a blank payee", { payee: "   " }, "payee"],
      ["an unparseable date", { datetime: "not a date" }, "createdAt"],
    ])("omits the field entirely for %s", async (_label, override, field) => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        ...override,
      }) as unknown as typeof fetch;

      expect(await read()).not.toContainEqual(
        expect.objectContaining({ field }),
      );
    });

    it("drops a note that only repeats the merchant", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        notes: "whole foods",
      }) as unknown as typeof fetch;

      expect(await read()).not.toContainEqual(
        expect.objectContaining({ field: "notes" }),
      );
    });

    it("keeps a note that says something the payee does not", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        notes: "Weekly shop",
      }) as unknown as typeof fetch;

      expect(await read()).toContainEqual({
        type: "field",
        field: "notes",
        value: "Weekly shop",
      });
    });
  });

  describe("categories", () => {
    it("resolves the chosen label to the id the request carried", async () => {
      mockSystemOne.mockResolvedValue(answering(0.95, RENT.id));

      expect(await read()).toContainEqual({
        type: "field",
        field: "categoryId",
        value: RENT.id,
      });
    });

    it("sends nothing when the choice is not one of the user's categories", async () => {
      mockSystemOne.mockResolvedValue(
        answering(0.95, "11111111-2222-3333-4444-555555555555"),
      );

      expect(await read()).not.toContainEqual(
        expect.objectContaining({ field: "categoryId" }),
      );
    });

    it("does not ask for a choice between no alternatives", async () => {
      mockSystemOne.mockResolvedValue({
        model: "jev-latest",
        usage: { input_tokens: 1, output_tokens: 1 },
        answers: { is_receipt: { type: "noul", noul: 0.95 } },
      });
      await collect(
        readReceipt({ recognizedText: "TOTAL 41.86", categories: [] }),
      );

      expect(Object.keys(mockSystemOne.mock.calls[0][0].questions)).toEqual([
        "is_receipt",
      ]);
    });

    it("labels the choices by id and describes them by name", async () => {
      await read();

      expect(
        mockSystemOne.mock.calls[0][0].questions.category.criteria,
      ).toMatchObject({ [FOOD.id]: "Food", [RENT.id]: "Rent" });
    });

    it("offers a way out when nothing in the list fits", async () => {
      await read();

      expect(
        mockSystemOne.mock.calls[0][0].questions.category.criteria,
      ).toHaveProperty("none");
    });

    it("sends no category when the model takes that way out", async () => {
      mockSystemOne.mockResolvedValue(answering(0.95, "none"));
      const events = await read();

      expect(events).not.toContainEqual(
        expect.objectContaining({ field: "categoryId" }),
      );
      // The rest of the read is unaffected — only the category is unknown.
      expect(events).toContainEqual({
        type: "field",
        field: "amount",
        value: -41860,
      });
      expect(events.at(-1)).toEqual({ type: "done", success: true });
    });

    it("keeps both of two categories that share a name", async () => {
      const groceries = {
        id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        name: "food",
      };
      mockSystemOne.mockResolvedValue(answering(0.95, groceries.id));

      const events = await collect(
        readReceipt({
          recognizedText: "TOTAL 41.86",
          categories: [FOOD, groceries],
        }),
      );

      expect(
        Object.keys(mockSystemOne.mock.calls[0][0].questions.category.criteria),
      ).toEqual(expect.arrayContaining([FOOD.id, groceries.id]));
      expect(events).toContainEqual({
        type: "field",
        field: "categoryId",
        value: groceries.id,
      });
    });
  });

  describe("P5 — read with no matching category", () => {
    beforeEach(() => {
      mockSystemOne.mockResolvedValue(answering(0.95, "none"));
      global.fetch = extracting({
        ...FULL_RECEIPT,
        payee: "Boots",
        suggestedCategory: "Pharmacy",
      }) as unknown as typeof fetch;
    });

    it("offers a name to create when nothing in the list fits", async () => {
      const events = await read();

      expect(events).toContainEqual({
        type: "field",
        field: "suggestedCategory",
        value: "Pharmacy",
      });
      expect(events.at(-1)).toEqual({ type: "done", success: true });
    });

    it("never sends a suggestion beside a category that matched", async () => {
      mockSystemOne.mockResolvedValue(answering(0.95, FOOD.id));
      const events = await read();

      expect(events).toContainEqual({
        type: "field",
        field: "categoryId",
        value: FOOD.id,
      });
      expect(events).not.toContainEqual(
        expect.objectContaining({ field: "suggestedCategory" }),
      );
    });

    it("does not ask for one when the user's own categories matched", async () => {
      mockSystemOne.mockResolvedValue(answering(0.95, FOOD.id));
      await read();

      expect(promptSent()).toContain("already covers this receipt");
    });

    it("asks for the name in the user's language", async () => {
      await read("BOOTS", "Europe/Madrid", "ES");

      expect(promptSent()).toContain("written in Spanish");
    });

    it("falls back to English when no language is stored", async () => {
      await read("BOOTS", "Europe/Madrid", null);

      expect(promptSent()).toContain("written in English");
    });

    it("does not offer creating a category the user already has", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        suggestedCategory: "food",
      }) as unknown as typeof fetch;

      expect(await read()).not.toContainEqual(
        expect.objectContaining({ field: "suggestedCategory" }),
      );
    });

    it("drops a suggestion that is a sentence rather than a name", async () => {
      global.fetch = extracting({
        ...FULL_RECEIPT,
        suggestedCategory:
          "Items bought at a pharmacy including medicine and toiletries",
      }) as unknown as typeof fetch;

      expect(await read()).not.toContainEqual(
        expect.objectContaining({ field: "suggestedCategory" }),
      );
    });
  });

  describe("P6 — read with nothing to suggest", () => {
    it("sends neither field rather than inventing one", async () => {
      mockSystemOne.mockResolvedValue(answering(0.95, "none"));
      global.fetch = extracting({
        ...FULL_RECEIPT,
        payee: "SQ *8813772",
        suggestedCategory: null,
      }) as unknown as typeof fetch;
      const events = await read();

      expect(events).not.toContainEqual(
        expect.objectContaining({ field: "categoryId" }),
      );
      expect(events).not.toContainEqual(
        expect.objectContaining({ field: "suggestedCategory" }),
      );
      // Still a success — the read worked, the category is simply unknown.
      expect(events.at(-1)).toEqual({ type: "done", success: true });
    });
  });

  describe("N3 — failure after some fields landed", () => {
    it("keeps what it already yielded and then throws", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(
          new Error("upstream died"),
        ) as unknown as typeof fetch;

      const seen: ReceiptStreamEvent[] = [];
      await expect(async () => {
        for await (const event of readReceipt({
          recognizedText: "TOTAL 41.86",
          categories: CATEGORIES,
        })) {
          seen.push(event);
        }
      }).rejects.toThrow("upstream died");

      expect(seen).toEqual([
        { type: "field", field: "categoryId", value: FOOD.id },
      ]);
    });

    it("throws rather than inventing fields when the model returns nothing", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] }),
      }) as unknown as typeof fetch;

      await expect(read()).rejects.toThrow("No content in extraction response");
    });
  });
});

describe("classifyReadError", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sdk = require("@typesafe-ai/sdk");

  it("marks a rate limit retryable", () => {
    expect(classifyReadError(new sdk.APIError(429))).toEqual({
      code: "upstream_unavailable",
      retryable: true,
    });
  });

  it("marks a server error retryable", () => {
    expect(classifyReadError(new sdk.APIError(503))).toEqual({
      code: "upstream_unavailable",
      retryable: true,
    });
  });

  it("does not ask the client to resend a request we got wrong", () => {
    expect(classifyReadError(new sdk.APIError(400))).toEqual({
      code: "read_failed",
      retryable: false,
    });
  });

  it("marks a dropped connection retryable", () => {
    expect(classifyReadError(new sdk.APIConnectionError())).toEqual({
      code: "upstream_unavailable",
      retryable: true,
    });
  });
});
