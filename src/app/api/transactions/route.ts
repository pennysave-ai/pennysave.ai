import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { v4 as uuid } from "uuid";
import {
  getTransactionsSchema,
  updateTransactionSchema,
  createTransactionSchema,
} from "@/schemas";
import { subDays, parse } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  const { searchParams } = req.nextUrl;

  const to = searchParams.get("to") || undefined;
  const from = searchParams.get("from") || undefined;
  const accountId = searchParams.get("accountId") || undefined;

  const validationResult = getTransactionsSchema.safeParse({
    from,
    to,
    accountId,
  });

  if (!validationResult.success) {
    console.log(validationResult.error);
    return NextResponse.json("Bad Request", { status: 400 });
  }

  const defaultTo = new Date();
  const defaultFrom = subDays(defaultTo, 30);

  const startDate = from ? parse(from, "yyyy-MM-dd", new Date()) : defaultFrom;
  const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

  // if notes is empty, return empty string
  const transactions = await db.transaction.findMany({
    select: {
      id: true,
      amount: true,
      payee: true,
      notes: true,
      createdAt: true,
      account: {
        select: {
          id: true,
          name: true,
          currency: { select: { symbol: true, name: true } },
        },
      },
      category: {
        select: { id: true, name: true },
      },
    },
    where: {
      accountId: accountId,
      account: {
        userId: user.id,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert nulls to empty strings
  const sanitizedTransactions = transactions.map((transaction) => ({
    ...transaction,
    payee: transaction.payee ?? "",
    notes: transaction.notes ?? "",
  }));

  const count = await db.transaction.count({
    where: {
      accountId: accountId,
      account: {
        userId: user.id,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return NextResponse.json({ data: sanitizedTransactions, meta: { count } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const { amount, payee, notes, accountId, categoryId, createdAt } =
    await req.json();
  const id = uuid();

  const validationResult = createTransactionSchema.safeParse({
    id,
    amount,
    payee,
    notes,
    accountId,
    categoryId,
    createdAt,
  });
  if (!validationResult.success) {
    console.log(validationResult.error.flatten().fieldErrors);
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const transaction = await db.transaction.create({
    data: {
      id,
      amount,
      payee,
      notes,
      accountId,
      categoryId,
      createdAt,
    },
  });
  return NextResponse.json({ data: transaction });
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

  const accounts = await db.transaction.deleteMany({
    where: {
      id: { in: body.ids },
      account: {
        userId: user.id,
      },
    },
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
  const validationResult = updateTransactionSchema.safeParse({
    id: body.id,
    amount: body.amount,
    payee: body.payee,
    notes: body.notes,
    accountId: body.accountId,
    createdAt: body.createdAt,
    categoryId: body.categoryId,
  });

  if (!validationResult.success) {
    return NextResponse.json("Bad Request", { status: 400 });
  }

  const { id, amount, payee, notes, accountId, createdAt, categoryId } =
    validationResult.data;

  const transaction = await db.transaction.update({
    where: { id, account: { userId: user.id } },
    data: {
      amount,
      payee,
      notes,
      accountId,
      createdAt,
      categoryId,
    },
  });

  return NextResponse.json({ data: transaction });
}
