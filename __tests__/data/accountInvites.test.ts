/**
 * @jest-environment node
 */
import { Prisma } from "@prisma/client";
import {
  createAccountInvite,
  getAccountInviteByCode,
  INVITE_TTL_MS,
} from "@/data/accountInvites";
import { db } from "@/db";

jest.mock("@/db", () => ({
  db: {
    accountInvite: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });

const params = { accountId: "acct-1", createdById: "user-1" };

describe("createAccountInvite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.accountInvite.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
  });

  it("mints a zero-padded 6-digit code with a 15 minute expiry", async () => {
    (db.accountInvite.create as jest.Mock).mockImplementation(({ data }) => data);

    const before = Date.now();
    const invite: any = await createAccountInvite(params);
    const after = Date.now();

    expect(invite.code).toMatch(/^\d{6}$/);
    expect(INVITE_TTL_MS).toBe(15 * 60 * 1000);
    expect(invite.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + INVITE_TTL_MS,
    );
    expect(invite.expiresAt.getTime()).toBeLessThanOrEqual(
      after + INVITE_TTL_MS,
    );
  });

  it("retries with a fresh code when a live invite holds that one", async () => {
    (db.accountInvite.create as jest.Mock)
      .mockRejectedValueOnce(uniqueViolation())
      .mockRejectedValueOnce(uniqueViolation())
      .mockImplementation(({ data }) => data);

    const invite: any = await createAccountInvite(params);

    expect(db.accountInvite.create).toHaveBeenCalledTimes(3);
    expect(invite.code).toMatch(/^\d{6}$/);
  });

  it("clears spent invites squatting on the candidate code", async () => {
    (db.accountInvite.create as jest.Mock).mockImplementation(({ data }) => data);

    await createAccountInvite(params);

    const { where } = (db.accountInvite.deleteMany as jest.Mock).mock.calls[0][0];
    expect(where.code).toMatch(/^\d{6}$/);
    expect(where.OR).toEqual([
      { expiresAt: { lt: expect.any(Date) } },
      { usedAt: { not: null } },
    ]);
  });

  it("gives up rather than looping forever when every code collides", async () => {
    (db.accountInvite.create as jest.Mock).mockRejectedValue(uniqueViolation());

    await expect(createAccountInvite(params)).rejects.toThrow(
      "Could not allocate an unused invite code",
    );
    expect(db.accountInvite.create).toHaveBeenCalledTimes(5);
  });

  it("does not swallow unrelated database errors", async () => {
    (db.accountInvite.create as jest.Mock).mockRejectedValue(
      new Error("connection lost"),
    );

    await expect(createAccountInvite(params)).rejects.toThrow("connection lost");
    expect(db.accountInvite.create).toHaveBeenCalledTimes(1);
  });
});

describe("getAccountInviteByCode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("looks up a well-formed code", async () => {
    (db.accountInvite.findUnique as jest.Mock).mockResolvedValue({ id: "i1" });

    await expect(getAccountInviteByCode("004321")).resolves.toEqual({
      id: "i1",
    });
    expect(db.accountInvite.findUnique).toHaveBeenCalledWith({
      where: { code: "004321" },
    });
  });

  it.each([
    ["a legacy 64-char hex token", "a".repeat(64)],
    ["too few digits", "12345"],
    ["too many digits", "1234567"],
    ["non-digits", "12a456"],
    ["empty", ""],
  ])("refuses %s without querying", async (_label, input) => {
    await expect(getAccountInviteByCode(input)).resolves.toBeNull();
    expect(db.accountInvite.findUnique).not.toHaveBeenCalled();
  });
});
