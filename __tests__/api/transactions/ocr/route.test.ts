/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/transactions/ocr/route";
import { getAuthenticatedUser } from "@/auth.helper";
import { readReceipt, type ReceiptStreamEvent } from "@/lib/receiptRead";
import { getUserLocale } from "@/data/user";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
}));

jest.mock("@/auth.helper", () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock("@/data/user", () => ({
  getUserLocale: jest.fn(),
}));

jest.mock("@/lib/receiptRead", () => ({
  readReceipt: jest.fn(),
  classifyReadError: jest.fn(() => ({
    code: "upstream_unavailable",
    retryable: true,
  })),
}));

const CATEGORY_ID = "4f2c8a11-9d3e-4b07-8c55-2e1a6f90b4d2";

const FIELDS: ReceiptStreamEvent[] = [
  { type: "field", field: "categoryId", value: CATEGORY_ID },
  { type: "field", field: "amount", value: -41860 },
  { type: "field", field: "payee", value: "Whole Foods" },
];

/** Turn a fixed list of events into the generator the route consumes. */
const yielding = (events: ReceiptStreamEvent[], throwAfter?: Error) =>
  jest.fn(async function* () {
    for (const event of events) yield event;
    if (throwAfter) throw throwAfter;
  });

const mockReq = (body: unknown): NextRequest =>
  ({
    json: async () => {
      if (body instanceof Error) throw body;
      return body;
    },
    headers: new Headers(),
    signal: undefined,
  }) as unknown as NextRequest;

const VALID_BODY = {
  recognizedText: "WHOLE FOODS\nTOTAL 41.86",
  categories: [{ id: CATEGORY_ID, name: "Food" }],
};

/** Parse an NDJSON response body back into the events it carried. */
const linesOf = async (response: Response) => {
  const text = await response.text();
  expect(text.endsWith("\n")).toBe(true);
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
};

describe("POST /api/transactions/ocr", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "user-id" });
    (getUserLocale as jest.Mock).mockResolvedValue({
      timezone: "Europe/Madrid",
      preferredLanguage: "ES",
    });
    (readReceipt as jest.Mock).mockImplementation(
      yielding([...FIELDS, { type: "done", success: true }]),
    );
  });

  describe("refusals happen before any event", () => {
    it("returns 401 when unauthenticated", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

      expect((await POST(mockReq(VALID_BODY))).status).toBe(401);
    });

    it("returns 400 when the body is not JSON", async () => {
      const response = await POST(mockReq(new Error("bad json")));

      expect(response.status).toBe(400);
    });

    it.each([
      ["missing", {}],
      ["blank", { recognizedText: "   " }],
      ["not a string", { recognizedText: 42 }],
    ])("returns 400 when recognizedText is %s", async (_label, body) => {
      const response = await POST(mockReq(body));

      expect(response.status).toBe(400);
      expect(readReceipt).not.toHaveBeenCalled();
    });
  });

  describe("transport", () => {
    it("streams NDJSON, unbuffered, whatever the client asked for", async () => {
      const response = await POST(mockReq(VALID_BODY));

      expect(response.headers.get("Content-Type")).toBe("application/x-ndjson");
      expect(response.headers.get("Cache-Control")).toContain("no-transform");
      expect(response.headers.get("X-Accel-Buffering")).toBe("no");
    });

    it("sends the response head before any event", async () => {
      const response = await POST(mockReq(VALID_BODY));

      expect(response.status).toBe(200);
    });

    it("carries a refusal as a single line", async () => {
      (readReceipt as jest.Mock).mockImplementation(
        yielding([{ type: "done", success: false, reason: "not_a_receipt" }]),
      );

      expect(await linesOf(await POST(mockReq(VALID_BODY)))).toEqual([
        { type: "done", success: false, reason: "not_a_receipt" },
      ]);
    });
  });

  describe("framing", () => {
    it("writes one JSON object per line, terminated and unpadded", async () => {
      expect(await linesOf(await POST(mockReq(VALID_BODY)))).toEqual([
        ...FIELDS,
        { type: "done", success: true },
      ]);
    });

    it("never splits an object across two lines", async () => {
      const text = await (await POST(mockReq(VALID_BODY))).text();

      for (const line of text.split("\n").filter(Boolean)) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });
  });

  describe("exactly one terminal event", () => {
    it("closes with error, keeping the fields that already landed", async () => {
      (readReceipt as jest.Mock).mockImplementation(
        yielding(FIELDS, new Error("upstream died")),
      );

      expect(await linesOf(await POST(mockReq(VALID_BODY)))).toEqual([
        ...FIELDS,
        { type: "error", code: "upstream_unavailable", retryable: true },
      ]);
    });

    it("does not append an error after a done it already sent", async () => {
      (readReceipt as jest.Mock).mockImplementation(
        yielding(
          [...FIELDS, { type: "done", success: true }],
          new Error("late failure"),
        ),
      );
      const lines = await linesOf(await POST(mockReq(VALID_BODY)));

      expect(lines.filter((l) => l.type !== "field")).toEqual([
        { type: "done", success: true },
      ]);
    });

    it("terminates a stream that ended without saying so", async () => {
      (readReceipt as jest.Mock).mockImplementation(yielding(FIELDS));

      expect((await linesOf(await POST(mockReq(VALID_BODY)))).at(-1)).toEqual({
        type: "error",
        code: "internal",
        retryable: true,
      });
    });
  });

  it("passes the user's categories through and defaults them to none", async () => {
    await POST(mockReq({ recognizedText: "TOTAL 41.86" }));

    expect(readReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ categories: [] }),
    );
  });

  it("reads the user's timezone and language, in one lookup", async () => {
    await POST(mockReq(VALID_BODY));

    expect(getUserLocale).toHaveBeenCalledWith("user-id");
    expect(getUserLocale).toHaveBeenCalledTimes(1);
    expect(readReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ timeZone: "Europe/Madrid", language: "ES" }),
    );
  });
});
