import { NextRequest, NextResponse, after } from "next/server";
import {
  createAccount,
  deleteAccounts,
  updateAccount,
  getUserAccounts,
  getUserAccountsCount,
} from "@/data/accounts";
import { accountSchema } from "@/schemas";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  getAccountMembers,
  getOwnedAccountIds,
  notifyAccountRemoved,
  notifyAccountUpdated,
} from "@/lib/accountEvents";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    // `includePaused=true`: also a member's accounts whose owner has lapsed,
    // marked `paused`. Only clients that know to keep them read-only ask.
    const includePaused =
      req.nextUrl.searchParams.get("includePaused") === "true";
    const data = await getUserAccounts(user.id, { includePaused });
    const count = await getUserAccountsCount(user.id);
    return NextResponse.json({ data, meta: { count } });
  } catch {
    return NextResponse.json("Error while fetching accounts", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  try {
    const newAccount = await createAccount(
      body.name,
      user.id,
      body.currencyId,
      body.institutionName,
    );
    return NextResponse.json(newAccount);
  } catch {
    return NextResponse.json("Error while creating account", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.ids) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  try {
    // Read first: once the accounts are gone nobody is listed on them. Only
    // the ones this user owns, which are all the delete removes.
    const owned = await getOwnedAccountIds(body.ids, user.id);
    const members = await Promise.all(
      owned.map(async (id) => ({ id, members: await getAccountMembers([id]) })),
    );
    const deletedAcounts = await deleteAccounts(body.ids, user.id);
    const actorId = user.id;
    after(() =>
      Promise.all(
        members.map(({ id, members }) =>
          notifyAccountRemoved(id, members, actorId),
        ),
      ),
    );
    return NextResponse.json({ data: deletedAcounts });
  } catch {
    return NextResponse.json("Error while deleting accounts", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const validationResult = accountSchema.safeParse({
    id: body.id,
    name: body.name,
    currencyId: body.currencyId,
  });

  if (!validationResult.success) {
    return NextResponse.json("Bad Request", { status: 400 });
  }

  try {
    const { id, name, currencyId, institutionName } = body;
    const account = await updateAccount(
      id,
      name,
      currencyId,
      user.id,
      institutionName,
    );
    const actorId = user.id;
    after(() => notifyAccountUpdated(id, actorId));
    return NextResponse.json(account);
  } catch {
    return NextResponse.json("Error while updating account", { status: 500 });
  }
}
