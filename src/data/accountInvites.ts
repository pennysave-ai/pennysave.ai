import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/db";

/**
 * How long an invite code is valid. Short on purpose: a 6-digit code is only
 * 10^6 values, so the defence against guessing is that very few are live at
 * any moment. The Redis cache in the generate-invite route reuses this, so the
 * cached code can never outlive the row it points at.
 */
export const INVITE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** An invite code is exactly six digits. */
export const INVITE_CODE_PATTERN = /^\d{6}$/;

/**
 * Redis key holding the live invite for an account. Shared by the route that
 * writes it and the one that clears it on redemption, so the two cannot drift
 * apart and strand a spent code in the cache.
 *
 * Versioned: entries written before the token -> code rename carry a `token`
 * field nothing reads now, and are orphaned by this name.
 */
export const inviteCacheKey = (accountId: string) => `invite:code:${accountId}`;

/** How many times to retry when a generated code is already taken. */
const MAX_CODE_ATTEMPTS = 5;

/** A 6-digit code, zero-padded. randomInt is uniform and CSPRNG-backed. */
function generateInviteCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Creates an invite for an account and returns it, code included.
 *
 * The code space is small and `token` is globally unique, so spent invites
 * would otherwise squat on codes forever. Each attempt first clears any
 * expired or already-used row holding the candidate code, and only retries if
 * the collision is with an invite that is still live.
 *
 * @param {Object} params
 * @param {string} params.accountId - The ID of the account to invite to
 * @param {string} params.createdById - The ID of the user creating the invite
 * @returns Created account invite, with its 6-digit `code`
 */
export async function createAccountInvite({
  accountId,
  createdById,
}: {
  accountId: string;
  createdById: string;
}) {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateInviteCode();

    // Reclaim the code if whoever holds it is done with it.
    await db.accountInvite.deleteMany({
      where: {
        code,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });

    try {
      return await db.accountInvite.create({
        data: {
          code,
          accountId,
          createdById,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
      });
    } catch (error) {
      // A live invite already holds this code - try a different one.
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw new Error("Could not allocate an unused invite code");
}

/**
 * Looks up an invite by its 6-digit code.
 *
 * Anything that is not six digits is refused without a query: the long hex
 * tokens the old invite links carried are no longer accepted, and rejecting
 * them here means no caller can reach one by accident.
 *
 * @param {string} code - The 6-digit invite code
 * @returns Account invite, or null if the code is malformed or unknown
 */
export async function getAccountInviteByCode(code: string) {
  if (!INVITE_CODE_PATTERN.test(code)) return null;

  return db.accountInvite.findUnique({
    where: { code },
  });
}

/**
 * Reads what an invite code points at — the account, who sent it, and how many
 * people are already on it — **without spending it**. This is what the join
 * sheet shows you before you agree to join.
 *
 * Returns the invite's own `expiresAt` and `usedAt` rather than filtering on
 * them, because the caller has to answer "unknown", "expired" and "already
 * used" with one indistinguishable response: telling them apart would confirm
 * which codes exist, and this route is a pure read, so unlike redemption it
 * can be retried endlessly for free. The rate limit in the route is the other
 * half of that defence.
 *
 * @param {string} code - The 6-digit invite code
 * @returns Invite with its account, inviter and member count, or null
 */
export async function getAccountInvitePreviewByCode(code: string) {
  if (!INVITE_CODE_PATTERN.test(code)) return null;

  return db.accountInvite.findUnique({
    where: { code },
    select: {
      code: true,
      accountId: true,
      expiresAt: true,
      usedAt: true,
      createdBy: { select: { name: true } },
      account: {
        select: {
          name: true,
          // `name` is the alpha code ("USD"); Currency.code holds the ISO
          // 4217 numeric ("840"), which is not what a client wants to show.
          currency: { select: { name: true } },
          // Everyone already on the account. The person holding the invite is
          // not among them yet, which is what makes "3 people" read correctly
          // as the room you are about to walk into.
          _count: { select: { userAccess: true } },
        },
      },
    },
  });
}

/**
 * Function to mark an account invite as used
 * @param {string} code - The 6-digit invite code
 * @returns Updated account invite
 */
export async function markAccountInviteAsUsed(code: string) {
  return db.accountInvite.updateMany({
    where: { code, usedAt: null },
    data: { usedAt: new Date() },
  });
}
