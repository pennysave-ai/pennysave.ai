import { NextRequest, NextResponse } from "next/server";
import {
  createAccount,
  deleteAccounts,
  updateAccount,
  getUserAccounts,
  getUserAccountsCount,
} from "@/data/accounts";
import { accountSchema } from "@/schemas";
import { getAuthenticatedUser } from "@/auth.helper";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
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
        exchangeRate: account.currency.exchangeRate,
      },
      institution: {
        name: account.institutionName,
        last4: account.last4,
      },
    }));
    const count = await getUserAccountsCount(user.id);
    return NextResponse.json({ data: accounts, meta: { count } });
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
      body.institutionName
    );
    return NextResponse.json({ data: newAccount });
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
  try {
    const deletedAcounts = await deleteAccounts(body.ids, user.id);
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
      institutionName
    );
    return NextResponse.json({ data: account });
  } catch {
    return NextResponse.json("Error while updating account", { status: 500 });
  }
}
