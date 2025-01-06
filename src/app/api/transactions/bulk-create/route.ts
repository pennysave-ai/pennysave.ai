import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { v4 as uuid } from "uuid";
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
      console.error(validationResult.error);
      return NextResponse.json("Bad Request", { status: 400 });
    }
  }

  // Prepare data for bulk creation
  const transactionsToCreate = body.map((transaction: any) => ({
    id: uuid(),
    ...transaction,
  }));

  try {
    await db.transaction.createMany({
      data: transactionsToCreate,
    });
    return NextResponse.json({ data: transactionsToCreate });
  } catch (error) {
    console.error("Error creating transactions:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
