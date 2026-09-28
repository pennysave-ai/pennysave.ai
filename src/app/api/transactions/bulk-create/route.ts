import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  bulkCreateTransactions,
  categoriesBelongToUser,
} from "@/data/transactions";
import { v4 as uuid } from "uuid";
import { accountWriteRefusal, getAccountWriteAccess } from "@/data/accounts";
import { bulkCreateTransactionsSchema } from "@/schemas";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  const body = await req.json();

  // Validating each item in the array
  for (let i = 0; i < body.length; i++) {
    const validationResult = bulkCreateTransactionsSchema.safeParse(body[i]);
    if (!validationResult.success) {
      return NextResponse.json("Bad Request", { status: 400 });
    }
  }

  if (body.length) {
    const access = await getAccountWriteAccess(
      user.id,
      body.map((transaction: { accountId: string }) => transaction.accountId),
    );
    if (access !== "ok") return accountWriteRefusal(access);
  }

  // A transaction only ever stores its author's own category.
  const categoryIds = body.map(
    (transaction: { categoryId?: string | null }) => transaction.categoryId,
  );
  if (!(await categoriesBelongToUser(categoryIds, user.id))) {
    return NextResponse.json("Bad Request", { status: 400 });
  }

  // Prepare data for bulk creation
  const transactionsToCreate = body.map(
    (transaction: { [key: string]: string }) => ({
      id: uuid(),
      ...transaction,
    })
  );

  try {
    await bulkCreateTransactions(transactionsToCreate, user.id);
    return NextResponse.json({ data: transactionsToCreate });
  } catch {
    return NextResponse.json("Error creating transactions", { status: 500 });
  }
}
