import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { getUserAccounts } from "@/data/accounts";
import {
  createAccountInvite,
  inviteCacheKey,
  INVITE_TTL_MS,
} from "@/data/accountInvites";
import { client } from "@/lib/redis";

// Matches the invite row's own lifetime, so a cached code is never handed out
// after the invite behind it has expired.
const CACHE_EXPIRATION = INVITE_TTL_MS / 1000; // 15 minutes

const inviteLinkFor = (code: string) =>
  `${process.env.NEXT_PUBLIC_URL}/invite/${code}`;

/**
 * Either the account id to work with, or the response to send back instead —
 * the optional-`undefined` halves are what let `if (resolved.error)` narrow.
 */
type ResolvedAccount =
  | { error: NextResponse; accountId?: undefined }
  | { error?: undefined; accountId: string };

/**
 * Resolves the account the caller wants an invite for, or the response to
 * send back instead. Only the owner of an account may invite to it.
 */
async function resolveOwnedAccount(
  userId: string,
  accountId: unknown
): Promise<ResolvedAccount> {
  if (typeof accountId !== "string" || !accountId) {
    return { error: NextResponse.json("accountId is required", { status: 400 }) };
  }

  const accounts = await getUserAccounts(userId);
  const account = accounts.find(({ id }) => id === accountId);

  if (!account) {
    return { error: NextResponse.json("Forbidden", { status: 403 }) };
  }

  const isOwner = account.users.some(
    (access) => access.id === userId && access.role === "owner"
  );

  if (!isOwner) {
    return { error: NextResponse.json("Forbidden", { status: 403 }) };
  }

  return { accountId };
}

/**
 * Mints an invite for a single account, on demand — the app calls this when
 * the user actually presses Invite, so there is exactly one account in play.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const resolved = await resolveOwnedAccount(user.id, body?.accountId);

    if (resolved.error) {
      return resolved.error;
    }

    const { accountId } = resolved;
    const cacheKey = inviteCacheKey(accountId);

    // An invite that is still live is reused rather than replaced, so a link
    // already sent out keeps working.
    const cachedInvite = await client.get(cacheKey);

    if (cachedInvite) {
      const invite = JSON.parse(cachedInvite);
      console.log("✅ Returning cached invite for account:", accountId);

      return NextResponse.json({
        data: {
          accountId,
          inviteCode: invite.code,
          inviteLink: inviteLinkFor(invite.code),
          expiresAt: invite.expiresAt,
        },
      });
    }

    const invite = await createAccountInvite({
      accountId,
      createdById: user.id,
    });

    const inviteData = {
      code: invite.code,
      expiresAt: invite.expiresAt.toISOString(),
    };

    await client.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(inviteData));

    console.log("✅ Created new invite for account:", accountId);

    return NextResponse.json({
      data: {
        accountId,
        inviteCode: invite.code,
        inviteLink: inviteLinkFor(invite.code),
        expiresAt: inviteData.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Reads back the invite an account already has, without minting one.
 * `GET /api/accounts/generate-invite?accountId=…`
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolved = await resolveOwnedAccount(
      user.id,
      req.nextUrl.searchParams.get("accountId")
    );

    if (resolved.error) {
      return resolved.error;
    }

    const { accountId } = resolved;
    const cachedInvite = await client.get(inviteCacheKey(accountId));

    if (!cachedInvite) {
      return NextResponse.json({
        data: {
          accountId,
          inviteCode: null,
          inviteLink: null,
          exists: false,
        },
      });
    }

    const invite = JSON.parse(cachedInvite);

    return NextResponse.json({
      data: {
        accountId,
        inviteCode: invite.code,
        inviteLink: inviteLinkFor(invite.code),
        expiresAt: invite.expiresAt,
        exists: true,
      },
    });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
