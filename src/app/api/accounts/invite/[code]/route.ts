import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  getAccountInvitePreviewByCode,
  INVITE_CODE_PATTERN,
} from "@/data/accountInvites";
import { userHasAccessToAccount } from "@/data/userAccounts";
import { consumeAttempt } from "@/lib/rateLimit";
import { getClientIpAndPrefix } from "@/lib/utils";

// This route is a READ oracle, so it needs the same guard redemption has, and
// arguably more: `accept-invite` spends the code it guesses, which makes a
// guessing run self-limiting, while this one can be retried forever for free
// and hands back an account name and a person's name each time it lands. Same
// window and same budgets, on their own counters — previewing an invite and
// redeeming it are different actions and should not eat each other's quota.
const RATE_WINDOW_SEC = 15 * 60;
const MAX_ATTEMPTS_PER_USER = 10;
const MAX_ATTEMPTS_PER_IP = 30;

function tooManyAttempts(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

/**
 * Describes an invite without consuming it.
 * `GET /api/accounts/invite/:code`
 *
 * The app's join sheet reads the clipboard as it opens and calls this to show
 * you which account you are being invited to, and by whom, before you agree to
 * anything. Redemption stays entirely with `POST /api/accounts/accept-invite`;
 * nothing here writes.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;

    // Shape is checked before any budget is spent, so a client sending one of
    // the old hex tokens is told it is malformed rather than being rate
    // limited into looking like an attacker.
    if (typeof code !== "string" || !INVITE_CODE_PATTERN.test(code)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const byUser = await consumeAttempt(
      `invite:preview:user:${user.id}`,
      MAX_ATTEMPTS_PER_USER,
      RATE_WINDOW_SEC,
    );

    if (!byUser.allowed) {
      return tooManyAttempts(byUser.retryAfterSec);
    }

    const { clientIp } = getClientIpAndPrefix(await headers());
    const byIp = await consumeAttempt(
      `invite:preview:ip:${clientIp}`,
      MAX_ATTEMPTS_PER_IP,
      RATE_WINDOW_SEC,
    );

    if (!byIp.allowed) {
      return tooManyAttempts(byIp.retryAfterSec);
    }

    const invite = await getAccountInvitePreviewByCode(code);

    if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
      // One response for "no such code", "expired" and "already used" — the
      // same wording `accept-invite` uses, for the same reason: the three
      // must not be distinguishable.
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 },
      );
    }

    // Told to the caller only about an account they can already see. Without
    // it the app would offer a Join that is certain to fail, since redemption
    // refuses a member who is already in.
    const alreadyMember = await userHasAccessToAccount(
      user.id,
      invite.accountId,
    );

    return NextResponse.json({
      data: {
        accountId: invite.accountId,
        accountName: invite.account.name,
        currencyCode: invite.account.currency.name,
        inviterName: invite.createdBy.name,
        memberCount: invite.account._count.userAccess,
        expiresAt: invite.expiresAt.toISOString(),
        alreadyMember,
      },
    });
  } catch (error) {
    console.error("Error reading invite:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
