/**
 * @jest-environment node
 */
import { GET } from "@/app/api/accounts/invite/[code]/route";
import { getAuthenticatedUser } from "@/auth.helper";
import { getAccountInvitePreviewByCode } from "@/data/accountInvites";
import { userHasAccessToAccount } from "@/data/userAccounts";
import { consumeAttempt } from "@/lib/rateLimit";
import { type NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      headers: init?.headers,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(async () => new Map()),
}));

jest.mock("@/auth.helper", () => ({ getAuthenticatedUser: jest.fn() }));
jest.mock("@/data/accountInvites", () => ({
  getAccountInvitePreviewByCode: jest.fn(),
  INVITE_CODE_PATTERN: /^\d{6}$/,
}));
jest.mock("@/data/userAccounts", () => ({ userHasAccessToAccount: jest.fn() }));
jest.mock("@/lib/rateLimit", () => ({ consumeAttempt: jest.fn() }));
jest.mock("@/lib/utils", () => ({
  getClientIpAndPrefix: () => ({ clientIp: "1.2.3.4", ipPrefix: "1.2.3" }),
}));

const req = {} as NextRequest;
const ctx = (code: unknown) =>
  ({ params: Promise.resolve({ code }) }) as unknown as {
    params: Promise<{ code: string }>;
  };

const livePreview = {
  code: "123456",
  accountId: "acct-1",
  expiresAt: new Date(Date.now() + 60_000),
  usedAt: null,
  createdBy: { name: "Anna K." },
  account: {
    name: "Family Budget",
    // Currency.name holds the alpha code; Currency.code is ISO 4217 numeric.
    currency: { name: "EUR" },
    _count: { userAccess: 3 },
  },
};

describe("GET /api/accounts/invite/:code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "user-1" });
    (consumeAttempt as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSec: 900,
    });
    (getAccountInvitePreviewByCode as jest.Mock).mockResolvedValue(livePreview);
    (userHasAccessToAccount as jest.Mock).mockResolvedValue(false);
  });

  it("describes the account behind a live code", async () => {
    const res = await GET(req, ctx("123456"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: {
        accountId: "acct-1",
        accountName: "Family Budget",
        currencyCode: "EUR",
        inviterName: "Anna K.",
        memberCount: 3,
        expiresAt: livePreview.expiresAt.toISOString(),
        alreadyMember: false,
      },
    });
  });

  it("flags a caller who is already on the account", async () => {
    (userHasAccessToAccount as jest.Mock).mockResolvedValue(true);

    const res = await GET(req, ctx("123456"));

    expect((await res.json()).data.alreadyMember).toBe(true);
  });

  it.each([
    ["a 64-char hex token", "a".repeat(64)],
    ["five digits", "12345"],
    ["non-digits", "12a456"],
    ["nothing", undefined],
  ])("rejects %s before spending an attempt", async (_label, code) => {
    const res = await GET(req, ctx(code));

    expect(res.status).toBe(400);
    expect(consumeAttempt).not.toHaveBeenCalled();
    expect(getAccountInvitePreviewByCode).not.toHaveBeenCalled();
  });

  it("stops a scanning run with 429 and Retry-After", async () => {
    (consumeAttempt as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSec: 420,
    });

    const res = await GET(req, ctx("123456"));

    expect(res.status).toBe(429);
    expect(res.headers).toEqual({ "Retry-After": "420" });
    // Budget goes before the lookup, so a refused guess costs no query.
    expect(getAccountInvitePreviewByCode).not.toHaveBeenCalled();
  });

  it("counts against its own budget, not redemption's", async () => {
    await GET(req, ctx("123456"));

    const keys = (consumeAttempt as jest.Mock).mock.calls.map(([key]) => key);
    expect(keys).toEqual([
      "invite:preview:user:user-1",
      "invite:preview:ip:1.2.3.4",
    ]);
  });

  it.each([
    ["unknown", null],
    ["expired", { ...livePreview, expiresAt: new Date(Date.now() - 60_000) }],
    ["already used", { ...livePreview, usedAt: new Date() }],
  ])("gives nothing away about a %s code", async (_label, stored) => {
    (getAccountInvitePreviewByCode as jest.Mock).mockResolvedValue(stored);

    const res = await GET(req, ctx("123456"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid or expired invite" });
  });

  it("refuses an unauthenticated caller", async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

    const res = await GET(req, ctx("123456"));

    expect(res.status).toBe(401);
    expect(consumeAttempt).not.toHaveBeenCalled();
  });

  it("never writes — reading an invite does not spend it", async () => {
    const invites = jest.requireMock("@/data/accountInvites");

    await GET(req, ctx("123456"));

    expect(invites.markAccountInviteAsUsed).toBeUndefined();
    expect(getAccountInvitePreviewByCode).toHaveBeenCalledWith("123456");
  });
});
