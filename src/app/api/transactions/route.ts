import { NextRequest, NextResponse } from "next/server";
import { subDays, parse, endOfDay } from "date-fns";

import { auth } from "@/auth";
import { getTransactionsSchema, updateTransactionSchema } from "@/schemas";
import {
  createTransaction,
  getUserTransactionsCountByAccount,
  deleteTransactions,
  updateTransaction,
  getUserTransactionsByAccountandCreatedDate,
} from "@/data/transactions";

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
    return NextResponse.json("Bad Request", { status: 400 });
  }

  try {
    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);

    const startDate = from
      ? parse(from, "yyyy-MM-dd", new Date())
      : defaultFrom;
    const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;
    // if notes is empty, return empty string
    const transactions = await getUserTransactionsByAccountandCreatedDate(
      user.id!,
      accountId!,
      startDate,
      endOfDay(endDate)
    );

    // Convert nulls to empty strings
    const sanitizedTransactions = transactions.map((transaction) => ({
      ...transaction,
      payee: transaction.payee ?? "",
      notes: transaction.notes ?? "",
      account: {
        id: transaction.account.id,
        name: transaction.account.name,
        currency: {
          ...transaction.account.currency,
        },
        last4: transaction.account.last4,
        institution: {
          name: transaction.account.institutionName,
        },
      },
    }));
    const count = await getUserTransactionsCountByAccount(
      user.id!,
      accountId!,
      startDate,
      endOfDay(endDate)
    );
    return NextResponse.json({ data: sanitizedTransactions, meta: { count } });
  } catch {
    return NextResponse.json("Error while fetching transactions", {
      status: 500,
    });
  }
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
  const payload = await req.json();
  try {
    const newTransaction = await createTransaction(
      payload,
      user.email!,
      user?.name || "Customer",
      user.id
    );
    return NextResponse.json({ data: newTransaction });
  } catch {
    return NextResponse.json("Error while creating a new transaction", {
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
  try {
    const data = await deleteTransactions(body.ids, user.id);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json("Error while deleting transactions", {
      status: 500,
    });
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
  try {
    const { id, amount, payee, notes, accountId, createdAt, categoryId } =
      validationResult.data;

    const transaction = await updateTransaction(
      id,
      user.id,
      user.email!,
      user.name!,
      {
        amount,
        payee: payee || "",
        notes,
        accountId,
        createdAt,
        categoryId: categoryId ? categoryId : null,
      }
    );

    return NextResponse.json({ data: transaction });
  } catch {
    return NextResponse.json("Error while updating transaction", {
      status: 500,
    });
  }
}
