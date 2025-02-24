import { NextRequest, NextResponse } from "next/server";
import { subDays, parse, endOfDay } from "date-fns";

import { auth } from "@/auth";
import { db } from "@/db";
import { getTransactionsSchema, updateTransactionSchema } from "@/schemas";
import { createTransaction } from "@/data/transactions";

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
      logo: true,
      account: {
        select: {
          id: true,
          name: true,
          plaidMask: true,
          institutionName: true,
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
        lte: endOfDay(endDate),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert nulls to empty strings
  const sanitizedTransactions = transactions.map((transaction) => ({
    ...transaction,
    payee: transaction.payee ?? "",
    notes: transaction.notes ?? "",
    logo: transaction.logo,
    account: {
      id: transaction.account.id,
      name: transaction.account.name,
      currency: {
        ...transaction.account.currency,
      },
      mask: transaction.account.plaidMask,
      institution: {
        name: transaction.account.institutionName,
      },
    },
  }));

  const count = await db.transaction.count({
    where: {
      accountId: accountId,
      account: {
        userId: user.id,
      },
      createdAt: {
        gte: startDate,
        lte: endOfDay(endDate),
      },
    },
  });
  return NextResponse.json({ data: sanitizedTransactions, meta: { count } });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json("Unautorized", { status: 401 });
    }
    const user = session.user;
    if (!user.id) {
      return NextResponse.json("Unautorized", { status: 401 });
    }
    const payload = await req.json();
    const newTransaction = await createTransaction(payload);
    return NextResponse.json({ data: newTransaction });
  } catch {
    return NextResponse.json("Error while creating a  new transaction", {
      status: 500,
    });
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
      categoryId: categoryId ? categoryId : null,
    },
  });

  return NextResponse.json({ data: transaction });
}
