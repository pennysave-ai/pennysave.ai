import { NextRequest, NextResponse, after } from "next/server";
import { subDays, parse, endOfDay } from "date-fns";

import { getTransactionsSchema, updateTransactionSchema } from "@/schemas";
import {
  createTransaction,
  getUserTransactionsCountByAccount,
  deleteTransactions,
  updateTransaction,
  getUserTransactions,
  getTransactionAuthors,
  getTransactionAccounts,
  categoriesBelongToUser,
  placeTransaction,
} from "@/data/transactions";
import { getUsersWithAccessToAccount } from "@/data/userAccounts";
import { accountWriteRefusal, getAccountWriteAccess } from "@/data/accounts";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  notifyTransactionChanged,
  notifyTransactionsDeleted,
} from "@/lib/transactionEvents";
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
    const count = await getUserTransactionsCountByAccount(
      user.id!,
      startDate,
      endOfDay(endDate),
      validationResult.data?.globalFilter?.trim()
    );
    return NextResponse.json({ data: transactions, meta: { count } });
  } catch (e) {
    console.error(e);
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
    // Only onto an account they are on, and not one paused for them.
    const access = await getAccountWriteAccess(user.id, [payload?.accountId]);
    if (access !== "ok") return accountWriteRefusal(access);
    // A transaction only ever stores its author's own category.
    if (!(await categoriesBelongToUser([payload?.categoryId], user.id))) {
      return NextResponse.json("Bad Request", { status: 400 });
    }
    const newTransaction = await createTransaction(
      payload,
      user.email!,
      user?.name || "Customer",
      user.id
    );
    // Fetch users who have access to the account
    const usersWithAccess = await getUsersWithAccessToAccount(
      payload.accountId
    );

    // Sent after the response: the socket server can take long enough to
    // wake that waiting would time this request out. `after`, not a bare
    // unawaited promise, which a serverless host may stop once the response
    // is out — losing the event with no error anywhere.
    const actorId = user.id;
    after(() =>
      notifyTransactionChanged(
        BroadcastType.TRANSACTION_CREATED,
        newTransaction,
        usersWithAccess,
        actorId,
      ),
    );
    return NextResponse.json(newTransaction);
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
    // Only the author can delete; a co-member's rows are read-only.
    const authors = await getTransactionAuthors(body.ids, user.id);
    if ([...authors.values()].some((authorId) => authorId !== user.id)) {
      return NextResponse.json("Forbidden", { status: 403 });
    }
    // Read first: once the rows are gone nothing says whose accounts they
    // were on.
    const accounts = await getTransactionAccounts(body.ids, user.id);
    // A paused account is read-only for its members, deletes included.
    if (accounts.size) {
      const access = await getAccountWriteAccess(user.id, [
        ...new Set(accounts.values()),
      ]);
      if (access !== "ok") return accountWriteRefusal(access);
    }
    const data = await deleteTransactions(body.ids, user.id);
    const recipients = await Promise.all(
      [...new Set(accounts.values())].map(getUsersWithAccessToAccount),
    );
    // After the response, for the same reason as in POST.
    const actorId = user.id;
    after(() =>
      notifyTransactionsDeleted(
        [...accounts.keys()],
        [...new Set(recipients.flat())],
        actorId,
      ),
    );
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

    const authorId = (await getTransactionAuthors([id], user.id)).get(id);
    if (!authorId) {
      return NextResponse.json("Not Found", { status: 404 });
    }
    // Only the author edits the row. Anyone else may only file it, and that
    // pick is theirs alone; any other change is refused.
    if (authorId !== user.id) {
      const placed = await placeTransaction(id, user.id, categoryId || null, {
        amount,
        payee,
        notes,
        accountId,
        createdAt,
      });
      if (!placed.ok) {
        return NextResponse.json(
          placed.status === 404
            ? "Not Found"
            : placed.status === 400
              ? "Bad Request"
              : "Forbidden",
          { status: placed.status },
        );
      }
      return NextResponse.json(placed.transaction);
    }
    // A transaction only ever stores its author's own category.
    if (!(await categoriesBelongToUser([categoryId], user.id))) {
      return NextResponse.json("Bad Request", { status: 400 });
    }

    const previousAccountId = (await getTransactionAccounts([id], user.id)).get(
      id,
    );
    // Both ends of a move: off a paused account is an edit to it too.
    const access = await getAccountWriteAccess(
      user.id,
      [accountId, previousAccountId].filter((id): id is string => !!id),
    );
    if (access !== "ok") return accountWriteRefusal(access);
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

    // Everyone on the row's account gets the edit. When it moved accounts,
    // anyone on the old one only can no longer see it, so for them it is a
    // delete. After the response, for the same reason as in POST.
    const [current, previous] = await Promise.all([
      getUsersWithAccessToAccount(accountId),
      previousAccountId && previousAccountId !== accountId
        ? getUsersWithAccessToAccount(previousAccountId)
        : Promise.resolve([] as string[]),
    ]);
    const actorId = user.id;
    after(() =>
      Promise.all([
        notifyTransactionChanged(
          BroadcastType.TRANSACTION_UPDATED,
          transaction,
          current,
          actorId,
        ),
        notifyTransactionsDeleted(
          [id],
          previous.filter((userId) => !current.includes(userId)),
          actorId,
        ),
      ]),
    );

    return NextResponse.json({ ...transaction });
  } catch {
    return NextResponse.json("Error while updating transaction", {
      status: 500,
    });
  }
}
