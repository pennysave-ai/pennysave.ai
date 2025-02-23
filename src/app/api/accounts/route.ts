import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  createAccount,
  deleteAccounts,
  updateAccount,
  getUserAccounts,
  getUserAccountsNumber,
} from "@/data/accounts";
import { accountSchema } from "@/schemas";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const data = await getUserAccounts(user.id);
    const accounts = data.map((account) => ({
      id: account.id,
      name: account.name,
      currency: {
        id: account.currency.id,
        name: account.currency.name,
        symbol: account.currency.symbol,
      },
      institution: {
        name: account.institutionName,
        color: account?.plaidItem?.institutionPrimaryColor || null,
        mask: account.plaidMask,
      },
    }));
    const count = await getUserAccountsNumber(user.id);
    return NextResponse.json({ data: accounts, meta: { count } });
  } catch {
    return NextResponse.json("Error while fetching accounts", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const newAccount = await createAccount(
      body.name,
      user.id,
      body.currencyId,
      body.institutionName
    );
    return NextResponse.json({ data: newAccount });
  } catch {
    return NextResponse.json("Error while creating account", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.ids) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  try {
    const deletedAcounts = await deleteAccounts(body.ids, user.id);
    return NextResponse.json({ data: deletedAcounts });
  } catch {
    return NextResponse.json("Error while deleting accounts", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
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
      institutionName
    );
    return NextResponse.json({ data: account });
  } catch {
    return NextResponse.json("Error while updating account", { status: 500 });
  }
}
