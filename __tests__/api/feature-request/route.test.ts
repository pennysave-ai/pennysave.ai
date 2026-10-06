/**
 * @jest-environment node
 */
import { POST } from "@/app/api/feature-request/route";
import { NextRequest } from "next/server";
import { sendFeatureRequestEmail } from "@/lib/mail";
import { consumeAttempt } from "@/lib/rateLimit";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
}));

jest.mock("@/lib/mail", () => ({
  sendFeatureRequestEmail: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  consumeAttempt: jest.fn(),
}));

const makeReq = (body: unknown) =>
  ({
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
  }) as unknown as NextRequest;

describe("POST /api/feature-request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (consumeAttempt as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSec: 3600,
    });
  });

  it("sends the request to the team", async () => {
    const response = await POST(
      makeReq({
        message: "  Please add recurring payments  ",
        email: "a@b.co",
        lang: "en",
        trap: "",
      }),
    );

    expect(response.status).toBe(200);
    expect(consumeAttempt).toHaveBeenCalledWith(
      "feature-request:ip:1.2.3.4",
      5,
      3600,
    );
    expect(sendFeatureRequestEmail).toHaveBeenCalledWith({
      message: "Please add recurring payments",
      email: "a@b.co",
      lang: "en",
    });
  });

  it("treats an empty email as anonymous", async () => {
    await POST(
      makeReq({ message: "Please add recurring payments", email: "" }),
    );

    expect(sendFeatureRequestEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: undefined }),
    );
  });

  it.each([
    ["too short", { message: "hi" }],
    ["invalid email", { message: "Please add dark mode", email: "nope" }],
  ])("returns 400 when %s", async (_, body) => {
    const response = await POST(makeReq(body));

    expect(response.status).toBe(400);
    expect(sendFeatureRequestEmail).not.toHaveBeenCalled();
  });

  it("pretends to succeed but sends nothing when the honeypot is filled", async () => {
    const response = await POST(
      makeReq({ message: "Please add dark mode", trap: "http://spam.example" }),
    );

    expect(response.status).toBe(200);
    expect(sendFeatureRequestEmail).not.toHaveBeenCalled();
  });

  it("sends when autofill copied the visitor's email into the honeypot", async () => {
    const response = await POST(
      makeReq({
        message: "test ghhhhhh gg",
        email: "a@b.co",
        lang: "en",
        trap: "a@b.co",
      }),
    );

    expect(response.status).toBe(200);
    expect(sendFeatureRequestEmail).toHaveBeenCalled();
  });

  it("returns 429 when the IP is over the limit", async () => {
    (consumeAttempt as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSec: 120,
    });

    const response = await POST(makeReq({ message: "Please add dark mode" }));

    expect(response.status).toBe(429);
    expect(sendFeatureRequestEmail).not.toHaveBeenCalled();
  });

  it("returns 500 when the email fails to send", async () => {
    (sendFeatureRequestEmail as jest.Mock).mockRejectedValue(new Error("down"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeReq({ message: "Please add dark mode" }));

    expect(response.status).toBe(500);
  });
});
