import crypto from "crypto";
import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { getUserAccounts } from "@/data/accounts";
import { createAccountInvite } from "@/data/accountInvites";
import { client } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all accounts where user is owner
    const accounts = await getUserAccounts(user.id);
    const ownedAccounts = accounts.filter((account) =>
      account.userAccess.some(
        (access) => access.userId === user.id && access.role === "owner"
      )
    );

    if (ownedAccounts.length === 0) {
      return NextResponse.json({
        invites: [],
        message: "No owned accounts found",
      });
    }

    // Generate invites for all owned accounts
    const invites = await Promise.all(
      ownedAccounts.map(async (account) => {
        const accountId = account.id;
        const cacheKey = `invite:active:${accountId}`;

        // Check cache first
        const cachedInvite = await client.get(cacheKey);

        if (cachedInvite) {
          const invite = JSON.parse(cachedInvite);
          console.log("✅ Returning cached invite for account:", accountId);

          return {
            accountId,
            inviteLink: `${process.env.NEXT_PUBLIC_URL}/invite/${invite.token}`,
          };
        }

        // No cached invite - generate new one
        const token = crypto.randomBytes(32).toString("hex");

        // Create invite in database
        await createAccountInvite({
          accountId,
          createdById: user.id!,
          token,
        });

        // Cache the invite
        const inviteData = { token };
        const cacheExpiration = 7 * 24 * 60 * 60; // 7 days

        await client.setEx(
          cacheKey,
          cacheExpiration,
          JSON.stringify(inviteData)
        );

        console.log("✅ Created new invite for account:", accountId);

        return {
          accountId,
          inviteLink: `${process.env.NEXT_PUBLIC_URL}/invite/${token}`,
        };
      })
    );

    return NextResponse.json({
      data: invites,
    });
  } catch (error) {
    console.error("Error creating invites:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Optional: Add GET endpoint to just retrieve existing invites without creating new ones
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all accounts where user is owner
    const accounts = await getUserAccounts(user.id);
    const ownedAccounts = accounts.filter((account) =>
      account.userAccess.some(
        (access) => access.userId === user.id && access.role === "owner"
      )
    );

    // Get cached invites (if they exist)
    const invites = await Promise.all(
      ownedAccounts.map(async (account) => {
        const accountId = account.id;
        const cacheKey = `invite:active:${accountId}`;
        const cachedInvite = await client.get(cacheKey);

        if (cachedInvite) {
          const invite = JSON.parse(cachedInvite);
          return {
            accountId,
            accountName: account.name,
            inviteLink: `${process.env.NEXT_PUBLIC_URL}/invite/${invite.token}`,
            exists: true,
          };
        }

        return {
          accountId,
          accountName: account.name,
          inviteLink: null,
          exists: false,
        };
      })
    );

    return NextResponse.json({
      invites,
      count: invites.length,
    });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
