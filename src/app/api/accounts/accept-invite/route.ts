import { NextResponse, NextRequest, after } from "next/server";
import { headers } from "next/headers";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  getAccountInviteByCode,
  markAccountInviteAsUsed,
  inviteCacheKey,
  INVITE_CODE_PATTERN,
} from "@/data/accountInvites";
import {
  userHasAccessToAccount,
  createUserAccountAccess,
} from "@/data/userAccounts";
import { client } from "@/lib/redis";
import { notifyAccountUpdated } from "@/lib/accountEvents";
import { consumeAttempt } from "@/lib/rateLimit";
import { getClientIpAndPrefix } from "@/lib/utils";

// An invite code is 6 digits - only a million values - so redemption has to be
// rate limited or it can simply be guessed. Both budgets are far above what a
// real user needs (a code is typed once or twice) and far below what spraying
// random codes would require.
const RATE_WINDOW_SEC = 15 * 60;
const MAX_ATTEMPTS_PER_USER = 10;
const MAX_ATTEMPTS_PER_IP = 30;

function tooManyAttempts(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // A malformed body is the caller's mistake, not a server fault.
    const body = await req.json().catch(() => null);
    const code = body?.code;

    if (typeof code !== "string" || !INVITE_CODE_PATTERN.test(code)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Spend the attempt budget before touching the database, so a guessing
    // run is cut off regardless of whether the code happens to exist.
    const byUser = await consumeAttempt(
      `invite:attempts:user:${user.id}`,
      MAX_ATTEMPTS_PER_USER,
      RATE_WINDOW_SEC,
    );

    if (!byUser.allowed) {
      return tooManyAttempts(byUser.retryAfterSec);
    }

    const { clientIp } = getClientIpAndPrefix(await headers());
    const byIp = await consumeAttempt(
      `invite:attempts:ip:${clientIp}`,
      MAX_ATTEMPTS_PER_IP,
      RATE_WINDOW_SEC,
    );

    if (!byIp.allowed) {
      return tooManyAttempts(byIp.retryAfterSec);
    }

    const invite = await getAccountInviteByCode(code);

    if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
      // Deliberately identical for "no such code" and "expired" - telling the
      // two apart would confirm which codes exist.
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    // Check if user already has access
    const existingAccess = await userHasAccessToAccount(
      user.id,
      invite.accountId
    );

    if (existingAccess) {
      return NextResponse.json(
        { error: "Already have access" },
        { status: 400 }
      );
    }

    // Claim the invite BEFORE granting access. The update is conditional on
    // usedAt still being null, so of two requests racing on the same code
    // exactly one gets count 1 - the check above is not enough on its own,
    // since both could read the invite as unused before either writes.
    const claimed = await markAccountInviteAsUsed(invite.code);

    if (claimed.count === 0) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    await createUserAccountAccess(user.id, invite.accountId, "collaborator");

    // Clear cached invite
    await client.del(inviteCacheKey(invite.accountId));

    // Everyone on it gets the account with the new member in it — the joiner
    // too, whose other devices add it from this.
    const actorId = user.id;
    after(() => notifyAccountUpdated(invite.accountId, actorId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
