import { NextRequest, NextResponse } from "next/server";
import { subDays, parse, endOfDay } from "date-fns";

import { getTransactionsSchema, updateTransactionSchema } from "@/schemas";
import {
  createTransaction,
  getUserTransactionsCountByAccount,
  deleteTransactions,
  updateTransaction,
  getUserTransactions,
} from "@/data/transactions";
import { getAuthenticatedUser } from "@/auth.helper";
import { sendWebSocketMessage } from "@/lib/websocket";
import { BroadcastType } from "@/wstypes";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.id) {
      return NextResponse.json("Unautorized", { status: 401 });
    }
    const searchParams = req.nextUrl.searchParams;
    const validationResult = getTransactionsSchema.safeParse({
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortDirection: searchParams.get("sortDirection"),
      globalFilter: searchParams.get("globalFilter"),
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      start: searchParams.get("start"),
      end: searchParams.get("end"),
      accountId: searchParams.get("accountId") || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json("Bad Request", { status: 400 });
    }

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);

    const startDate = validationResult.data?.start
      ? parse(validationResult.data?.start, "yyyy-MM-dd", new Date())
      : defaultFrom;
    const endDate = validationResult.data?.end
      ? parse(validationResult.data?.end, "yyyy-MM-dd", new Date())
      : defaultTo;
    // If notes is empty, return empty string
    const transactions = await getUserTransactions(
      user.id!,
      startDate,
      endOfDay(endDate),
      validationResult.data?.sortBy || "createdAt",
      validationResult.data?.sortDirection || "ascending",
      validationResult.data?.globalFilter?.trim(),
      validationResult.data?.accountId || undefined,
      validationResult.data?.page
        ? parseInt(validationResult.data?.page, 10)
        : 1,
      validationResult.data?.pageSize
        ? parseInt(validationResult.data?.pageSize, 10)
        : 10
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
          name: transaction.account.institution.name,
        },
      },
    }));
    const count = await getUserTransactionsCountByAccount(
      user.id!,
      startDate,
      endOfDay(endDate),
      validationResult.data?.globalFilter?.trim()
    );
    return NextResponse.json({ data: sanitizedTransactions, meta: { count } });
  } catch (e) {
    return NextResponse.json(`Error while fetching transactions ${e}`, {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
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
    // Send WebSocket message to notify clients about the new transaction
    await sendWebSocketMessage(
      {
        type: BroadcastType.TRANSACTION_CREATED,
        recipients: [user.id],
        data: {
          ...newTransaction,
        },
      },
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
  const user = await getAuthenticatedUser(req);
  const body = await req.json();
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  if (!body.ids) {
    return NextResponse.json("Bad Request", { status: 400 });
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
  const user = await getAuthenticatedUser(req);
  const body = await req.json();
  if (!user || !user.id) {
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
