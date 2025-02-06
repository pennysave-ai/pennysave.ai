import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { createAccount } from "@/data/accounts";
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
  const data = await db.userAccount.findMany({
    select: {
      id: true,
      name: true,
      currency: {
        select: { id: true, name: true, symbol: true },
      },
      institutionName: true,
      plaidMask: true,
      plaidItem: {
        select: {
          institutionName: true,
          institutionPrimaryColor: true,
        },
      },
    },
    where: { userId: user.id },
  });
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
  const count = await db.userAccount.count({ where: { userId: user.id } });
  return NextResponse.json({ data: accounts, meta: { count } });
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
    return NextResponse.json("Bad Request", { status: 400 });
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

  const accounts = await db.userAccount.deleteMany({
    where: { id: { in: body.ids }, userId: user.id },
  });

  return NextResponse.json({ data: accounts });
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

  const accounts = await db.userAccount.update({
    where: { id: body.id, userId: user.id },
    data: {
      name: body.name,
      currencyId: body.currencyId,
      institutionName: body.institutionName,
    },
  });

  return NextResponse.json({ data: accounts });
}
