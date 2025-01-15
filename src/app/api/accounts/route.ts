import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { v4 as uuid } from "uuid";
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
  const accounts = await db.userAccount.findMany({
    select: {
      id: true,
      name: true,
      currency: {
        select: { id: true, name: true, symbol: true },
      },
    },
    where: { userId: user.id },
  });
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
  const validationResult = accountSchema.safeParse({
    name: body.name,
    currencyId: body.currencyId,
  });
  if (!validationResult.success) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const account = await db.userAccount.create({
    data: {
      id: uuid(),
      name: body.name,
      userId: user.id,
      plaidId: body.plaidId,
      currencyId: body.currencyId,
    },
  });
  return NextResponse.json({ data: account });
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
    data: { name: body.name, currencyId: body.currencyId },
  });

  return NextResponse.json({ data: accounts });
}
