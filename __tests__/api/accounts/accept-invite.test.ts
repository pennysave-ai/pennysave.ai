/**
 * @jest-environment node
 */
import { POST } from "@/app/api/accounts/accept-invite/route";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  getAccountInviteByCode,
  markAccountInviteAsUsed,
} from "@/data/accountInvites";
import {
  userHasAccessToAccount,
  createUserAccountAccess,
} from "@/data/userAccounts";
import { consumeAttempt } from "@/lib/rateLimit";
import { client } from "@/lib/redis";
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
  after: jest.fn((task: () => unknown) => task()),
}));

// Reads the database; covered in __tests__/lib/accountEvents.test.ts.
jest.mock("@/lib/accountEvents", () => ({
  getAccountMembers: jest.fn().mockResolvedValue(["user-id", "partner"]),
  getOwnedAccountIds: jest.fn(async (ids: string[]) => ids),
  notifyAccountUpdated: jest.fn(),
  notifyAccountRemoved: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(async () => new Map()),
}));

jest.mock("@/auth.helper", () => ({ getAuthenticatedUser: jest.fn() }));
jest.mock("@/data/accountInvites", () => ({
  getAccountInviteByCode: jest.fn(),
  markAccountInviteAsUsed: jest.fn(),
  inviteCacheKey: (id: string) => `invite:code:${id}`,
  INVITE_CODE_PATTERN: /^\d{6}$/,
}));
jest.mock("@/data/userAccounts", () => ({
  userHasAccessToAccount: jest.fn(),
  createUserAccountAccess: jest.fn(),
}));
jest.mock("@/lib/rateLimit", () => ({ consumeAttempt: jest.fn() }));
jest.mock("@/lib/redis", () => ({ client: { del: jest.fn() } }));
jest.mock("@/lib/utils", () => ({
  getClientIpAndPrefix: () => ({ clientIp: "1.2.3.4", ipPrefix: "1.2.3" }),
}));

const reqWith = (body: unknown) =>
  ({ json: async () => body } as unknown as NextRequest);

const liveInvite = {
  code: "123456",
  accountId: "acct-1",
  expiresAt: new Date(Date.now() + 60_000),
  usedAt: null,
};

describe("POST /api/accounts/accept-invite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "user-1" });
    (consumeAttempt as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSec: 900,
    });
    (getAccountInviteByCode as jest.Mock).mockResolvedValue(liveInvite);
    (userHasAccessToAccount as jest.Mock).mockResolvedValue(false);
    (markAccountInviteAsUsed as jest.Mock).mockResolvedValue({ count: 1 });
  });

  it("redeems a valid code and grants collaborator access", async () => {
    const res = await POST(reqWith({ code: "123456" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(createUserAccountAccess).toHaveBeenCalledWith(
      "user-1",
      "acct-1",
      "collaborator",
    );
    expect(client.del).toHaveBeenCalledWith("invite:code:acct-1");
  });

  it("rejects a legacy token field - only `code` is accepted now", async () => {
    const res = await POST(reqWith({ token: "123456" }));

    expect(res.status).toBe(400);
    expect(getAccountInviteByCode).not.toHaveBeenCalled();
  });

  it.each([
    ["a 64-char hex token", "a".repeat(64)],
    ["five digits", "12345"],
    ["non-digits", "12a456"],
    ["a number rather than a string", 123456],
    ["nothing", undefined],
  ])("rejects %s before spending an attempt", async (_label, code) => {
    const res = await POST(reqWith({ code }));

    expect(res.status).toBe(400);
    expect(consumeAttempt).not.toHaveBeenCalled();
    expect(getAccountInviteByCode).not.toHaveBeenCalled();
  });

  it("returns 400 rather than 500 on a malformed body", async () => {
    const res = await POST({
      json: async () => {
        throw new SyntaxError("bad json");
      },
    } as unknown as NextRequest);

    expect(res.status).toBe(400);
  });

  it("stops a guessing run with 429 and Retry-After", async () => {
    (consumeAttempt as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSec: 420,
    });

    const res = await POST(reqWith({ code: "123456" }));

    expect(res.status).toBe(429);
    expect(res.headers).toEqual({ "Retry-After": "420" });
    // Budget is spent before any lookup, so guesses cost nothing to refuse.
    expect(getAccountInviteByCode).not.toHaveBeenCalled();
  });

  it("gives the same answer for an unknown and an expired code", async () => {
    (getAccountInviteByCode as jest.Mock).mockResolvedValue(null);
    const unknown = await POST(reqWith({ code: "123456" }));

    (getAccountInviteByCode as jest.Mock).mockResolvedValue({
      ...liveInvite,
      expiresAt: new Date(Date.now() - 60_000),
    });
    const expired = await POST(reqWith({ code: "123456" }));

    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toEqual(await expired.json());
  });

  it("does not grant access when another request claimed the code first", async () => {
    (markAccountInviteAsUsed as jest.Mock).mockResolvedValue({ count: 0 });

    const res = await POST(reqWith({ code: "123456" }));

    expect(res.status).toBe(400);
    expect(createUserAccountAccess).not.toHaveBeenCalled();
  });

  it("claims the invite before granting access", async () => {
    const order: string[] = [];
    (markAccountInviteAsUsed as jest.Mock).mockImplementation(async () => {
      order.push("claim");
      return { count: 1 };
    });
    (createUserAccountAccess as jest.Mock).mockImplementation(async () => {
      order.push("grant");
    });

    await POST(reqWith({ code: "123456" }));

    expect(order).toEqual(["claim", "grant"]);
  });

  it("refuses an unauthenticated caller", async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);

    const res = await POST(reqWith({ code: "123456" }));

    expect(res.status).toBe(401);
    expect(consumeAttempt).not.toHaveBeenCalled();
  });
});
